import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const skip = new Set(["node_modules", ".next", ".git", "scripts"]);
let bad = [];

function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|mjs|css|json)$/.test(e.name)) {
      const s = readFileSync(p, "utf8");
      if (s.includes("../") && (s.includes("OtherProject") || /from ["']\.\.\//.test(s))) bad.push(p);
      if (s.includes("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE") || s.includes("NEXT_PUBLIC_SERVICE_ROLE")) bad.push(p + " (service key exposure?)");
    }
  }
}
walk(ROOT);
if (bad.length) {
  console.error("Isolation check FAILED:", bad);
  process.exit(1);
}
console.log("Isolation check OK — project root:", ROOT);
