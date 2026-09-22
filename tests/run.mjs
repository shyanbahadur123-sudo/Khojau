// Runs the security regression suite without adding test dependencies:
// 1. tsc-compiles tests/security.test.ts (+ the pure lib modules it imports)
//    into a temp dir using the repo's own typescript,
// 2. executes it with Node's built-in test runner,
// 3. removes the temp dir.
// DB/auth/storage boundaries stay live-manual (documented in the test file).
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const out = mkdtempSync(join(tmpdir(), "khojau-sec-tests-"));
try {
  // Invoke tsc directly through node (no shell, no npx) for cross-platform use.
  execFileSync(process.execPath, [join(root, "node_modules", "typescript", "bin", "tsc"), "tests/security.test.ts", "lib/validation.ts", "lib/image-validation.ts", "lib/rate-limit.ts", "--outDir", out, "--module", "commonjs", "--target", "es2020", "--esModuleInterop", "--skipLibCheck", "--moduleResolution", "node"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, NODE_PATH: join(root, "node_modules") },
  });
  execFileSync(process.execPath, ["--test", join(out, "tests", "security.test.js")], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, NODE_PATH: join(root, "node_modules") },
  });
  console.log("security regression suite: PASS");
} finally {
  rmSync(out, { recursive: true, force: true });
}
