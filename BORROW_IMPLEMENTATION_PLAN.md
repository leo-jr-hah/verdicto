# Borrow Tab Security Fixes — Implementation Plan

## Audit vs Reality: What Actually Exists

The `borrow_security_audit.md` references several functions and storage mechanisms that **do not exist** in the current codebase. Here is the reconciliation:

| Audit References | Actual Code |
|---|---|
| `escrows.json` file storage | **Does not exist.** Loans stored in `loanStore` (in-memory Map) + Supabase via `db.saveLoan()` |
| `validateLoanRequest()` function | **Does not exist.** Validation is inline in the POST handler |
| `processAgentOutputs()` fire-and-forget | **Does not exist.** Assessment runs before loan creation (separate flow) |
| `autoRevaluationMonitor()` setInterval | **Does not exist.** Revaluation is manual via POST `/api/loans/:id/revalue` |
| `updateAccruedInterest()` | **Does not exist.** No interest accrual in current code |
| `calculateHealthRatio()` | **Does not exist as a function.** Health ratio is set to 100 at creation, updated during revaluation |
| Tier-based LTV (Tier A/B/C/D) | **Does not exist.** Current code uses continuous formula: `ltv = base + spread * confidence * valueRatio` |
| 2.5 CSPR + 2 CSPR service charge | **Partially exists.** Loan fee is 5 CSPR (single x402 gate), repay fee is 2.5 CSPR |

**Conclusion:** The audit describes a target architecture. Many "MUST FIX" items reference bugs in code that hasn't been written yet. The plan below focuses on what we can actually fix in the current codebase.

---

## What We Are Fixing (Scoped to Current Code)

### Group A: Backend Security Fixes (orchestrator/index.ts)

#### A1. Minimum Confidence Threshold
**Risk:** Audit #6 — Low confidence loans get approved
**Current:** `calculateLTV()` accepts any confidence > 0
**Fix:** Reject loans where confidence < 0.65 (below "Standard" tier). Return clear error message.
**File:** `agents/orchestrator/index.ts` — inside POST `/api/loans/create` handler, after input validation (~line 2605)
**Change:** Add check after confidence validation:
```
if (confidence < 0.65) {
  return res.status(400).json({
    success: false,
    error: 'Valuation confidence too low for lending',
    hint: 'The AI agents could not reach sufficient consensus. Try a different asset or wait for market conditions to stabilize.',
  });
}
```

#### A2. Minimum Collateral Amount
**Risk:** Audit #15 — No minimum collateral
**Current:** Only checks `assessedValue > 0`
**Fix:** Enforce minimum 100 CSPR equivalent assessed value
**File:** `agents/orchestrator/index.ts` — inside POST `/api/loans/create` handler (~line 2598)
**Change:** Add after assessedValue validation:
```
if (assessedValue < 100) {
  return res.status(400).json({
    success: false,
    error: 'Minimum assessed value is $100',
    hint: 'Loans require a minimum collateral value of $100 USD equivalent.',
  });
}
```

#### A3. Valuation Freshness Check
**Risk:** Audit #2 — Stale valuations
**Current:** No timestamp check on assessment age
**Fix:** Require `assessmentTimestamp` in the request body. Reject if older than 24 hours.
**File:** `agents/orchestrator/index.ts` — inside POST `/api/loans/create` handler
**Change:** Add `assessmentTimestamp` to destructured body fields. Add freshness check:
```
if (assessmentTimestamp && (Date.now() - assessmentTimestamp) > 24 * 60 * 60 * 1000) {
  return res.status(400).json({
    success: false,
    error: 'Assessment is too old',
    hint: 'Valuations expire after 24 hours. Please run a new assessment before requesting a loan.',
  });
}
```

#### A4. Divergence Check
**Risk:** Audit #7 — Agents disagree wildly
**Current:** No divergence metric exposed
**Fix:** Accept optional `divergence` field from frontend. Reject if > 0.30 (30%).
**File:** `agents/orchestrator/index.ts` — inside POST `/api/loans/create` handler
**Change:** Add `divergence` to destructured body. Add check:
```
if (typeof divergence === 'number' && divergence > 0.30) {
  return res.status(400).json({
    success: false,
    error: 'Agent valuation divergence too high',
    hint: 'The AI agents disagree significantly on this asset\'s value. Please try a different asset or wait for market stabilization.',
  });
}
```

#### A5. x402 Failure Should Not Fall Through
**Risk:** Audit #4 — Payment failure proceeds anyway
**Current:** In `casperX402Middleware`, catch blocks log "Proceeding with simulated hash"
**Fix:** This is in the shared middleware. We should NOT modify the shared middleware (affects all endpoints). Instead, add a comment documenting the risk and ensure `X402_REQUIRE_PAYMENT=true` is set in production env. The middleware already gates on `requirePayment` flag.
**File:** No code change needed — env configuration issue. Add comment in orchestrator.

### Group B: Frontend Changes (BorrowView.tsx)

#### B1. Send assessmentTimestamp with loan request
**File:** `dashboard/src/pages/BorrowView.tsx` — `handleRequestLoan()` function (~line 225)
**Change:** Add `assessmentTimestamp: assessmentResult?.timestamp || Date.now()` to the LoanCreateRequest

#### B2. Send divergence with loan request
**File:** `dashboard/src/pages/BorrowView.tsx` — `handleRequestLoan()` function
**Change:** Add `divergence: assessmentResult?.divergence` to the LoanCreateRequest (if available from assessment)

#### B3. Show confidence tier on loan offer step
**File:** `dashboard/src/pages/BorrowView.tsx` — Step 2 (Assessment result) and Step 3 (Loan Created)
**Change:** Add a "Confidence" metric card showing the confidence score with color coding:
- >= 0.85: green ("High")
- >= 0.65: yellow ("Moderate")  
- < 0.65: red ("Low — loan not available")

#### B4. Show rejection reason clearly
**File:** `dashboard/src/pages/BorrowView.tsx` — error handling
**Change:** The existing error banner already shows `loanError` and `loanErrorHint`. The backend hints from A1-A4 will display automatically. No additional UI change needed.

### Group C: API Type Updates (api.ts)

#### C1. Add new fields to LoanCreateRequest
**File:** `dashboard/src/services/api.ts` — `LoanCreateRequest` interface (~line 149)
**Change:** Add optional fields:
```typescript
assessmentTimestamp?: number;
divergence?: number;
```

### Group D: Backend Type Updates (orchestrator/index.ts)

#### D1. Add new fields to Loan interface
**File:** `agents/orchestrator/index.ts` — `Loan` interface (~line 2475)
**Change:** Add:
```typescript
assessmentTimestamp?: number;
divergence?: number;
```

#### D2. Store new fields in loan record
**File:** `agents/orchestrator/index.ts` — loan creation (~line 2743)
**Change:** Add `assessmentTimestamp` and `divergence` to the loan object

#### D3. Persist new fields to Supabase
**File:** `agents/orchestrator/index.ts` — `db.saveLoan()` call (~line 2768)
**Change:** Add `assessment_timestamp` and `divergence` to the saved object

### Group E: Supabase Schema Update

#### E1. Add columns to loans table
**File:** Migration or manual SQL
**Change:**
```sql
ALTER TABLE loans ADD COLUMN IF NOT EXISTS assessment_timestamp BIGINT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS divergence NUMERIC;
```

### Group F: DB Layer Update

#### F1. Update DbLoan type and saveLoan
**File:** `agents/shared/db.ts` — `DbLoan` interface (~line 170) and `saveLoan()` (~line 186)
**Change:** Add `assessment_timestamp` and `divergence` fields

---

## What We Are NOT Fixing (Out of Scope)

| Risk | Reason |
|---|---|
| #1 User-supplied assessedValue | Current architecture requires frontend to send value (assessment runs client-side via PaymentModal). Changing this requires a fundamental flow redesign. |
| #3 Confidence in health ratio | No health ratio calculation exists yet. Would need to build revaluation pipeline first. |
| #5 Fire-and-forget agents | This function doesn't exist. Assessment is a separate pre-step. |
| #8 No liquidation mechanism | Requires smart contract work. Roadmap item. |
| #9 Simple interest | No interest system exists yet. |
| #10 setInterval fragility | No setInterval exists. Revaluation is manual. |
| #11 Double-borrow | Would need asset locking in escrow contract. |
| #12 Reentrancy | No escrow contract source exists to audit. |
| #13 No access control | Nice-to-have for hackathon. |
| #14 Ephemeral JSON storage | Already using Supabase. JSON storage doesn't exist. |

---

## Implementation Order

1. **Backend types** (D1) — Add new fields to Loan interface
2. **Backend validation** (A1, A2, A3, A4) — Add all 4 rejection checks in one pass
3. **Backend loan storage** (D2, D3) — Store new fields
4. **DB layer** (F1) — Update DbLoan type and saveLoan
5. **API types** (C1) — Add new fields to LoanCreateRequest
6. **Frontend** (B1, B2, B3) — Send new fields, show confidence tier
7. **Build & verify** — `tsc --noEmit` + `vite build`

---

## Design Rules (STRICT)

- **No em dashes** — use commas or parentheses instead
- **No "AI slop"** — no "leverage", "robust", "seamless", "cutting-edge", "empower"
- **Follow existing patterns** — use `wizard-card`, `wizard-metric`, `wizard-actions`, `btn`, `btn-primary` classes
- **Follow existing color system** — `var(--success)`, `var(--warning)`, `var(--error)`, `var(--accent)`
- **Follow existing icon patterns** — lucide-react icons, same sizing as existing metrics
- **Error messages** — short, direct, with `hint` field for guidance (matching existing pattern)
- **No new CSS files** — use existing enterprise-wizard.css classes
- **No new components** — inline in BorrowView.tsx unless shared across views
