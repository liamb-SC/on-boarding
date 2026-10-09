import dayjs from 'dayjs';
// Plugins you'll want (extend dayjs with them once, here at the top):
//   import utc from 'dayjs/plugin/utc.js';
//   import timezone from 'dayjs/plugin/timezone.js';
//   import customParseFormat from 'dayjs/plugin/customParseFormat.js';
//   dayjs.extend(utc); ...

// 1. '2026-03-07T23:30:00Z' -> '7 Mar 2026' (the date in UTC)
export function formatInvoiceDate(iso) {
  return dayjs(iso).format('D MMM YYYY');
}

// 2. '31/12/2026' -> '2026-12-31'. Anything that isn't a real DD/MM/YYYY date -> null.
export function parseUkDate(text) {
  return dayjs(text).format('YYYY-MM-DD');
}

// 3. A UTC instant shown as wall-clock time in a time zone:
//    ('2026-07-01T12:00:00Z', 'America/New_York') -> '2026-07-01 08:00'
export function toZone(iso, tz) {
  return dayjs(iso).format('YYYY-MM-DD HH:mm');
}

// 4. Whole days from one ISO instant to another (negative if `to` is earlier).
export function daysBetween(fromIso, toIso) {
  return Math.round((new Date(toIso) - new Date(fromIso)) / 86400000);
}

// 5. Whole hours from one instant to another, e.g. for "check-in closes in N hours".
export function hoursBetween(fromIso, toIso) {
  return Math.round((new Date(toIso) - new Date(fromIso)) / 3600000);
}
