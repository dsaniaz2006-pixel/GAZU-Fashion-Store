# GAZU Wave 3 — Customer and Business Intelligence (Phases 10–14)

## Source and architecture

Built onto the user-supplied `GAZU_Wave2_6_Subagents_Integrated_Full_Project(1).zip`, preserving the existing theme, liquid navbar, payment workflows, original Wave 1/2 routes, and the staging-only launcher.

Five **separately owned feature workstreams** were implemented and then integrated in a sixth integration pass. This is an engineering workstream division, not a claim of six independently running autonomous agents.

**Critical safety:** Keep your original root `MONGODB_URI` unchanged. Copy your private `.env` from your previous project only into the unzipped project root. Run `npm run wave3:staging` to use **`gazu_ai_staging`**, port **8002** backend, and **5174** frontend. This launcher fails closed unless `MONGODB_STAGING_URI` names exactly `gazu_ai_staging` and differs from the original URI. Never run `npm run seed`, `npm run catalogue:three`, or bulk worker scripts on the original database.

## Individual workstream handoffs

| Subagent workstream | Phase | Backend | Frontend | Staging routes |
|---|---|---|---|---|
| 1 — Size and Fit | 10 | `services/wave3/fit.js`, optional `Product.fitData`, chart draft/review model | `pages/wave3/FitAssistant.jsx`, verified-chart UI in AI Studio | `/api/wave3/fit/*`, `/fit-assistant` |
| 2 — Customer Support | 11 | `services/wave3/support.js`, `SupportTicket` | `SupportAssistant.jsx`, `SupportDesk.jsx` | `/api/wave3/support/*`, `/support`, `/support-desk` |
| 3 — Multilingual Voice | 12 | `services/wave3/languages.js`, existing `/api/wave2/chat` extended with `language` | Existing ShoppingAssistant with `LanguageVoiceControls.jsx` | `/api/wave3/languages`, `/ai-assistant` |
| 4 — Admin Catalogue | 13 | `services/wave3/admin.js`, `AIAdminSuggestion`, `AIAdminAudit`, `AISizeChartDraft` | `AdminAIStudio.jsx` | `/api/wave3/admin/*`, `/admin/ai-studio` |
| 5 — Predictive Analytics | 14 | `services/wave3/forecast.js`, read-only historical Orders | `InventoryForecast.jsx` | `/api/wave3/admin/forecast`, `/admin/inventory-forecast` |
| 6 — Integration | All | `routes/wave3.js` mounted in `app.js`, shared Product model, role checks | `App.jsx`, Gazu Edit navigation, admin navigation, `wave3.css` | All above |

### Important behavior and limitations

**Phase 10:** A customer's chest/waist/hip inputs are not stored. The service refuses to guess if the product has no staff-verified **body** chart. Body vs garment measurements are never conflated. One matched dimension gives **low** confidence; 2+ matching dimensions can give **moderate** confidence, never a guarantee. Staff submit a chart draft; a **different administrator** must approve it. The only staging product data currently reported by the user are three test products without manufacturer-verified size charts. Test the fallback first; obtain real brand charts before enabling recommendations.

**Phase 11:** Uses the exact owned-order filter `{_id, user: req.user.id}` before reading order details; no cross-user order lookup. General help text is taken from the existing storefront's Help page (usually 3–7 business days; eligible unworn returns within 15 days) and is not a confirmed ETA or automated return approval. In-app support tickets create a queue. Human support agents can draft and review replies; no orders or refunds are changed. The `hello@gazu.example` address in the old Help component is a placeholder, not a tested support inbox.

**Phase 12:** Extends the existing Wave 2 chat, rather than creating a second chatbot. `language` is `en`, `hi`, or `pa` and the authentication/ownership boundary is unchanged. Hindi/Punjabi garment-keyword fallback works offline; other translations use a Gemini adapter when configured. Browser Web Speech recognition/synthesis is **optional** and browser/language-voice dependent. Audio is handled by the browser speech service; transcript appears as editable text before submission. Do not promise universal Punjabi voice support.

**Phase 13:** Only `description` and `styleTags` can be applied from an AI suggestion. Admin review uses a database transaction and an audit document. Price, quantity, publication, and roles are not eligible. Size charts use a separate draft/approval flow and `InventoryEvent` audit. Image-quality findings are **metadata-based**; missing dimensions produce `IMAGE_RESOLUTION_UNVERIFIED`, not invented pixel-quality claims. Review sentiment is an explicitly labeled **keyword baseline**. Natural-language admin questions are whitelisted, not arbitrary MongoDB commands. Collections are draft ideas only.

**Phase 14:** Per-product time-series demand counts orders by `createdAt`, not verified deliveries, payments, returns or actual inventory consumption. Statistical 7-day moving-average baseline with an out-of-sample holdout **MAE** (when enough data exist); insufficient data yield no numeric forecast. No stock, prices or purchase orders change. Seasonality is not claimed with fewer than 365 days. Returned values include stockout risk and low-quantity size notes. Sample caps (300 products, 5000 orders) are clearly exposed/implicit; do not use as high-scale production forecasting without more work.

## New API summary

- `GET /api/wave3/fit/products` (public), `POST /fit/recommend`, `POST /fit/compare`
- `POST /fit/products/:id/chart-draft` (inventory staff), `GET /fit/chart-drafts` (inventory staff), `PATCH /fit/chart-drafts/:id` (different administrator reviewer)
- `GET /support/policies` (public), `POST /support/ask`, `GET /support/orders`, `POST/GET /support/tickets` (signed-in customer)
- `GET /support/staff/tickets`, `POST /support/staff/tickets/:id/reply-draft`, `PATCH /support/staff/tickets/:id` (admin or support agent)
- `GET /languages` (public); existing `POST /api/wave2/chat` supports optional `language: 'en'|'hi'|'pa'`
- `GET /admin/audit`, `GET /admin/collections/drafts`, `GET /admin/suggestions`, `POST /admin/products/:id/suggestion`, `PATCH /admin/suggestions/:id`, `GET /admin/audit-trail`, `GET /admin/query` (authorized inventory staff)
- `GET /admin/forecast?days=56&horizon=7` (authorized inventory staff)

All `/api/wave3` paths above are relative to the Wave 3 prefix.

## Setup on Mac

1. Unzip `GAZU_Wave3_6_Subagents_Integrated_Full_Project.zip` and open the `gazu-store-wave1` folder in VS Code.
2. Copy your **private** original project root `.env` file to this new root (not into frontend). Keep `MONGODB_URI` and `MONGODB_STAGING_URI` distinct and unchanged.
3. In a terminal in the project root:

```bash
npm ci
npm run setup
npm run test:wave3
npm run test:wave3:http
npm test
npm run build
```

4. Run `npm run wave3:staging` (port 5174 frontend / port 8002 backend). If another app already listens on these ports, stop the correct old app, rather than killing an unknown process.
5. Browse the Wave 3 pages; customer support/AI conversation require a **staging customer account**. Admin AI Studio and Inventory Forecast require an **admin or inventory_manager staging account**; the human support desk accepts `admin` or `support_agent`.
6. Optional browser E2E (mocked API, **staging frontend only**):

```bash
npm install --prefix e2e
npx --prefix e2e playwright install chromium
WAVE3_E2E_BASE_URL=http://localhost:5174 npm run test:wave3:browser
```

7. Independently check live staging outcomes: (a) unverified chart refuses a fit prediction; (b) owned order status and unknown-order 404; (c) Hindi/Punjabi replies with verified product cards; (d) draft+approval and rejection/audit; (e) forecasts report holdout error or insufficient data without changes. These are not counted as passed until your Mac confirms them.

## Verification status

See `WAVE3_VERIFICATION_REPORT.md`. Do **not** mark Wave 3 as 100%/production-ready on the basis of the dependency-free unit tests alone. Full HTTP, Vitest, browser, real OAuth and real Gemini/Atlas checks are separate pending acceptance gates.
