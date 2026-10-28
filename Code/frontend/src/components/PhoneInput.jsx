import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Check, AlertCircle } from 'lucide-react';

const COUNTRY_DATA = [
  { code: 'IN', name: 'India', dial_code: '+91', flag: '🇮🇳', length: 10, placeholder: '98765 43210' },
  { code: 'US', name: 'United States', dial_code: '+1', flag: '🇺🇸', length: 10, placeholder: '(555) 000-0000' },
  { code: 'GB', name: 'United Kingdom', dial_code: '+44', flag: '🇬🇧', length: 10, placeholder: '7123 456789' },
  { code: 'CA', name: 'Canada', dial_code: '+1', flag: '🇨🇦', length: 10, placeholder: '(555) 000-0000' },
  { code: 'AU', name: 'Australia', dial_code: '+61', flag: '🇦🇺', length: 9, placeholder: '400 000 000' },
  { code: 'DE', name: 'Germany', dial_code: '+49', flag: '🇩🇪', length: 11, placeholder: '151 12345678' },
  { code: 'FR', name: 'France', dial_code: '+33', flag: '🇫🇷', length: 9, placeholder: '6 12 34 56 78' },
  { code: 'UAE', name: 'United Arab Emirates', dial_code: '+971', flag: '🇦🇪', length: 9, placeholder: '50 123 4567' },
  { code: 'SG', name: 'Singapore', dial_code: '+65', flag: '🇸🇬', length: 8, placeholder: '8123 4567' },
  { code: 'JP', name: 'Japan', dial_code: '+81', flag: '🇯🇵', length: 10, placeholder: '90 1234 5678' },
];

export default function PhoneInput({ value = '', onChange, required = false, placeholder = '' }) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_DATA[0]);
  const [nationalNumber, setNationalNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!value) {
      setNationalNumber('');
      return;
    }

    const cleanVal = String(value).trim();
    const matched = COUNTRY_DATA.find(c => cleanVal.startsWith(c.dial_code));
    if (matched) {
      setSelectedCountry(matched);
      setNationalNumber(cleanVal.slice(matched.dial_code.length).trim());
    } else {
      setNationalNumber(cleanVal);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');
    emitFullNumber(country, nationalNumber);
  };

  const handleNumberChange = (e) => {
    const inputDigits = e.target.value.replace(/\D/g, '');
    setNationalNumber(inputDigits);
    emitFullNumber(selectedCountry, inputDigits);
  };

  const emitFullNumber = (country, numDigits) => {
    if (!numDigits) {
      if (onChange) onChange('');
      return;
    }
    const fullNumber = `${country.dial_code}${numDigits}`;
    if (onChange) onChange(fullNumber);
  };

  const filteredCountries = COUNTRY_DATA.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.dial_code.includes(searchQuery) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isValid = !nationalNumber || nationalNumber.length === selectedCountry.length;

  return (
    <div style={{ width: '100%', position: 'relative', zIndex: isOpen ? 99999 : 'auto' }} ref={dropdownRef}>
      {/* Outer Input Container */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          border: isFocused ? '1px solid #06b6d4' : '1px solid #cbd5e1',
          boxShadow: isFocused ? '0 0 0 3px rgba(6, 182, 212, 0.2)' : 'none',
          borderRadius: '10px',
          height: '46px',
          transition: 'all 0.2s ease',
          overflow: 'visible'
        }}
      >
        {/* Country Code Selector Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Select Country Code"
          style={{
            background: 'transparent',
            border: 'none',
            height: '100%',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '0.92rem',
            color: '#1f2937',
            outline: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>{selectedCountry.flag}</span>
          <span style={{ fontWeight: '700', color: '#1f2937' }}>{selectedCountry.dial_code}</span>
          <ChevronDown size={14} color="#6b7280" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {/* Subtle Vertical Divider */}
        <div style={{ width: '1px', height: '22px', background: '#cbd5e1', margin: '0 2px' }} />

        {/* Phone Number Input */}
        <input
          type="tel"
          required={required}
          value={nationalNumber}
          onChange={handleNumberChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || selectedCountry.placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#1f2937',
            fontSize: '0.95rem',
            fontWeight: '600',
            padding: '0 12px',
            outline: 'none',
            height: '100%'
          }}
        />
      </div>

      {/* Validation Hint */}
      {!isValid && nationalNumber.length > 0 && (
        <div style={{ fontSize: '0.78rem', color: '#d97706', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
          <AlertCircle size={12} /> {selectedCountry.name} phone number expects {selectedCountry.length} digits ({nationalNumber.length} entered)
        </div>
      )}

      {/* Searchable Country Code Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '320px',
            maxHeight: '300px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Search Header */}
          <div style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', background: 'rgba(6, 182, 212, 0.05)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#6b7280" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                autoFocus
                placeholder="Search country or code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 10px 8px 32px',
                  color: '#1f2937',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Country List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const isSelected = country.code === selectedCountry.code;
                return (
                  <div
                    key={country.code}
                    onClick={() => handleCountrySelect(country)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isSelected ? 'rgba(6, 182, 212, 0.18)' : 'rgba(6, 182, 212, 0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{country.flag}</span>
                      <span style={{ fontSize: '0.88rem', color: '#1f2937', fontWeight: '600' }}>{country.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#0891b2', fontWeight: '700' }}>{country.dial_code}</span>
                      {isSelected && <Check size={14} color="#06b6d4" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
                No country found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
