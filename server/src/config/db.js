import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

/**
 * MongoDB connection state.
 *
 * Mongoose buffers commands until a connection exists, so the process can
 * boot (and serve 503s on /health) even while the database is down. We only
 * track the state here so the health endpoint can report it honestly.
 */

/** @type {"connected" | "disconnected"} */
export let dbState = "disconnected";

/**
 * True once a connection has been established at least once.
 *
 * Mongoose emits `disconnected`/`error` for every *failed initial connect*
 * attempt as well as for a genuinely dropped connection. The retry loop in
 * `server.js` already reports the former, so we only log the latter here —
 * otherwise every retry prints the same error three times.
 */
let hasConnectedOnce = false;

mongoose.connection.on("connected", () => {
  dbState = "connected";
  hasConnectedOnce = true;
  logger.info({ event: "db.connected" }, "MongoDB connected");
});

mongoose.connection.on("disconnected", () => {
  dbState = "disconnected";
  if (hasConnectedOnce) {
    logger.warn({ event: "db.disconnected" }, "MongoDB connection lost");
  }
});

mongoose.connection.on("error", (error) => {
  dbState = "disconnected";
  if (hasConnectedOnce) {
    logger.error({ event: "db.error", err: error.message }, "MongoDB connection error");
  }
});

/**
 * Connect to MongoDB using a replica set.
 *
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDb() {
  mongoose.set("strictQuery", true);

  // Everything replica-set related (replicaSet name, write concern, retry
  // writes) comes from the URI itself — see .env.example.
  await mongoose.connect(env.mongoUri);

  return mongoose;
}

/**
 * Close the connection gracefully (used on shutdown and in tests).
 *
 * @returns {Promise<void>}
 */
export async function disconnectDb() {
  await mongoose.disconnect();
  dbState = "disconnected";
  hasConnectedOnce = false;
}
