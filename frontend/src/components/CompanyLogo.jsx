import { useEffect, useState } from 'react';

export function safeLogoUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value).trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function companyInitials(name) {
  const words = String(name || 'Company').trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0]?.slice(0, 2) || 'CO').toUpperCase();
}

export default function CompanyLogo({ logoUrl, companyName, size = 'medium', className = '' }) {
  const safeUrl = safeLogoUrl(logoUrl);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [safeUrl]);
  const classes = `company-logo company-logo-${size} ${className}`.trim();
  if (!safeUrl || failed) return <span className={`${classes} company-logo-fallback`} aria-label={`${companyName || 'Company'} logo placeholder`}>{companyInitials(companyName)}</span>;
  return <img className={classes} src={safeUrl} alt={`${companyName || 'Company'} logo`} onError={() => setFailed(true)} />;
}
