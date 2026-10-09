# Project Beacon: raw notes for the status report, week ending 2026-10-23

*Aisha's scribbles from stand-ups and a call with finance. Turn them into the
status report.*

## Schedule
- TextBridge has confirmed in writing that the sandbox credentials arrive on
  **3 November**. That's still three weeks later than first promised.
- Tom has re-planned around that date. Forecast go-live is now **18 November**
  (target was 16 November). The code freeze is still **20 November**.
- Pen test is booked for 9–10 November (thanks, Sofia).

## Scope
- Ben's E.164 check: **6% of the 500 sampled phone numbers are not in E.164
  format** (missing +44, spaces, leading 0). The assumption was wrong.
- Tom raised change request **CR-01**: add a phone-number normalisation step in
  `beacon-worker`. It's **awaiting Priya's decision**. Nothing has been agreed yet.

## Budget
- Budget: **£120,000**.
- Finance forecast after the re-plan (extra contractor weeks plus TextBridge's
  expedite fee): **£138,000**.

## Other
- Customer support logged **41 complaints in September** about delivery texts
  arriving late at night. Carriers scan parcels until 23:00 and every scan
  triggers a text. Nobody owns fixing this yet.
- SMSPort is still dropping about 2% of texts.

---

## Brightwell RAG rules (use these, don't improvise)
| Area | Green | Amber | Red |
|------|-------|-------|-----|
| Schedule | forecast go-live on or before the target date | forecast after the target but before the code freeze | forecast on or after the code freeze |
| Scope | no open or unapproved changes | a change request is awaiting a decision | scope cut or added without approval |
| Budget | forecast within 5% of budget | forecast 5–10% over budget | forecast more than 10% over budget |
| Overall | all areas Green | worst area is Amber | any area is Red |
