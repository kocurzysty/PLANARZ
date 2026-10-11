const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const WEEKDAY_SHORT = ['pn', 'wt', 'śr', 'cz', 'pt', 'sb', 'nd']
const MONTH_NAMES = [
  'styczeń',
  'luty',
  'marzec',
  'kwiecień',
  'maj',
  'czerwiec',
  'lipiec',
  'sierpień',
  'wrzesień',
  'październik',
  'listopad',
  'grudzień',
]

export function isDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const date = parseLocalDate(value)
  return toLocalDateString(date) === value
}

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayString(now = new Date()): string {
  return toLocalDateString(now)
}

export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(dateString: string, days: number): string {
  const date = parseLocalDate(dateString)
  date.setDate(date.getDate() + days)
  return toLocalDateString(date)
}

export function startOfWeek(dateString: string): string {
  const date = parseLocalDate(dateString)
  const weekday = date.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  date.setDate(date.getDate() + mondayOffset)
  return toLocalDateString(date)
}

export function weekDates(dateString: string): string[] {
  const start = startOfWeek(dateString)
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}

export function addMonths(yearMonth: string, months: number): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const date = new Date(year, month - 1 + months, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function yearMonthOf(dateString: string): string {
  return dateString.slice(0, 7)
}

export function monthGrid(yearMonth: string): string[] {
  const [year, month] = yearMonth.split('-').map(Number)
  const first = toLocalDateString(new Date(year, month - 1, 1))
  const start = startOfWeek(first)
  const last = toLocalDateString(new Date(year, month, 0))
  const end = weekDates(last)[6]
  const days: string[] = []
  let current = start
  while (current <= end) {
    days.push(current)
    current = addDays(current, 1)
  }
  return days
}

export function formatDayHeading(dateString: string): string {
  const date = parseLocalDate(dateString)
  const weekday = WEEKDAY_SHORT[date.getDay() === 0 ? 6 : date.getDay() - 1]
  return `${weekday}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}

export function formatWeekdayShort(dateString: string): string {
  const date = parseLocalDate(dateString)
  return WEEKDAY_SHORT[date.getDay() === 0 ? 6 : date.getDay() - 1]
}

export function formatMonthHeading(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const name = MONTH_NAMES[month - 1]
  return `${name} ${year}`
}

export function formatDayNumber(dateString: string): string {
  return String(parseLocalDate(dateString).getDate())
}
