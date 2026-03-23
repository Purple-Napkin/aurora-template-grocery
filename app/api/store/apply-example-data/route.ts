import { NextResponse } from "next/server";
import { existsSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

/** Same steps as `pnpm seed:apply`: optional hospitality → catalog JSON → CMS SQL. */
function runNodeScript(scriptRelative: string, args: string[]): { ok: boolean; detail: string } {
  const script = join(process.cwd(), scriptRelative);
  if (!existsSync(script)) {
    return { ok: false, detail: `Missing ${scriptRelative}` };
  }
  const r = spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    const msg = [r.stderr, r.stdout].filter(Boolean).join("\n").trim() || `exit ${r.status}`;
    return { ok: false, detail: msg.slice(0, 4000) };
  }
  return { ok: true, detail: "" };
}

export async function POST() {
  const apiUrl = process.env.AURORA_API_URL || process.env.NEXT_PUBLIC_AURORA_API_URL;
  const apiKey = process.env.AURORA_API_KEY || process.env.NEXT_PUBLIC_AURORA_API_KEY;
  if (!apiUrl?.trim() || !apiKey) {
    return NextResponse.json(
      {
        error:
          "Server missing AURORA_API_URL (or NEXT_PUBLIC_AURORA_API_URL) or AURORA_API_KEY (or NEXT_PUBLIC_AURORA_API_KEY)",
      },
      { status: 500 }
    );
  }

  const catalogJson = join(process.cwd(), "init", "catalog-seed.json");
  const cmsSql = join(process.cwd(), "init", "seed-cms.sql");
  if (!existsSync(catalogJson) || !existsSync(cmsSql)) {
    return NextResponse.json(
      { error: "init/catalog-seed.json or init/seed-cms.sql not found on server" },
      { status: 500 }
    );
  }

  const hospitality = join(process.cwd(), "init", "seed-hospitality.sql");
  if (existsSync(hospitality)) {
    const h = runNodeScript("scripts/apply-seed.mjs", ["--file", "init/seed-hospitality.sql"]);
    if (!h.ok) {
      return NextResponse.json({ error: "seed-hospitality.sql failed", detail: h.detail }, { status: 500 });
    }
  }

  const cat = runNodeScript("scripts/catalog-seed.mjs", ["apply"]);
  if (!cat.ok) {
    return NextResponse.json({ error: "catalog-seed apply failed", detail: cat.detail }, { status: 500 });
  }

  const cms = runNodeScript("scripts/apply-seed.mjs", ["--file", "init/seed-cms.sql"]);
  if (!cms.ok) {
    return NextResponse.json({ error: "seed-cms.sql failed", detail: cms.detail }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
