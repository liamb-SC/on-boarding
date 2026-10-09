import { daysBetween, formatInvoiceDate, hoursBetween, parseUkDate, toZone } from './dates.js';

console.log(formatInvoiceDate('2026-03-07T23:30:00Z'));             // 7 Mar 2026
console.log(parseUkDate('31/12/2026'), parseUkDate('31/02/2026'));  // 2026-12-31 null
console.log(toZone('2026-07-01T12:00:00Z', 'America/New_York'));    // 2026-07-01 08:00
console.log(daysBetween('2026-01-01T00:00:00Z', '2026-01-10T12:00:00Z')); // 9
console.log(hoursBetween('2026-01-01T00:00:00Z', '2026-01-01T05:59:00Z')); // 5
