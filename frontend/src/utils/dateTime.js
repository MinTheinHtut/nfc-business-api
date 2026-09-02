const localeByLanguage = { en: 'en-US', th: 'th-TH', ja: 'ja-JP' };

export function formatSavedDateTime(value, language = 'en') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const locale = localeByLanguage[language] || language;
  const dateText = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  const timeText = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(date);
  return `${dateText} · ${timeText}`;
}
