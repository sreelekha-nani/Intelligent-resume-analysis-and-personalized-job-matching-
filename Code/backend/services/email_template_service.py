import datetime

def render_application_confirmation_email(context: dict) -> str:
    """
    Renders a clean, modern, pure white & cyan enterprise-grade HTML application confirmation email
    matching the frontend design system (Pure white background, cyan primary, semi-cyan secondary, gray text).
    """
    candidate_name = context.get("candidate_name") or "Candidate"
    job_title = context.get("job_title") or "Position"
    company_name = context.get("company_name") or "Company"
    location = context.get("location") or "Remote / Flexible"
    employment_type = context.get("employment_type") or "Full-time"
    experience_level = context.get("experience_level") or "Not Specified"
    application_id = context.get("application_id") or "N/A"
    applied_date = context.get("applied_date") or datetime.datetime.utcnow().strftime("%B %d, %Y at %I:%M %p UTC")
    application_status = context.get("application_status") or "Applied"
    resume_name = context.get("resume_name") or "Primary Resume"
    
    frontend_base = context.get("frontend_url", "http://localhost:3000").rstrip("/")
    dashboard_url = context.get("dashboard_url") or f"{frontend_base}/dashboard"
    applications_url = context.get("applications_url") or f"{frontend_base}/applications"
    jobs_url = context.get("jobs_url") or f"{frontend_base}/jobs"
    support_email = context.get("support_email") or "support@yourplatform.com"
    platform_name = context.get("platform_name") or "AI Job Placement Platform"
    recruiter_name = context.get("recruiter_name") or "Talent Acquisition Team"
    expected_response = context.get("expected_response_time") or "Most applications are reviewed within 5–7 business days."
    current_year = datetime.datetime.utcnow().year

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Application Received - {job_title}</title>
    <style>
        /* Resets & Core Styles */
        body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
        table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
        img {{ -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }}
        body {{ margin: 0; padding: 0; width: 100% !important; background-color: #f8fafc; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #1f2937; }}
        
        /* Interactive CTA Buttons */
        .btn-primary {{
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 14px;
            display: inline-block;
            text-align: center;
            box-shadow: 0 4px 14px rgba(6, 182, 212, 0.3);
            transition: all 0.2s ease;
        }}
        .btn-secondary {{
            background-color: rgba(6, 182, 212, 0.12);
            color: #0891b2 !important;
            border: 1px solid rgba(6, 182, 212, 0.25);
            text-decoration: none;
            padding: 12px 20px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 14px;
            display: inline-block;
            text-align: center;
            transition: all 0.2s ease;
        }}
        
        /* Mobile Responsive Rules */
        @media only screen and (max-width: 620px) {{
            .email-container {{ width: 100% !important; padding: 12px !important; }}
            .content-card {{ padding: 20px 16px !important; }}
            .summary-table td {{ display: block !important; width: 100% !important; box-sizing: border-box !important; padding-bottom: 8px !important; }}
            .summary-table td:last-child {{ padding-bottom: 14px !important; }}
            .cta-stack td {{ display: block !important; width: 100% !important; padding: 6px 0 !important; }}
            .btn-primary, .btn-secondary {{ display: block !important; width: 100% !important; box-sizing: border-box !important; }}
            .timeline-step {{ padding-left: 0 !important; margin-bottom: 12px !important; }}
        }}
    </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f8fafc;">

    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center">
                <!-- Main Wrapper -->
                <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(6, 182, 212, 0.08);">
                    
                    <!-- 1. HEADER SECTION -->
                    <tr>
                        <td align="center" style="padding: 36px 32px 24px 32px; background: linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, #ffffff 100%); border-bottom: 1px solid #e2e8f0;">
                            <!-- Platform Branding Logo -->
                            <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 10px; width: 44px; height: 44px; text-align: center; vertical-align: middle;">
                                        <span style="color: #ffffff; font-size: 22px; font-weight: bold; line-height: 44px;">✦</span>
                                    </td>
                                    <td style="padding-left: 12px; vertical-align: middle;">
                                        <div style="color: #1f2937; font-size: 18px; font-weight: 800; letter-spacing: -0.3px;">{platform_name}</div>
                                        <div style="color: #0891b2; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Smart Recommendation Platform</div>
                                    </td>
                                </tr>
                            </table>
                            
                            <h1 style="margin: 0 0 8px 0; color: #1f2937; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Application Received Successfully</h1>
                            <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5; font-weight: 500;">Thank you for applying. We've successfully received your application.</p>
                        </td>
                    </tr>

                    <!-- 2. GREETING SECTION -->
                    <tr>
                        <td class="content-card" style="padding: 32px; color: #1f2937;">
                            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #1f2937;">Hello <strong>{candidate_name}</strong>,</p>
                            <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #374151; font-weight: 500;">
                                Thank you for your interest in joining <strong style="color: #0891b2;">{company_name}</strong>. We have successfully received your application for the position detailed below.
                            </p>

                            <!-- 3. APPLICATION SUMMARY CARD -->
                            <div style="background-color: rgba(6, 182, 212, 0.05); border: 1px solid #e2e8f0; border-left: 4px solid #06b6d4; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                                <div style="color: #0891b2; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">
                                    APPLICATION SUMMARY
                                </div>
                                <table class="summary-table" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 10px 0; color: #4b5563; width: 40%; font-weight: 600;">Job Title</td>
                                        <td style="padding: 10px 0; color: #1f2937; font-weight: 800; width: 60%;">{job_title}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #4b5563; font-weight: 600; border-top: 1px solid #e2e8f0;">Company Name</td>
                                        <td style="padding: 10px 0; color: #0891b2; font-weight: 700; border-top: 1px solid #e2e8f0;">{company_name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #4b5563; font-weight: 600; border-top: 1px solid #e2e8f0;">Job Location</td>
                                        <td style="padding: 10px 0; color: #1f2937; border-top: 1px solid #e2e8f0;">{location}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #4b5563; font-weight: 600; border-top: 1px solid #e2e8f0;">Employment Type</td>
                                        <td style="padding: 10px 0; color: #1f2937; border-top: 1px solid #e2e8f0;">{employment_type}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #4b5563; font-weight: 600; border-top: 1px solid #e2e8f0;">Experience Level</td>
                                        <td style="padding: 10px 0; color: #1f2937; border-top: 1px solid #e2e8f0;">{experience_level}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #4b5563; font-weight: 600; border-top: 1px solid #e2e8f0;">Application ID</td>
                                        <td style="padding: 10px 0; color: #0891b2; font-family: monospace; font-size: 13px; font-weight: 700; border-top: 1px solid #e2e8f0;">{application_id}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #4b5563; font-weight: 600; border-top: 1px solid #e2e8f0;">Applied Date & Time</td>
                                        <td style="padding: 10px 0; color: #1f2937; border-top: 1px solid #e2e8f0;">{applied_date}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #4b5563; font-weight: 600; border-top: 1px solid #e2e8f0;">Application Status</td>
                                        <td style="padding: 10px 0; border-top: 1px solid #e2e8f0;">
                                            <span style="background-color: rgba(6, 182, 212, 0.12); color: #0891b2; border: 1px solid rgba(6, 182, 212, 0.3); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; display: inline-block;">{application_status}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #4b5563; font-weight: 600; border-top: 1px solid #e2e8f0;">Selected Resume</td>
                                        <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-top: 1px solid #e2e8f0;">📄 {resume_name}</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- 4. WHAT HAPPENS NEXT (PROFESSIONAL TIMELINE) -->
                            <div style="margin-bottom: 32px;">
                                <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 800; color: #1f2937;">What Happens Next</h2>
                                
                                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                                    <!-- Timeline Horizontal / Vertical Steps -->
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
                                        <tr>
                                            <td style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td width="32" align="center" style="background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #059669; border-radius: 50%; width: 28px; height: 28px; font-weight: bold; font-size: 12px;">✓</td>
                                                        <td style="padding-left: 12px;">
                                                            <div style="color: #059669; font-weight: 700;">Step 1: Application Received</div>
                                                            <div style="color: #4b5563; font-size: 12px;">Your submission has been logged into our ATS database.</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td width="32" align="center" style="background-color: rgba(6, 182, 212, 0.12); border: 1px solid rgba(6, 182, 212, 0.3); color: #0891b2; border-radius: 50%; width: 28px; height: 28px; font-weight: bold; font-size: 12px;">2</td>
                                                        <td style="padding-left: 12px;">
                                                            <div style="color: #1f2937; font-weight: 700;">Step 2: Recruiter Review</div>
                                                            <div style="color: #4b5563; font-size: 12px;">Hiring team evaluates your experience and skill alignment.</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td width="32" align="center" style="background-color: rgba(6, 182, 212, 0.12); border: 1px solid rgba(6, 182, 212, 0.3); color: #0891b2; border-radius: 50%; width: 28px; height: 28px; font-weight: bold; font-size: 12px;">3</td>
                                                        <td style="padding-left: 12px;">
                                                            <div style="color: #1f2937; font-weight: 700;">Step 3: Shortlisting</div>
                                                            <div style="color: #4b5563; font-size: 12px;">Qualified candidates are selected for initial outreach.</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td width="32" align="center" style="background-color: rgba(6, 182, 212, 0.12); border: 1px solid rgba(6, 182, 212, 0.3); color: #0891b2; border-radius: 50%; width: 28px; height: 28px; font-weight: bold; font-size: 12px;">4</td>
                                                        <td style="padding-left: 12px;">
                                                            <div style="color: #1f2937; font-weight: 700;">Step 4: Interview Process</div>
                                                            <div style="color: #4b5563; font-size: 12px;">Technical screens, panel interviews, and assessments.</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px 0;">
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td width="32" align="center" style="background-color: rgba(6, 182, 212, 0.12); border: 1px solid rgba(6, 182, 212, 0.3); color: #0891b2; border-radius: 50%; width: 28px; height: 28px; font-weight: bold; font-size: 12px;">5</td>
                                                        <td style="padding-left: 12px;">
                                                            <div style="color: #1f2937; font-weight: 700;">Step 5: Final Decision</div>
                                                            <div style="color: #4b5563; font-size: 12px;">Formal offer extension or candidate feedback.</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style="margin: 16px 0 0 0; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #374151; line-height: 1.5;">
                                        Our recruitment team will carefully review your application. If your profile matches our requirements, we'll contact you regarding the next steps.
                                        <br><span style="color: #0891b2; font-weight: 700; display: inline-block; margin-top: 6px;">⏱️ {expected_response}</span>
                                    </p>
                                </div>
                            </div>

                            <!-- 5. CANDIDATE TIPS -->
                            <div style="background-color: rgba(6, 182, 212, 0.05); border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
                                <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #0891b2;">While you wait:</h3>
                                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #374151; line-height: 1.7; font-weight: 500;">
                                    <li>Keep your platform profile updated with recent skills and projects.</li>
                                    <li>Ensure your resume reflects your latest experience and achievements.</li>
                                    <li>Check your registered email address regularly for notifications.</li>
                                    <li>Monitor your live application pipeline status anytime from your candidate dashboard.</li>
                                </ul>
                            </div>

                            <!-- 7. NEED HELP SECTION -->
                            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 18px; font-size: 13px; color: #4b5563; margin-bottom: 12px;">
                                <div style="font-weight: 800; color: #1f2937; font-size: 14px; margin-bottom: 4px;">Need assistance?</div>
                                <div>If you have questions regarding your application or technical support, please contact our support team at:</div>
                                <div style="margin-top: 6px; color: #0891b2; font-weight: 700;">
                                    Support Email: <a href="mailto:{support_email}" style="color: #0891b2; text-decoration: underline;">{support_email}</a>
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- 8. FOOTER SECTION -->
                    <tr>
                        <td align="center" style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 12px; line-height: 1.6;">
                            <p style="margin: 0 0 8px 0; color: #6b7280;">This is an automated email. Please do not reply directly to this message.</p>
                            <p style="margin: 0 0 12px 0; color: #1f2937; font-weight: 600;">© {current_year} {platform_name}. All rights reserved.</p>
                            <div>
                                <a href="{dashboard_url}" style="color: #0891b2; text-decoration: none; margin: 0 8px; font-weight: 600;">Privacy Policy</a> | 
                                <a href="{dashboard_url}" style="color: #0891b2; text-decoration: none; margin: 0 8px; font-weight: 600;">Terms of Service</a> | 
                                <a href="mailto:{support_email}" style="color: #0891b2; text-decoration: none; margin: 0 8px; font-weight: 600;">Contact Support</a>
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>
"""
