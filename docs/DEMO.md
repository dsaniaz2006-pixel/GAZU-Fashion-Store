# Evaluation walkthrough

1. Start with README setup and seed. Open /shop. Search "Cotton", filter Men, change sort. Catalogue pagination returns items and total metadata even with only three seed products; add more than 12 to demonstrate a second page.
2. Open a product URL and refresh. Register/sign in, submit a review, show its rating, attempt a duplicate (409), delete it and show rating reset.
3. Add to bag, change quantity, checkout using delivery details. Explain that prices and stock come from MongoDB, never the browser. Open /account/orders and an order detail URL.
4. Sign in as the seeded administrator. Open /admin/products directly and refresh. Upload an image, show progress, create/edit/deactivate a product. A customer opening /admin/products must see denial; API calls must return 403.
5. Advance an order through fulfilment. Show /admin/stats and explain that pending COD is not collected revenue.
6. Run backend and frontend tests; point to competing-stock and failed-transaction regression checks.
7. For ETE, start Compose, show MISS/HIT headers, mutate product, show MISS, stop Redis and show database fallback. Inspect JSON logs and request IDs without tokens/passwords.
8. Choose mock success/failure in checkout on the local demonstration. Inspect X-Payment-Service and service logs. Explain the gateway adapter and decision endpoint, and why the API still owns the database transaction.
9. Show CI and a live hosted demonstration only after you have actually run/deployed them. Do not claim those checks from local tests.
