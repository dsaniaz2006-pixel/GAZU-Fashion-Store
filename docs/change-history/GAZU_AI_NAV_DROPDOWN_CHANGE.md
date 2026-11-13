# GAZU AI Dropdown Navbar

The five-link AI bar beneath the header has been removed. The primary Nimbus Waterline glass navigation now has one AI item. Click/tap it to expand all Wave 2 AI pages and Wave 3 public features. Admin-only AI Studio and Inventory Forecast are visible only when logged in as admin.

- Desktop: click the `AI` button in the same glass pill as HOME/MEN/WOMEN/KIDS/SHOP/STORY.
- Mobile: open the menu, then tap `AI`; the same AI destinations appear.
- Dropdown closes on selection, outside click or Escape, and highlights the current page.
- No database scripts, back-end services or MongoDB connections changed.

## Verify on Mac

From the extracted project root (containing `package.json`) and with your private root `.env` copied over:

```bash
npm ci
npm run setup
node --test scripts/ai-liquid-nav.test.mjs
npm test
npm run build
npm run dev
```

Visit http://localhost:5173 and click `AI` in the top-left liquid navbar. Test desktop, mobile, and routes.
