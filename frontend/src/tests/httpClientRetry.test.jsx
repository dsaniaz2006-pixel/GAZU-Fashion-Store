import { afterEach, expect, test, vi } from "vitest";
import { api } from "../lib/api/httpClient.js";

const response = (data, status = 200, { trusted = false } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: {
    get: (name) =>
      trusted && name.toLowerCase() === "x-gazu-api" ? "gazu-store" : null,
  },
  json: async () => data,
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

test("safe GET retries an untrusted Render 503 and succeeds when the backend wakes", async () => {
  vi.useFakeTimers();
  const fetcher = vi.fn()
    .mockResolvedValueOnce(response({ message: "starting" }, 503))
    .mockResolvedValueOnce(response({ items: [] }));
  vi.stubGlobal("fetch", fetcher);

  const pending = api("/products?limit=4");
  await vi.advanceTimersByTimeAsync(2000);

  await expect(pending).resolves.toEqual({ items: [] });
  expect(fetcher).toHaveBeenCalledTimes(2);
});

test("safe GET retries an HTML warm-up page even if it has HTTP 200", async () => {
  vi.useFakeTimers();
  const html = {
    ok: true,
    status: 200,
    headers: { get: () => null },
    json: async () => { throw new SyntaxError("Unexpected token '<'"); },
  };
  const fetcher = vi.fn()
    .mockResolvedValueOnce(html)
    .mockResolvedValueOnce(response({ items: [] }));
  vi.stubGlobal("fetch", fetcher);

  const pending = api("/products?limit=4");
  await vi.advanceTimersByTimeAsync(2000);

  await expect(pending).resolves.toEqual({ items: [] });
  expect(fetcher).toHaveBeenCalledTimes(2);
});

test("trusted GAZU API errors are not mistaken for Render cold starts", async () => {
  const fetcher = vi.fn().mockResolvedValue(
    response({ message: "Cart unavailable" }, 503, { trusted: true }),
  );
  vi.stubGlobal("fetch", fetcher);

  await expect(api("/cart")).rejects.toThrow("Cart unavailable");
  expect(fetcher).toHaveBeenCalledTimes(1);
});

test("POST requests are never automatically replayed", async () => {
  const fetcher = vi.fn().mockResolvedValue(
    response({ message: "Unavailable" }, 503),
  );
  vi.stubGlobal("fetch", fetcher);

  await expect(api("/orders/checkout", {
    method: "POST",
    body: { requestId: "checkout-test" },
  })).rejects.toThrow();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
