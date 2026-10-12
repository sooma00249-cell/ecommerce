import "dotenv/config";

/**
 * Centralised environment access.
 *
 * Every variable is read and validated here ONCE at boot, so a misconfigured
 * deployment fails immediately with a clear message instead of crashing
 * half-way through a request. Nothing else in the codebase may read
 * `process.env` directly.
 */

const isTest = process.env.NODE_ENV === "test";

const raw = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: process.env.PORT ?? "5000",
  mongoUri: process.env.MONGO_URI ?? "",
  corsOrigins: process.env.CORS_ORIGINS ?? "http://localhost:5173",
  logLevel: process.env.LOG_LEVEL ?? (isTest ? "silent" : "info"),
};

const missing = ["mongoUri"].filter((key) => !raw[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing
      .map((key) => key.toUpperCase())
      .join(", ")}. Copy .env.example to .env and fill it in.`,
  );
}

const port = Number(raw.port);
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error(`PORT must be an integer between 0 and 65535, got "${raw.port}".`);
}

const nodeEnv = raw.nodeEnv;
if (!["development", "test", "production"].includes(nodeEnv)) {
  throw new Error(`NODE_ENV must be one of development | test | production, got "${nodeEnv}".`);
}

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  isTest,
  port,
  mongoUri: raw.mongoUri,
  corsOrigins: raw.corsOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  logLevel: raw.logLevel,
};
