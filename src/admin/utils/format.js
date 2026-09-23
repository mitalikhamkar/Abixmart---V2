export function formatDate(value, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return '—';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', opts);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function initials(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}