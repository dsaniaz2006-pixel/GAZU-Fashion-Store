# Fit-specific acceptance scenarios

Test-first red/green is recorded in `WAVE3_VERIFICATION_REPORT.md`. HTTP integration acceptance uses `backend/tests/wave3/http.integration.test.js` and browser E2E acceptance uses `e2e/wave3.spec.mjs`.

Before production, use actual authenticated staging staff accounts to check that inventory staff can submit a manufacturer-verified body chart, cannot unilaterally approve it, and that a **different** admin can approve or reject it. Check no recommendation without the resulting approved chart; check no size claims from text-only `sizeGuide`.
