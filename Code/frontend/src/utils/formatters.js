/**
 * Safely parses ISO date strings from backend APIs.
 * Converts naive UTC timestamps (e.g. "2026-08-08T17:30:00") to UTC Date objects
 * by appending 'Z' if no timezone offset is provided.
 */
export function parseUTCDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;

  let str = String(dateInput).trim();
  if (!str) return null;

  // Replace space with 'T' if format is "YYYY-MM-DD HH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(str)) {
    str = str.replace(' ', 'T');
  }

  // If ISO string has time component but lacks timezone offset (Z or +00:00 / -05:00), append 'Z' to force UTC
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) && !str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
    str += 'Z';
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date(dateInput) : d;
}

/**
 * Converts a date string or Date object into human-readable relative time format.
 * Examples: "posted 1 hour ago", "posted 40 minutes ago", "applied 2 days ago"
 */
export function formatTimeAgo(dateInput, prefix = '') {
  if (!dateInput) return '';

  const date = parseUTCDate(dateInput);
  if (!date || isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 45) {
    return prefix ? `${prefix} just now` : 'just now';
  }

  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) {
    const unit = minutes === 1 ? 'minute' : 'minutes';
    return prefix ? `${prefix} ${minutes} ${unit} ago` : `${minutes} ${unit} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const unit = hours === 1 ? 'hour' : 'hours';
    return prefix ? `${prefix} ${hours} ${unit} ago` : `${hours} ${unit} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    const unit = days === 1 ? 'day' : 'days';
    return prefix ? `${prefix} ${days} ${unit} ago` : `${days} ${unit} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    const unit = months === 1 ? 'month' : 'months';
    return prefix ? `${prefix} ${months} ${unit} ago` : `${months} ${unit} ago`;
  }

  const years = Math.floor(days / 365);
  const unit = years === 1 ? 'year' : 'years';
  return prefix ? `${prefix} ${years} ${unit} ago` : `${years} ${unit} ago`;
}
