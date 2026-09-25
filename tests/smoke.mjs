// Production smoke tests: HTTP-level checks against a running server.
// Usage: npm run dev (or start) in one terminal, then:
//   APP_URL=http://localhost:3000 npm run test:smoke
// No dependencies beyond Node itself. Read-only except two throwaway
// anonymous writes (report/request validation probes are NOT submitted —
/// malformed payloads are rejected before any database write).
const APP = process.env.APP_URL ?? "http://localhost:3000";

const results = [];
const ok = (t, d = "") => results.push(`${t}=PASS${d ? ` (${d})` : ""}`);
const fail = (t, d = "") => results.push(`${t}=FAIL${d ? ` (${d})` : ""}`);

async function get(path) {
  const r = await fetch(APP + path, { redirect: "manual" });
  const body = await r.text();
  return { status: r.status, headers: r.headers, body };
}

async function main() {
  // Public pages render
  for (const [name, path, want] of [
    ["home", "/", 200],
    ["search", "/search", 200],
    ["services", "/services", 200],
    ["locations", "/locations", 200],
    ["login", "/login", 200],
    ["register", "/register", 200],
    ["how", "/how-it-works", 200],
    ["health", "/api/health", 200],
    ["sitemap", "/sitemap.xml", 200],
    ["robots", "/robots.txt", 200],
  ]) {
    try {
      const r = await get(path);
      if (r.status === want) ok(`page:${name}`, `${want}`);
      else fail(`page:${name}`, `got ${r.status}, want ${want}`);
    } catch (e) {
      fail(`page:${name}`, String(e).slice(0, 80));
    }
  }

  // Protected pages redirect guests to login
  for (const path of ["/dashboard", "/admin", "/add-business", "/saved", "/account", "/requests", "/recent", "/provider/test-slug"]) {
    const r = await get(path);
    const loc = r.headers.get("location") ?? "";
    if ((r.status === 307 || r.status === 308) && loc.includes("/login")) ok(`guard:${path}`, `${r.status}`);
    else fail(`guard:${path}`, `${r.status} loc=${loc.slice(0, 60)}`);
  }

  // Missing provider → login gate for guests (307/308), 404 when logged in
  {
    const r = await get("/provider/definitely-not-a-real-slug-123");
    const loc = r.headers.get("location") ?? "";
    if (r.status === 404) ok("missing-provider-404", "");
    else if ((r.status === 307 || r.status === 308) && loc.includes("/login")) ok("missing-provider-404", `gated ${r.status}`);
    else fail("missing-provider-404", `got ${r.status}`);
  }

  // Missing request → 404 (never reveals whether the id exists)
  {
    const r = await get("/requests/00000000-0000-0000-0000-000000000000");
    if (r.status === 404 || r.status === 307 || r.status === 308) ok("missing-request-safe", `${r.status}`);
    else fail("missing-request-safe", `got ${r.status}`);
  }

  // Admin API denies anonymous
  {
    const r = await fetch(APP + "/api/admin/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "00000000-0000-0000-0000-000000000000", action: "approve" }),
    });
    if (r.status === 403) ok("admin-anon-403", "");
    else fail("admin-anon-403", `got ${r.status}`);
  }

  // Malformed + oversized bodies rejected before any write
  {
    const bad = await fetch(APP + "/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service: "x", phone: "bad" }),
    });
    if (bad.status === 400 || bad.status === 429) ok("malformed-400", `${bad.status}`);
    else fail("malformed-400", `got ${bad.status}`);
  }
  {
    const big = await fetch(APP + "/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service: "x".repeat(5000), location: "y", description: "z".repeat(5000), phone: "1" }),
    });
    if (big.status === 400 || big.status === 429) ok("oversized-400", `${big.status}`);
    else fail("oversized-400", `got ${big.status}`);
  }

  // Security headers present
  {
    const r = await get("/");
    const h = (n) => r.headers.get(n) ?? "";
    if (h("x-content-type-options") === "nosniff" && h("x-frame-options") === "DENY" && h("referrer-policy") && h("permissions-policy")) ok("headers", "");
    else fail("headers", "missing");
  }

  // Homepage carries no fake-data markers
  {
    const r = await get("/");
    const bad = ["lorem ipsum", "10,000 users", "5-star", "#1 platform"].filter((s) => r.body.toLowerCase().includes(s.toLowerCase()));
    if (bad.length === 0) ok("no-fake-markers", "");
    else fail("no-fake-markers", bad.join(","));
  }

  const fails = results.filter((r) => r.includes("=FAIL")).length;
  console.log(`SMOKE-SUMMARY fails=${fails}`);
  for (const r of results) console.log("  " + r);
  process.exit(fails ? 1 : 0);
}

main().catch((e) => {
  console.error("SMOKE-ERROR", String(e).slice(0, 200));
  process.exit(2);
});
