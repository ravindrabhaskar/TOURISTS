// Dev-only embedded PostgreSQL server (no Docker required).
// Starts Postgres 18 on port 54329 with data under ./.dbdata
// Usage: node scripts/dev-db.mjs up   |   node scripts/dev-db.mjs down

import EmbeddedPostgres from "embedded-postgres";
import { mkdirSync, existsSync, writeFileSync } from "fs";
import os from "os";
import path from "path";

const dataDir = path.join(process.cwd(), ".dbdata");
const cmd = process.argv[2] ?? "up";

// Cluster must be UTF-8 (Telugu content + emoji). initdb inherits the OS locale
// on Windows (often WIN1252), which cannot store multibyte text — so we
// initialise explicitly with -E UTF8 when the cluster does not exist yet.
async function ensureCluster(pg) {
  if (!existsSync(path.join(dataDir, "PG_VERSION"))) {
    console.log("Initialising UTF-8 cluster…");
    mkdirSync(dataDir, { recursive: true });
    const nativeBin = path.join(process.cwd(), "node_modules", "@embedded-postgres", "windows-x64", "native", "bin");
    const initdb = process.platform === "win32" ? path.join(nativeBin, "initdb.exe") : path.join(nativeBin, "initdb");
    const pwFile = path.join(os.tmpdir(), "sanchari-pg.pw");
    writeFileSync(pwFile, "sanchari");
    const { execFileSync } = await import("child_process");
    execFileSync(initdb, [
      "-D", dataDir,
      "-E", "UTF8",
      "--locale=C",
      "-U", "sanchari",
      `--pwfile=${pwFile}`,
      "-A", "password",
    ], { stdio: "inherit" });
  }
  await pg.start();
}

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "sanchari",
  password: "sanchari",
  port: 54329,
  persistent: true,
  onError: (msgOrErr) => console.error("[pg]", msgOrErr),
});

if (cmd === "down") {
  await pg.stop();
  process.exit(0);
}

await ensureCluster(pg);
console.log("Postgres ready on postgres://sanchari:sanchari@localhost:54329/sanchari");

const client = pg.getPgClient();
await client.connect();
try {
  await client.query("CREATE DATABASE sanchari");
  console.log("Database 'sanchari' created.");
} catch {
  // already exists
}
await client.end();

// Keep the process alive to serve connections.
setInterval(() => undefined, 1 << 30);
