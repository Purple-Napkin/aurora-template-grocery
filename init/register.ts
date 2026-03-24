/**
 * Next.js instrumentation hook: runs when the server starts (Node.js only).
 * If the tenant has no tables yet, POST /v1/provision-schema registers init/schema. Otherwise
 * no-op — DDL is applied via Studio / migration workers, not on every storefront boot.
 */
import { runFirstRunProvision } from "./provision";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  console.log(
    `[aurora] instrumentation: begin pid=${process.pid} ts=${Date.now()}`
  );
  try {
    await runFirstRunProvision();
  } catch (err) {
    console.warn("[aurora] First-run provision skipped:", err instanceof Error ? err.message : err);
  }
}
