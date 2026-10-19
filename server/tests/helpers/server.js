import { createApp } from "../../app.js";

/**
 * Start the app on an ephemeral port (0) so tests never clash with a running
 * dev server and never need a real MongoDB connection.
 *
 * Returns the base URL plus a `close()` helper. `closeAllConnections()` is
 * called first because Node's global fetch keeps connections alive, which would
 * otherwise make `server.close()` wait.
 */
export async function startTestServer(options = {}) {
  const app = createApp({
    allowedOrigins: ["http://localhost:3000"],
    logRequests: false,
    ...options,
  });

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      if (typeof server.closeAllConnections === "function") {
        server.closeAllConnections();
      }
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
