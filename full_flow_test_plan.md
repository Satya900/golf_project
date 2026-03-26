# Golf Charity Platform - Full Flow Test Plan

This document outlines the end-to-end testing strategy for the Golf Charity Platform, covering all critical user and admin flows.

## 1. Authentication & Onboarding
| Task ID | Scenario | Description | Expected Result |
|:---|:---|:---|:---|
| AUTH-001 | User Signup | Create a new account with email, password, and full name. | Account created, profile entry in DB, redirected to dashboard. |
| AUTH-002 | User Login | Login with existing credentials. | JWT token received, stored in localStorage, redirected to dashboard. |
| AUTH-003 | Profile Update | Change full name or avatar in settings. | Changes persisted in `profiles` table and reflected in UI. |
| AUTH-004 | Logout | Click logout button. | Token cleared, redirected to login page. |

## 2. Subscription Lifecycle (Polar.sh Integration)
| Task ID | Scenario | Description | Expected Result |
|:---|:---|:---|:---|
| SUB-001 | Create Checkout | User selects a plan (Monthly/Yearly) and clicks "Subscribe". | Redirected to Polar.sh checkout page with correct `user_id` in metadata. |
| SUB-002 | Webhook: Created | Simulate `subscription.created` webhook from Polar. | `subscriptions` table updated with `active` status and `polar_subscription_id`. |
| SUB-003 | Access Control | Try to add a score without an active subscription. | API returns 403 Forbidden; UI shows "Subscription required". |
| SUB-004 | Access Control | Add a score with an active subscription. | API returns 201 Created; Score added to `scores` table. |
| SUB-005 | Subscription Portal | User clicks "Manage Subscription". | Redirected to Polar.sh customer portal. |
| SUB-006 | Webhook: Cancelled | Simulate `subscription.updated` (cancelled) webhook. | `cancel_at_period_end` set to true in DB. |
| SUB-007 | Webhook: Revoked | Simulate `subscription.revoked` webhook. | Status set to `revoked` in DB. |

## 3. Core Gameplay: Golf Scores
| Task ID | Scenario | Description | Expected Result |
|:---|:---|:---|:---|
| SCORE-001 | Add Score | Enter score (1-45) and date. | Score saved and appears in Score History. |
| SCORE-002 | Duplicate Score | Try to add multiple scores for the same date. | (Policy check) Should ideally allow multiple or warn depending on rules. |
| SCORE-003 | Score Validation | Enter score > 45 or < 1. | Frontend and Backend validation should reject. |
| SCORE-004 | View History | Navigate to scores page. | List of previous scores shown with dates. |

## 4. Charity Integration
| Task ID | Scenario | Description | Expected Result |
|:---|:---|:---|:---|
| CHAR-001 | Browse Charities | View list of available charities. | All active charities from DB displayed. |
| CHAR-002 | Select Charity | Choose a charity and set contribution % (10-100%). | Choice saved in `profiles` table. |
| CHAR-003 | Webhook: Contribution | Simulate `order.created` (renewal) webhook. | Contribution calculated and inserted into `charity_contributions`. |
| CHAR-004 | Charity Totals | Check charity detail after contribution. | `total_raised` for charity incremented correctly. |

## 5. Monthly Draws
| Task ID | Scenario | Description | Expected Result |
|:---|:---|:---|:---|
| DRAW-001 | Browse Draws | View published draws history. | List of past draws shown to user. |
| DRAW-002 | Draw Results | User views specific draw results. | Winning numbers and matched results (if any) shown. |
| DRAW-003 | Result Verification | User matches 3, 4, or 5 numbers. | Status shown as "Matched", prize amount calculated. |

## 6. Admin Panel Flow
| Task ID | Scenario | Description | Expected Result |
|:---|:---|:---|:---|
| ADM-001 | User Management | Admin views list of all users. | Search and filter by subscription status. |
| ADM-002 | Create Draw | Admin sets date for next monthly draw. | New draw entry in `draws` table with `pending` status. |
| ADM-003 | Simulate Draw | Admin runs simulation for a draw. | Winning numbers generated, potential winners identified, status set to `simulated`. |
| ADM-004 | Publish Draw | Admin approves results and publishes. | Status set to `published`, results visible to users, winners notified. |
| ADM-005 | Verify Winner | Admin reviews winner proof and approves. | Status set to `approved`. |
| ADM-006 | Mark Paid | Admin marks a verified winner as paid. | Status set to `paid`, `paid_at` timestamp recorded. |

## 7. Integration & Security
| Task ID | Scenario | Description | Expected Result |
|:---|:---|:---|:---|
| SEC-001 | API Protection | Access `/api/admin/*` with regular user token. | Returns 403 Forbidden. |
| SEC-002 | Webhook Security | Call `/api/webhooks/polar` with invalid signature. | Returns 401 Unauthorized. |
| SEC-003 | Data Isolation | User A tries to view User B's scores. | Returns 404/403 (RLS check). |

## 8. Frontend / UI Polish
| Task ID | Scenario | Description | Expected Result |
|:---|:---|:---|:---|
| UI-001 | Responsive Test | View site on Mobile, Tablet. | Layout adjusts correctly (Mobile-first design). |
| UI-002 | Loading States | Slow network simulation. | Skeletons or spinners shown during data fetch. |
| UI-003 | Error Handling | API failure (e.g. backend down). | User-friendly error message or toast notification. |
