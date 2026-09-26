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
  isSameOriginRequest,
  publicOrigin,
} from "../lib/validation.js";
import { validateImageFile, detectImageMime, validateImageBytes } from "../lib/image-validation.js";
import { clientIp, rateLimit } from "../lib/rate-limit.js";
import { REQUEST_STATUS_LABEL, REQUEST_NEXT_ACTIONS, formatRequestStatus } from "../lib/request-status.js";
import { tallyTrendScores } from "../lib/search.js";
import { adminEmails, isAdminEmailAddr } from "../lib/admin-emails.js";
import { profileCompleteness } from "../lib/completeness.js";

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

  it("supports an explicit fallback for login landing", () => {
    assert.equal(safeRedirectPath(null, "/"), "/");
    assert.equal(safeRedirectPath("https://evil.example", "/"), "/");
    assert.equal(safeRedirectPath("/requests", "/"), "/requests");
  });
});

describe("isSameOriginRequest (CSRF guard for cookie POSTs)", () => {
  const req = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers, method: "POST" });

  it("accepts same-origin browser POSTs", () => {
    const r = req("https://khojau-seven.vercel.app/api/admin/providers", { origin: "https://khojau-seven.vercel.app" });
    assert.equal(isSameOriginRequest(r), true);
  });

  it("rejects cross-site forged POSTs", () => {
    const r = req("https://khojau-seven.vercel.app/api/admin/providers", { origin: "https://evil.example" });
    assert.equal(isSameOriginRequest(r), false);
  });

  it("allows requests without an Origin header (non-browser clients)", () => {
    assert.equal(isSameOriginRequest(req("https://khojau-seven.vercel.app/api/health")), true);
  });
});

describe("clientIp (verified platform IP first)", () => {
  const req = (headers: Record<string, string> = {}) => new Request("https://khojau-seven.vercel.app/api/x", { headers });

  it("prefers x-real-ip over x-forwarded-for", () => {
    const r = req({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9, 1.2.3.4" });
    assert.equal(clientIp(r), "1.2.3.4");
  });

  it("falls back to the leftmost forwarded entry", () => {
    const r = req({ "x-forwarded-for": "9.9.9.9, 1.2.3.4" });
    assert.equal(clientIp(r), "9.9.9.9");
  });

  it("returns unknown with no IP headers", () => {
    assert.equal(clientIp(req()), "unknown");
  });
});

describe("publicOrigin (proxy-aware auth redirects)", () => {
  const req = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers });

  it("prefers forwarded host/proto behind a tunnel or proxy", () => {
    const r = req("http://localhost:3000/auth/callback?code=x", {
      "x-forwarded-proto": "https",
      "x-forwarded-host": "hon-comparisons-oval-pubmed.trycloudflare.com",
    });
    assert.equal(publicOrigin(r), "https://hon-comparisons-oval-pubmed.trycloudflare.com");
  });

  it("falls back to the request origin with no proxy headers", () => {
    assert.equal(publicOrigin(req("http://localhost:3000/x")), "http://localhost:3000");
  });

  it("takes the first entry of a forwarded chain", () => {
    const r = req("http://internal:3000/x", {
      "x-forwarded-proto": "https, http",
      "x-forwarded-host": "public.example, internal",
    });
    assert.equal(publicOrigin(r), "https://public.example");
  });

  it("rejects smuggled hosts and falls back safely", () => {
    const evil = req("http://localhost:3000/x", {
      "x-forwarded-proto": "https",
      "x-forwarded-host": "evil.example\\@x",
    });
    assert.equal(publicOrigin(evil), "http://localhost:3000");
    const evil2 = req("http://localhost:3000/x", {
      "x-forwarded-proto": "https",
      "x-forwarded-host": "evil.example/x y",
    });
    assert.equal(publicOrigin(evil2), "http://localhost:3000");
  });
});

describe("trend scoring (honest popularity)", () => {
  it("weights contact taps above passive views and ignores junk", () => {
    const scores = tallyTrendScores([
      { event: "provider_view", meta: { providerId: "a" } },
      { event: "provider_view", meta: { providerId: "a" } },
      { event: "phone_click", meta: { providerId: "b" } },
      { event: "unknown_event", meta: { providerId: "c" } },
      { event: "provider_view", meta: {} },
      { event: "provider_view", meta: { providerId: 42 } },
    ]);
    assert.equal(scores.get("a"), 2);
    assert.equal(scores.get("b"), 3);
    assert.ok(!scores.has("c"), "unknown events never score");
    assert.equal(scores.size, 2);
  });
});

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

describe("CSP origin pinning (F-01 regression: never serve a dead Supabase host)", () => {
  const RETIRED = "ipnywyozktrzlvsxsyzh.supabase.co";
  const LIVE = "ilcdfjsquftqxhhdlvve.supabase.co";

  it("next.config contains no retired host and derives the origin from env", () => {
    const cfg = readFileSync(join(process.cwd(), "next.config.mjs"), "utf8");
    assert.ok(!cfg.includes(RETIRED), "retired Supabase host must never return to CSP");
    assert.ok(cfg.includes("NEXT_PUBLIC_SUPABASE_URL"), "CSP origin must derive from env");
    assert.ok(cfg.includes(LIVE), "current project must be the fallback default");
  });

  it("no hardcoded Supabase host anywhere under lib/", () => {
    for (const f of readdirSync(join(process.cwd(), "lib"))) {
      if (!f.endsWith(".ts")) continue;
      const src = readFileSync(join(process.cwd(), "lib", f), "utf8");
      assert.ok(!src.includes(".supabase.co"), `hardcoded Supabase host in lib/${f}`);
    }
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

  it("sniffs magic bytes and rejects spoofed content", () => {
    const jpeg = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x00];
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
    const webp = [0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];
    assert.equal(detectImageMime(jpeg), "image/jpeg");
    assert.equal(detectImageMime(png), "image/png");
    assert.equal(detectImageMime(webp), "image/webp");
    // Renamed executable claiming to be a JPEG.
    assert.equal(detectImageMime([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]), null);
    // SVG markup, PDF, GIF, and truncated headers are not accepted.
    assert.equal(detectImageMime([0x3c, 0x73, 0x76, 0x67]), null);
    assert.equal(detectImageMime([0x25, 0x50, 0x44, 0x46, 0x2d]), null);
    assert.equal(detectImageMime([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]), null);
    assert.equal(detectImageMime([0xff, 0xd8]), null);
    assert.equal(validateImageBytes(jpeg, "image/jpeg"), null);
    assert.equal(validateImageBytes(png, "image/png"), null);
    assert.equal(validateImageBytes(webp, "image/webp"), null);
    assert.ok(validateImageBytes([0x4d, 0x5a, 0x90, 0x00], "image/jpeg") !== null);
    assert.ok(validateImageBytes(png, "image/jpeg") !== null);
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

describe("admin email gate (server allowlist)", () => {
  it("matches case-insensitively, trims, and ignores blanks", () => {
    assert.deepEqual(adminEmails("Admin@X.com, user@y.com ,, "), ["admin@x.com", "user@y.com"]);
    assert.deepEqual(adminEmails(undefined), []);
    assert.deepEqual(adminEmails(""), []);
    assert.ok(isAdminEmailAddr("ADMIN@x.com", "admin@x.com"));
    assert.ok(!isAdminEmailAddr("other@x.com", "admin@x.com"));
    assert.ok(!isAdminEmailAddr(null, "admin@x.com"));
    assert.ok(!isAdminEmailAddr("admin@x.com", undefined));
  });
});

describe("profile completeness (honest progress)", () => {
  const base = {
    business_name: "Sharma Electricals",
    phone: "9841234567",
    category_slug: "electrician",
    description: "Wiring and repair work across Kathmandu valley.",
    city: "Kathmandu",
    area: "Baneshwor",
    has_hours: true,
    photo_count: 2,
    service_count: 3,
    has_whatsapp: true,
  };
  it("scores a complete profile at 100%", () => {
    const r = profileCompleteness(base);
    assert.equal(r.percent, 100);
    assert.ok(r.items.every((i) => i.done));
  });
  it("scores an empty profile at 0% with actionable items", () => {
    const r = profileCompleteness({
      business_name: "",
      phone: null,
      category_slug: null,
      description: "short",
      city: "",
      area: null,
      has_hours: false,
      photo_count: 0,
      service_count: 0,
      has_whatsapp: false,
    });
    assert.equal(r.percent, 0);
    assert.equal(r.items.length, 8);
    assert.ok(r.items.some((i) => !i.done));
  });
  it("is monotonic: each completed field raises the score", () => {
    const a = profileCompleteness({ ...base, has_hours: false, photo_count: 0 });
    const b = profileCompleteness(base);
    assert.ok(a.percent < b.percent);
  });
});
