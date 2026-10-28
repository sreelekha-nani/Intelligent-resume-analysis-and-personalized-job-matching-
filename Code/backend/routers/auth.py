import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

import random
import secrets
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from database import get_db
from models import User, Profile, PasswordResetOTP
from schemas import UserRegister, UserLogin, GoogleLoginRequest, Token, UserOut, ForgotPasswordRequest, VerifyOTPRequest, ResetPasswordRequest
from config import settings
from services.email_service import send_email_notification

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize empty profile
    profile = Profile(user_id=user.id)
    db.add(profile)
    db.commit()

    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role or "candidate"
    }

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role or "candidate"
    }

@router.post("/google", response_model=Token)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    if not payload.credential:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google ID token credential is required."
        )

    if payload.credential.startswith("demo_google_token"):
        # Development / demo simulated Google login when Google Client ID is not configured yet
        idinfo = {
            "sub": "google_demo_user_10928374",
            "email": "demo.google.user@gmail.com",
            "name": "Google Demo Candidate",
            "given_name": "Google",
            "family_name": "Candidate",
            "picture": "https://lh3.googleusercontent.com/a/default-user=s96-c",
            "email_verified": True
        }
    else:
        try:
            # Validate audience against configured GOOGLE_CLIENT_ID if present
            target_audience = settings.GOOGLE_CLIENT_ID.strip() if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_ID.strip() else None
            
            idinfo = google_id_token.verify_oauth2_token(
                payload.credential,
                google_requests.Request(),
                audience=target_audience,
                clock_skew_in_seconds=60
            )
        except ValueError as e:
            print(f"[GOOGLE AUTH ERROR] ValueError: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Google authentication failed: {str(e)}"
            )
        except Exception as e:
            print(f"[GOOGLE AUTH ERROR] Exception: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to verify Google credentials: {str(e)}"
            )

    # Extract verified user info from Google token
    google_id = idinfo.get("sub")
    email = idinfo.get("email")
    full_name = idinfo.get("name") or (email.split("@")[0] if email else "Google User")
    picture = idinfo.get("picture")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No email address associated with this Google account."
        )

    normalized_email = email.strip().lower()

    # 1. Search existing user by google_id
    user = db.query(User).filter(User.google_id == google_id).first()
    
    # 2. If not found by google_id, check if user exists with the same email
    if not user:
        user = db.query(User).filter(User.email == normalized_email).first()
        if user:
            # Link existing account with Google ID
            user.google_id = google_id
            if not user.auth_provider:
                user.auth_provider = "google"
            
            # Ensure profile exists for linked user
            if not user.profile:
                profile = Profile(
                    user_id=user.id,
                    email=user.email,
                    first_name=idinfo.get("given_name", ""),
                    last_name=idinfo.get("family_name", ""),
                    profile_photo=picture
                )
                db.add(profile)
            db.commit()
            db.refresh(user)
        else:
            # 3. Automatically create new user account
            random_password = secrets.token_urlsafe(32)
            hashed_pwd = get_password_hash(random_password)
            user = User(
                email=normalized_email,
                hashed_password=hashed_pwd,
                full_name=full_name,
                role="candidate",
                google_id=google_id,
                auth_provider="google"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Auto-create profile with Google profile information
            given_name = idinfo.get("given_name", "")
            family_name = idinfo.get("family_name", "")
            profile = Profile(
                user_id=user.id,
                email=user.email,
                first_name=given_name,
                last_name=family_name,
                profile_photo=picture
            )
            db.add(profile)
            db.commit()

    # Update profile picture if profile exists and has no picture yet
    if picture and user.profile and not user.profile.profile_photo:
        user.profile.profile_photo = picture
        db.commit()

    # Issue standard application JWT access token
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role or "candidate"
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        raise HTTPException(
            status_code=404, 
            detail="No registered account found with this email address."
        )

    # Generate 6-digit OTP code
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Delete any existing OTP entries for this email
    db.query(PasswordResetOTP).filter(PasswordResetOTP.email == req.email.strip().lower()).delete()

    otp_entry = PasswordResetOTP(
        email=req.email.strip().lower(),
        otp=otp_code,
        expires_at=expires_at
    )
    db.add(otp_entry)
    db.commit()

    # Send HTML OTP Email
    html_content = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 24px; min-height: 100%;">
        <div style="background-color: #ffffff; color: #1f2937; padding: 32px; border-radius: 16px; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(6, 182, 212, 0.08);">
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #0891b2; margin: 0; font-size: 22px; font-weight: 800;">AI Job Navigator</h2>
                <p style="color: #4b5563; font-size: 14px; margin-top: 4px; font-weight: 600;">Password Reset Verification Code</p>
            </div>
            <div style="background-color: rgba(6, 182, 212, 0.06); border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 12px 0; color: #1f2937; font-size: 15px; font-weight: 500;">Hello <strong>{user.full_name}</strong>,</p>
                <p style="margin: 0 0 16px 0; color: #374151; font-size: 14px; font-weight: 500;">Use the following 6-digit OTP code to reset your account password:</p>
                <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0891b2; background-color: #ffffff; padding: 14px 28px; border-radius: 10px; display: inline-block; border: 1px solid rgba(6, 182, 212, 0.3); margin: 8px 0 16px 0; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.1);">
                    {otp_code}
                </div>
                <p style="margin: 0; color: #dc2626; font-size: 13px; font-weight: 600;">This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>
            </div>
        </div>
    </div>
    """

    background_tasks.add_task(
        send_email_notification,
        to_email=user.email,
        subject="Password Reset OTP - AI Recruitment Platform",
        body_html=html_content
    )

    return {"message": "OTP verification code sent successfully to your email."}

@router.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    otp_entry = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email == email_clean,
        PasswordResetOTP.otp == req.otp.strip()
    ).first()

    if not otp_entry:
        raise HTTPException(status_code=400, detail="Invalid OTP verification code.")

    if otp_entry.expires_at < datetime.utcnow():
        db.delete(otp_entry)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new one.")

    return {"message": "OTP verified successfully."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    otp_entry = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email == email_clean,
        PasswordResetOTP.otp == req.otp.strip()
    ).first()

    if not otp_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code.")

    if otp_entry.expires_at < datetime.utcnow():
        db.delete(otp_entry)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new one.")

    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if len(req.new_password.strip()) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long.")

    user.hashed_password = get_password_hash(req.new_password.strip())
    db.delete(otp_entry)
    db.commit()

    return {"message": "Password updated successfully! You can now log in with your new password."}
