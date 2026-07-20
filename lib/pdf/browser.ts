import fs from "fs";

// The npm `playwright` version may not match the browser build pre-installed in
// this environment, so prefer an explicit executable path when one exists.
// Order: env override → known pre-installed symlink → let Playwright decide.
export function chromiumExecutablePath(): string | undefined {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    "/opt/pw-browsers/chromium",
  ].filter(Boolean) as string[];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}
