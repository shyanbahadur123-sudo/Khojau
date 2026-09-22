// Minimal security regression suite — pure functions only (no DB, no network).
// Runs on Node's built-in test runner. DB/auth/storage boundaries remain
// live-manual (they need real JWTs and cleanup); this file locks in the
// output-encoding and validation invariants instead.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  stringifyJsonLd,
  safeExternalUrl,
  externalUrlField,
  safeRedirectPath,
} from "../lib/validation.js";
import { validateImageFile } from "../lib/image-validation.js";
import { rateLimit } from "../lib/rate-limit.js";
import { REQUEST_STATUS_LABEL, REQUEST_NEXT_ACTIONS, formatRequestStatus } from "../lib/request-status.js";

describe("F-01 JSON-LD escaping", () => {
  it("neutralizes a script breakout payload", () => {
    const out = stringifyJsonLd({ d: '</script><script>alert(1)</script>' });
    assert.ok(!out.includes("</script>"), "raw closing tag must not appear");
    assert.ok(!out.includes("<script>"), "raw opening tag must not appear");
    assert.ok(out.includes("\\u003c/script\\u003e"), "escaped form present");
  });

  it("keeps JSON valid and data intact", () => {
    const data = { name: "A&B <\"q\"> test", n: 1 };
    const parsed = JSON.parse(stringifyJsonLd(data)) as typeof data;
    assert.deepEqual(parsed, data);
  });

  it("escapes angle brackets, ampersands, and line separators", () => {
    const out = stringifyJsonLd({ d: "<>&  x" });
    assert.ok(!/[<>&]/.test(out.replace(/\\u00(3c|3e|26|28|29)/g, "")));
  });
});

describe("F-02 dangerous URL schemes", () => {
  const rejected = [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "about:blank",
    "HTTP://EXAMPLE.COM\tx",
    "http: foo",
    "example.com",
    "/relative/path",
    "not a url",
    "",
    "%6A%61%76%61%73%63%72%69%70%74:alert(1)",
  ];
  for (const u of rejected) {
    it(`rejects ${JSON.stringify(u).slice(0, 40)}`, () => {
      assert.equal(safeExternalUrl(u), null);
    });
  }

  const accepted: Array<[string, string]> = [
    ["https://example.com", "https://example.com/"],
    ["http://example.com", "http://example.com/"],
    ["HTTPS://EXAMPLE.COM/Path?q=1", "https://example.com/Path?q=1"],
    // Padded input is trimmed (browsers do the same) — still a safe http(s) URL.
    ["https://example.com ", "https://example.com/"],
    [" https://example.com", "https://example.com/"],
    // Special-scheme shorthand normalizes to a plain http host URL.
    ["http:foo", "http://foo/"],
  ];
  for (const [input, expected] of accepted) {
    it(`accepts ${input}`, () => {
      assert.equal(safeExternalUrl(input), expected);
    });
  }

  it("zod field rejects javascript: and normalizes https", () => {
    assert.ok(!externalUrlField.safeParse("javascript:alert(1)").success);
    const r = externalUrlField.safeParse("HTTPS://EXAMPLE.COM");
    assert.ok(r.success);
    if (r.success) assert.equal(r.data, "https://example.com/");
  });

  it("zod field allows empty", () => {
    assert.ok(externalUrlField.safeParse("").success);
    assert.ok(externalUrlField.safeParse(undefined).success);
  });
});

describe("safeRedirectPath", () => {
  it("allows internal paths, rejects the rest", () => {
    assert.equal(safeRedirectPath("/dashboard"), "/dashboard");
    assert.equal(safeRedirectPath("/search?q=x"), "/search?q=x");
    assert.equal(safeRedirectPath("https://evil.example"), "/dashboard");
    assert.equal(safeRedirectPath("//evil.example"), "/dashboard");
    assert.equal(safeRedirectPath("/\\evil"), "/dashboard");
    assert.equal(safeRedirectPath(null), "/dashboard");
  });
});

describe("image validation", () => {
  it("rejects executables/text/svg and oversize, accepts images", () => {
    assert.ok(validateImageFile({ name: "x.exe", type: "application/x-msdownload", size: 10 }) !== null);
    assert.ok(validateImageFile({ name: "x.svg", type: "image/svg+xml", size: 10 }) !== null);
    assert.ok(validateImageFile({ name: "big.jpg", type: "image/jpeg", size: 3 * 1024 * 1024 }) !== null);
    assert.equal(validateImageFile({ name: "a.jpg", type: "image/jpeg", size: 100 }), null);
    assert.equal(validateImageFile({ name: "a.webp", type: "image/webp", size: 100 }), null);
  });
});

describe("rate limiter", () => {
  it("allows N then denies within the window", () => {
    const k = `t-${Date.now()}-${Math.random()}`;
    assert.ok(rateLimit(k, 2, 60_000));
    assert.ok(rateLimit(k, 2, 60_000));
    assert.ok(!rateLimit(k, 2, 60_000));
  });

  it("isolates keys", () => {
    const a = `a-${Date.now()}`;
    const b = `b-${Date.now()}`;
    assert.ok(rateLimit(a, 1, 60_000));
    assert.ok(!rateLimit(a, 1, 60_000));
    assert.ok(rateLimit(b, 1, 60_000));
  });
});

describe("request status labels", () => {
  it("labels every status and mirrors the status-flow trigger", () => {
    assert.equal(formatRequestStatus("open"), "Open");
    assert.equal(formatRequestStatus("in_progress"), "In progress");
    assert.equal(formatRequestStatus("completed"), "Completed");
    assert.equal(formatRequestStatus("cancelled"), "Cancelled");
    assert.deepEqual(REQUEST_NEXT_ACTIONS.open.map((a) => a.to), ["in_progress", "cancelled"]);
    assert.deepEqual(REQUEST_NEXT_ACTIONS.in_progress.map((a) => a.to), ["completed", "cancelled"]);
    assert.deepEqual(REQUEST_NEXT_ACTIONS.completed, []);
    assert.deepEqual(REQUEST_NEXT_ACTIONS.cancelled, []);
    assert.equal(Object.keys(REQUEST_STATUS_LABEL).length, 4);
  });
});
