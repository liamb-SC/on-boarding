# 05 · Dates with Day.js

**Skills:** parsing (including strict custom formats), formatting, UTC vs
local time, time zones and DST, and differences between dates.

## Background
A `Date`, or a `dayjs` object, is an **instant**: a point on the global
timeline. "What date is it?" depends on **where** you ask, so formatting
always happens in some time zone. If you don't name one, you get the
machine's, and code that works on your laptop breaks on a server in another
region.

```js
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
dayjs.extend(utc); dayjs.extend(timezone); dayjs.extend(customParseFormat);

dayjs.utc('2026-03-07T23:30:00Z').format('D MMM YYYY');   // '7 Mar 2026', in UTC
dayjs('2026-07-01T12:00:00Z').tz('Asia/Tokyo').format('HH:mm');  // '21:00'
dayjs('05/03/2026', 'DD/MM/YYYY', true).isValid();         // true; `true` = strict
dayjs(b).diff(a, 'day');                                   // whole days from a to b
```

- Store and send instants in UTC (ISO 8601 with `Z`). Convert to a zone only
  to **show** them.
- Use IANA zone names (`Europe/London`), not fixed offsets (`+01:00`). The
  names know about daylight saving, and offsets don't.
- Non-strict parsing guesses. `dayjs('31/02/2026', 'DD/MM/YYYY')` silently
  becomes 3 March. Strict mode rejects it.

## Scenario
`dates.js` has five helpers for a booking site. They look right on the
author's laptop but use local time, `new Date` maths and guessy parsing.

## Goal
Rewrite the helpers in `dates.js` with Day.js so they give the same answer on
every machine:
1. `formatInvoiceDate(iso)`: the **UTC** date as `D MMM YYYY`.
2. `parseUkDate('DD/MM/YYYY')`: returns `YYYY-MM-DD`, or `null` unless it's a
   real date in exactly that format.
3. `toZone(iso, tz)`: the wall-clock time in `tz` as `YYYY-MM-DD HH:mm`,
   using the timezone plugin.
4. `daysBetween` / `hoursBetween`: whole days or hours from the first instant
   to the second, using `.diff()`. Partial units round down: 23h59m is 0 days.

## Try it
```bash
npm start                                # uses your machine's zone
TZ=Pacific/Kiritimati npm start          # UTC+14: does anything change?
```
The validator runs in `Pacific/Kiritimati`, so local-time bugs will show up.

## Hints
- Day.js objects are immutable. `.tz()`, `.add()` and friends return a new
  object.
- `.diff(other, 'day')` truncates by default. Pass `true` as a third argument
  if you ever want the fraction.

## Check your work
```
./onboard validate javascript/05
```
