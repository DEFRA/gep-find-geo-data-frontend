import { format, isDate, parseISO } from 'date-fns'

export function formatDate (value, formattedDateStr = 'd MMMM yyyy') {
  const date = isDate(value) ? value : parseISO(value)

  return format(date, formattedDateStr)
}
