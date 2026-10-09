# Project brief: Beacon

**Company:** Brightwell Home (fictional online retailer)
**Prepared by:** Aisha Khan, Delivery Manager · **Date:** 2026-10-02

## Background
Brightwell texts customers when their order ships and when it's out for
delivery. Those texts go through **SMSPort**, a legacy SMS gateway we have used
since 2019. The SMSPort contract ends on **31 December 2026** and will not be
renewed.

## Goal
Move all delivery notifications to **TextBridge**, a new SMS vendor, and go
live before the peak-season **code freeze on 20 November 2026**.

**Target go-live:** 16 November 2026.

## In scope
- A new `beacon-worker` service that sends delivery texts through the
  TextBridge REST API.
- Moving the "order shipped" and "out for delivery" messages from SMSPort.
- Monitoring and alerting for the new service.

## Out of scope
- Marketing texts. They stay on the marketing platform.
- Email notifications.

## Team
| Name | Role |
|------|------|
| Priya Shah | Product Owner (project sponsor) |
| Tom Okafor | Tech Lead |
| Aisha Khan | Delivery Manager |
| Dan Lee | Platform Engineer |
| Sofia Ruiz | Security Engineer |
| Ben Morris | QA Engineer |

External: **Marcus Webb**, account manager at TextBridge.

## Milestones
| Date | Milestone |
|------|-----------|
| 2026-10-06 | Kick-off |
| 2026-10-13 | TextBridge sandbox credentials (promised by vendor) |
| 2026-11-09 | Penetration test |
| 2026-11-16 | Go-live |
| 2026-11-20 | Peak-season code freeze, so no production changes after this |

## Budget
£120,000 (people and vendor setup fees).
