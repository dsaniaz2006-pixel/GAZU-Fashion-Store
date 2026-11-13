import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, test, expect, vi } from "vitest";
import Account from "../pages/Account.jsx";
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});
const response = (data, status = 200) => ({
  ok: status < 400,
  status,
  // Mirror the X-GAZU-API response header emitted by the real Express app.
  headers: { get: (name) => name.toLowerCase() === "x-gazu-api" ? "gazu-store" : null },
  json: async () => data,
});
function setup() {
  const onLogin = vi.fn();
  render(<Account onLogin={onLogin} go={() => {}} />);
  return onLogin;
}
test("registration enters OTP flow without login, then verification returns to sign in", async () => {
  const fetcher = vi.fn(async (url) =>
    response(
      url.endsWith("register")
        ? {
            requiresVerification: true,
            email: "buyer@example.test",
            retryAfter: 60,
            message: "Code sent",
          }
        : { message: "Email verified. You can now sign in." },
    ),
  );
  vi.stubGlobal("fetch", fetcher);
  const login = setup();
  fireEvent.click(screen.getByText("New here? CREATE AN ACCOUNT"));
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Buyer" },
  });
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "buyer@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "Password123!" },
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "Password123!" } });
  fireEvent.submit(
    screen.getByRole("button", { name: "CREATE ACCOUNT" }).closest("form"),
  );
  await screen.findByLabelText("Verification code");
  expect(login).not.toHaveBeenCalled();
  expect(sessionStorage.getItem("gazu-pending-email")).toBe(
    "buyer@example.test",
  );
  expect(screen.getByText("RESEND IN 60s")).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Verification code"), {
    target: { value: "123456" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "VERIFY OTP" }).closest("form"),
  );
  await screen.findByText("Email verified. You can now sign in.");
  expect(screen.getByLabelText("Password")).toHaveValue("");
  expect(sessionStorage.getItem("gazu-pending-email")).toBeNull();
  expect(login).not.toHaveBeenCalled();
});
test("refresh restores pending email and does not persist a password", () => {
  sessionStorage.setItem("gazu-pending-email", "buyer@example.test");
  setup();
  expect(screen.getByLabelText("Verification code")).toBeInTheDocument();
  expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
});
test("unverified login opens OTP recovery and allows resend", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      response(
        {
          message: "Verify email first",
          code: "EMAIL_NOT_VERIFIED",
          requiresVerification: true,
          email: "buyer@example.test",
        },
        403,
      ),
    ),
  );
  const login = setup();
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "buyer@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "Password123!" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "SIGN IN" }).closest("form"),
  );
  await screen.findByLabelText("Verification code");
  expect(screen.getByText("Verify email first")).toBeInTheDocument();
  expect(login).not.toHaveBeenCalled();
});
test("delivery failure preserves recovery screen and displays safe error", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      response(
        {
          message: "Email unavailable. Resend later.",
          code: "OTP_DELIVERY_FAILED",
          requiresVerification: true,
          email: "buyer@example.test",
          retryAfter: 60,
        },
        503,
      ),
    ),
  );
  setup();
  fireEvent.click(screen.getByText("New here? CREATE AN ACCOUNT"));
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Buyer" },
  });
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "buyer@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "Password123!" },
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "Password123!" } });
  fireEvent.submit(
    screen.getByRole("button", { name: "CREATE ACCOUNT" }).closest("form"),
  );
  await screen.findByLabelText("Verification code");
  expect(screen.getByRole("alert")).toHaveTextContent("Email unavailable");
});
