import { spawn } from "child_process";

/**
 * Thrown when the `claude` CLI can't be found on PATH. The API route maps this
 * to a friendly "install / log in to Claude Code" message.
 */
export class ClaudeCodeNotInstalledError extends Error {
  constructor() {
    super("claude CLI not found");
    this.name = "ClaudeCodeNotInstalledError";
  }
}

/**
 * Run a single prompt through the locally-installed Claude Code CLI in headless
 * mode and return the model's text.
 *
 * Auth: this deliberately strips ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN from
 * the child's environment so the CLI authenticates with the user's Claude Code
 * subscription login (or CLAUDE_CODE_OAUTH_TOKEN) instead of billed API usage —
 * the API key otherwise wins the CLI's auth precedence chain.
 */
export function runClaudeCode(
  system: string,
  user: string,
  { model = "sonnet", timeoutMs = 115_000 }: { model?: string; timeoutMs?: number } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Force subscription/OAuth auth: remove any API key from the child env.
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    delete env.ANTHROPIC_AUTH_TOKEN;

    const child = spawn(
      "claude",
      ["-p", "--output-format", "json", "--model", model, "--append-system-prompt", system],
      { env, stdio: ["pipe", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(() => reject(new Error("Claude Code timed out.")));
    }, timeoutMs);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err: NodeJS.ErrnoException) => {
      finish(() =>
        reject(err.code === "ENOENT" ? new ClaudeCodeNotInstalledError() : err)
      );
    });

    child.on("close", (code) => {
      finish(() => {
        if (code !== 0) {
          reject(new Error(stderr.trim() || `Claude Code exited with code ${code}.`));
          return;
        }
        try {
          const envelope = JSON.parse(stdout);
          const text = envelope?.result;
          if (typeof text !== "string") {
            reject(new Error("Claude Code returned no result text."));
            return;
          }
          resolve(text);
        } catch {
          reject(new Error("Could not parse Claude Code output."));
        }
      });
    });

    // Pass the (user-controlled) brief via stdin to avoid argv length/escaping issues.
    child.stdin.write(user);
    child.stdin.end();
  });
}
