import pino from "pino";
import { env } from "./env.js";

/**
 * Application-wide structured logger (pino).
 *
 * In development the output is pretty-printed to the terminal; in production
 * it stays as single-line JSON so it can be shipped to a log collector.
 */

export const logger = pino({
  level: env.logLevel,
  base: { service: "ecommerce-server", env: env.nodeEnv },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password", "*.password"],
    censor: "[REDACTED]",
  },
  ...(env.isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        },
      }),
});
