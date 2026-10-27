// Formats a date as MM/DD/YYYY using UTC, matching how the app has always displayed dates.
// Shared by the dashboard, event list, client details, service details, and event details views.
export function formatDate(date) {
  if (!date) return ''
  const isoDate = new Date(date)
  if (Number.isNaN(isoDate.getTime())) return ''
  const year = isoDate.getUTCFullYear()
  const month = String(isoDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(isoDate.getUTCDate()).padStart(2, '0')
  return `${month}/${day}/${year}`
}