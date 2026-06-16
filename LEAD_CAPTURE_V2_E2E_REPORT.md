# Lead Capture V2 E2E Report

**Date:** 2026-06-15
**Environment:** Production (https://mimotes.ekohomelab.online)
**Method:** curl API testing + DB verification

---

## Test Results

### Intent Detection

| # | Test | Input | Expected Intent | Actual Score | Status |
|---|------|-------|-----------------|--------------|--------|
| 1 | harga + lead | "Berapa harga?" + lead | harga | high | ✅ |
| 2 | beli + lead | "Saya mau beli" + lead | beli | high | ✅ |
| 3 | demo + lead | "Minta demo" + lead | demo | high | ✅ |
| 4 | hubungi + lead | "Hubungi saya" + lead | hubungi | high | ✅ |
| 5 | no intent + lead | "Halo" + lead | null | medium | ✅ |
| 6 | no intent, no lead | "Halo" | null | low | ✅ |

### Lead Scoring

| # | Condition | Expected Score | Actual Score | Status |
|---|-----------|----------------|--------------|--------|
| 7 | Intent + lead | high | high | ✅ |
| 8 | Intent only | medium | medium | ✅ |
| 9 | Lead only | medium | medium | ✅ |
| 10 | Neither | low | low | ✅ |

### Lead Status Workflow

| # | Test | Expected | Status |
|---|------|----------|--------|
| 11 | New lead default status | new | ✅ |
| 12 | Status update via PATCH | contacted | ✅ |
| 13 | Status filter in GET | Works | ✅ |

### Auto-Trigger

| # | Test | Expected | Status |
|---|------|----------|--------|
| 14 | autoTriggerMessages in config | 0 (default) | ✅ |
| 15 | Auto-trigger prompt injection | Works | ✅ |

### API Security

| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 16 | Leads GET (no auth) | 401 | 401 | ✅ |
| 17 | Leads PATCH (no auth) | 401 | 401 | ✅ |
| 18 | Leads export (no auth) | 401 | 401 | ✅ |

### Database

| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 19 | auto_trigger_messages column | present | present | ✅ |
| 20 | lead_score column | present | present | ✅ |
| 21 | lead_status column | present | present | ✅ |

---

## Summary

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| Intent Detection | 6 | 6 | 0 |
| Lead Scoring | 4 | 4 | 0 |
| Lead Status | 3 | 3 | 0 |
| Auto-Trigger | 2 | 2 | 0 |
| API Security | 3 | 3 | 0 |
| Database | 3 | 3 | 0 |
| **TOTAL** | **21** | **21** | **0** |

**Pass Rate:** 100%
