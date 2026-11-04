import fs from "node:fs";
import path from "node:path";

/**
 * Robust Environment Variable Loader for FPC Management System API Server.
 * Automatically discovers and loads .env from root workspace or api-server directory.
 * Preserves pre-existing system/container environment variables.
 */
export function loadEnv(): { loaded: boolean; envPath?: string } {
  const cwd = process.cwd();
  const candidates: string[] = [
    path.resolve(cwd, ".env"),
    path.resolve(cwd, "artifacts/api-server/.env"),
    path.resolve(cwd, "../.env"),
    path.resolve(cwd, "../../.env"),
  ];

  // Try locating relative to module dirname if available
  try {
    const currentDir = typeof __dirname !== "undefined"
      ? __dirname
      : path.dirname(new URL(import.meta.url).pathname);
    candidates.push(
      path.resolve(currentDir, "../../../.env"),
      path.resolve(currentDir, "../../.env"),
      path.resolve(currentDir, "../.env"),
      path.resolve(currentDir, ".env")
    );
  } catch {
    // ignore
  }

  const seen = new Set<string>();
  let loadedPath: string | undefined;

  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    if (fs.existsSync(normalized) && fs.statSync(normalized).isFile()) {
      try {
        if (typeof process.loadEnvFile === "function") {
          process.loadEnvFile(normalized);
          loadedPath = normalized;
          break;
        } else {
          const content = fs.readFileSync(normalized, "utf-8");
          const lines = content.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eqIndex = trimmed.indexOf("=");
            if (eqIndex > 0) {
              const key = trimmed.slice(0, eqIndex).trim();
              let val = trimmed.slice(eqIndex + 1).trim();
              if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
              }
              if (process.env[key] === undefined) {
                process.env[key] = val;
              }
            }
          }
          loadedPath = normalized;
          break;
        }
      } catch {
        // Try next candidate
      }
    }
  }

  return { loaded: Boolean(loadedPath), envPath: loadedPath };
}

// Auto-execute on import
loadEnv();

