import { Suspense } from "react";
import { getHealth } from "@/lib/api/client";

/**
 * TEMPORARY development page — remove it once real API-backed pages exist.
 *
 * Purpose: verify that the Next.js frontend can talk to the Express backend.
 * It runs on the server, so no secret or backend URL reaches the browser.
 *
 * The dynamic part is wrapped in <Suspense> because this project enables
 * Cache Components (`cacheComponents: true` in next.config.ts).
 */

async function HealthReport() {
  const result = await getHealth();

  if (!result.success) {
    return (
      <div>
        <p>
          <strong>Backend not reachable.</strong>
        </p>
        <ul>
          <li>
            Error code: <code>{result.error.code}</code>
          </li>
          <li>{result.error.message}</li>
        </ul>
        <p>
          Start the backend with <code>node index.js</code> inside{" "}
          <code>server/</code>, then reload this page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p>
        <strong>Backend is reachable.</strong>
      </p>
      <pre>{JSON.stringify(result.data, null, 2)}</pre>
    </div>
  );
}

export default function DevHealthPage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>Temporary API health check</h1>
      <p>
        Target: <code>{process.env.API_BASE_URL ?? "(API_BASE_URL is not set)"}</code>
      </p>
      <Suspense fallback={<p>Checking the backend…</p>}>
        <HealthReport />
      </Suspense>
    </main>
  );
}
