// Formats an ISO date string as MM/DD/YYYY (UTC, so the day never shifts by timezone)
export function formatDate(date) {
  const isoDate = new Date(date);
  const year = isoDate.getUTCFullYear();
  const month = String(isoDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(isoDate.getUTCDate()).padStart(2, '0');
  return `${month}/${day}/${year}`;
}