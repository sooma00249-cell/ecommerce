import { dbState } from "../../config/db.js";

/**
 * GET /health
 *
 * Reports process and database health.
 * 200 -> everything fine. 503 -> the database is unreachable.
 */

export function getHealth(_req, res) {
  const connected = dbState === "connected";

  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "error",
    db: connected ? "connected" : "disconnected",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
