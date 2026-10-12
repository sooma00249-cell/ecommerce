import { app } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

/**
 * Process entrypoint.
 *
 * The HTTP server starts immediately and `/health` reports `db: "disconnected"`
 * with a 503 until the database is reachable. A failed connection is retried in
 * the background instead of crashing the process.
 */

const RETRY_DELAY_MS = 5000;

/** @type {import("node:http").Server} */
let server;
let retryTimer;

async function connectWithRetry() {
  try {
    await connectDb();
  } catch (error) {
    logger.warn(
      { event: "db.connect_failed", err: error.message },
      `Could not reach MongoDB, retrying in ${RETRY_DELAY_MS}ms`,
    );
    retryTimer = setTimeout(connectWithRetry, RETRY_DELAY_MS);
    retryTimer.unref();
  }
}

function start() {
  server = app.listen(env.port, () => {
    logger.info({ event: "server.listening", port: env.port }, `API listening on :${env.port}`);
    connectWithRetry();
  });
}

function shutdown(signal) {
  logger.info({ event: "server.shutdown", signal }, "Shutting down");
  clearTimeout(retryTimer);
  server?.close(() => process.exit(0));
  // Hard exit if keep-alive connections keep the server open.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("unhandledRejection", (reason) => {
  logger.fatal({ event: "unhandledRejection", err: reason }, "Unhandled promise rejection");
  process.exit(1);
});

start();
