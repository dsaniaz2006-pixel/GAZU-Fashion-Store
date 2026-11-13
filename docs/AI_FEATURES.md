# GAZU AI Features — Waves 1–3

This is a **codebase feature map**, not a claim that every live provider, browser journey, or admin workflow has been verified. All AI-generated product references must be checked against published, available catalogue records; suggestions do not authorize automatic stock, price or publication changes.

## Wave 1 — Catalogue AI and search

- Catalogue auditing and AI tagging with reviewable drafts.
- Text embeddings, optional Atlas vector search, and keyword fallback.
- Job/usage controls and staging helpers in `backend/src/services/ai/`, `backend/src/workers/`, `backend/scripts/aiStaging.js`.
- Key API assembly: `backend/src/routes/ai.js` (mounted under `/api/ai`).
- Staging commands include `npm run ai:staging:status` and `npm run ai:staging:semantic`.

## Wave 2 — Intelligent fashion shopping

| Feature | Browser route | Backend |
| --- | --- | --- |
| Style Finder | `/style-finder` | `POST /api/wave2/stylist` |
| Shop the Look | `/shop-the-look` | `POST /api/wave2/outfits` |
| Shopping Assistant | `/ai-assistant` | Wave 2 routes and existing AI chat endpoints |
| Visual Search | `/visual-search` | Wave 2 image matching routes |
| Discovery | `/discover` | Wave 2 recommendation routes |

Source modules: `frontend/src/pages/StyleFinder.jsx`, `frontend/src/pages/wave2/`, `backend/src/routes/wave2.js`, `backend/src/services/wave2/`.

## Wave 3 — Customer and business intelligence

| Feature | Browser route | Backend router |
| --- | --- | --- |
| Verified size/fit guidance | `/fit-assistant` | `backend/src/routes/wave3/fit.routes.js` |
| Customer order support | `/support` | `backend/src/routes/wave3/support.routes.js` |
| English/Hindi/Punjabi and voice controls | `/ai-assistant` (extends Wave 2) | `backend/src/routes/wave3/languages.routes.js` |
| Admin catalogue suggestions | `/admin/ai-studio` | `backend/src/routes/wave3/admin.routes.js` |
| Inventory analytics | `/admin/inventory-forecast` | `backend/src/routes/wave3/forecast.routes.js` |
| Staff support desk | `/support-desk` | Support APIs and staff UI |

The Wave 3 router is mounted under `/api/wave3` by `backend/src/app.js`; individual URLs and permission details are defined in each router and should be treated as authoritative.

## Safeguards

- **Fit:** no precise fit recommendation without a validated, staff-verified product measurement chart. Explain missing data and uncertainty.
- **Support:** customer-owned order records only; authenticated access with ownership checks. Escalations are reviewed by people.
- **Languages/voice:** reuse the existing assistant and permissions; browser voice support may vary.
- **Admin:** staff review/approval and audit trail. AI suggestions do not silently alter protected fields.
- **Forecasts:** historical-data statistical estimates only; label insufficient data and do not trigger purchases or stock changes.
- **Image matching:** uploaded images are handled in memory by the API; do not assume the image pipeline stores them permanently.

## Tests and runtime

```bash
npm run test:wave1
npm run test:wave2
npm run test:wave2:http
npm run test:wave3
npm run test:wave3:http
npm test
npm run build
```

For isolated browser checks, use `npm run wave3:staging` and the documented browser E2E runner. Mocked tests do not prove live Gemini, Google sign-in or Atlas availability. See `WAVE1_IMPLEMENTATION_GUIDE.md`, `WAVE2_6_WORKSTREAMS_README.md`, `WAVE3_6_SUBAGENTS_README.md`, and corresponding verification reports.
