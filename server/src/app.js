import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { healthRouter } from "./modules/health/health.routes.js";

/**
 * Express application.
 *
 * Kept separate from `server.js` so it can be imported in tests without
 * binding a port.
 */

export const app = express();

app.disable("x-powered-by");

// --- Security & parsing -----------------------------------------------------
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // No Origin header = same-origin / curl / server-to-server.
      if (!origin) return callback(null, true);
      callback(null, env.corsOrigins.includes(origin));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// --- Request logging --------------------------------------------------------
app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === "/health" },
    serializers: {
      req(req) {
        return { method: req.method, url: req.url };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// --- Routes -----------------------------------------------------------------
app.get("/", (_req, res) => {
  res.json({ name: "ecommerce-api", status: "ok", docs: "/health" });
});

app.use("/health", healthRouter);

// --- Errors (must stay last) ------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);
