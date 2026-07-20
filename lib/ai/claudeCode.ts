import { spawn } from "child_process";

// Runs a prompt through a locally-installed Claude Code CLI instead of the
// Anthropic API. This lets anyone with a working `claude` session (Claude Pro/
// Max login or an API key already configured for the CLI) use "Generate with
// AI" without adding a separate ANTHROPIC_API_KEY to this app.

export class ClaudeCodeUnavailableError extends Error {}

export function generateWithClaudeCode(
  prompt: string,
  opts: { model?: string; bin?: string; timeoutMs?: number } = {}
): Promise<string> {
  const bin = opts.bin || process.env.CLAUDE_CODE_BIN || "claude";
  const args = ["-p", "--output-format", "json"];
  if (opts.model) args.push("--model", opts.model);

  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(bin, args, { stdio: ["pipe", "pipe", "pipe"] });
    } catch (err) {
      reject(new ClaudeCodeUnavailableError(`Could not launch "${bin}": ${(err as Error).message}`));
      return;
    }

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      reject(new Error("Claude Code harness timed out."));
    }, opts.timeoutMs ?? 110_000);

    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));

    child.on("error", (err: NodeJS.ErrnoException) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (err.code === "ENOENT") {
        reject(
          new ClaudeCodeUnavailableError(
            `"${bin}" was not found on PATH. Install the Claude Code CLI, or set CLAUDE_CODE_BIN to its path.`
          )
        );
      } else {
        reject(err);
      }
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`Claude Code CLI exited with code ${code}: ${(stderr || stdout).trim()}`));
        return;
      }
      resolve(extractText(stdout));
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

function extractText(stdout: string): string {
  try {
    const parsed = JSON.parse(stdout);
    if (typeof parsed?.result === "string") return parsed.result;
  } catch {
    // Older CLI versions or unexpected output — fall through to raw stdout.
  }
  return stdout;
}
