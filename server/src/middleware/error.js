import { ZodError } from "zod";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

/**
 * Central error handling.
 *
 * Every error thrown (or passed on) anywhere in the app funnels through here,
 * so the client always receives the same shape: `{ message }`.
 *
 * Anything we did not explicitly classify becomes an opaque 500 so internal
 * details never leak to the client (they are logged instead).
 */

/** Error carrying an explicit HTTP status code. */
export class ApiError extends Error {
  /**
   * @param {number} status HTTP status code.
   * @param {string} message Human-readable message safe to show to clients.
   * @param {unknown} [details] Optional extra context (logged, not exposed).
   */
  constructor(status, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message = "Bad request", details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message = "Not found") {
    return new ApiError(404, message);
  }

  static conflict(message = "Conflict", details) {
    return new ApiError(409, message, details);
  }
}

/**
 * Map any thrown value onto an ApiError.
 *
 * @param {unknown} error
 * @returns {ApiError}
 */
function normalizeError(error) {
  if (error instanceof ApiError) return error;

  if (error instanceof ZodError) {
    return new ApiError(400, "Validation failed", error.issues);
  }

  // Mongoose duplicate key (e.g. a unique index already taken).
  if (error && typeof error === "object" && "code" in error && error.code === 11000) {
    return new ApiError(409, "Duplicate value for a unique field", error.keyValue);
  }

  // Mongoose validation errors.
  if (error && typeof error === "object" && error.name === "ValidationError") {
    return new ApiError(400, "Validation failed", error.errors);
  }

  // Mongoose bad ObjectId cast.
  if (error && typeof error === "object" && error.name === "CastError") {
    return new ApiError(400, `Invalid value for ${error.path}`);
  }

  if (error instanceof SyntaxError && "body" in error) {
    return new ApiError(400, "Malformed JSON body");
  }

  return new ApiError(500, "Internal server error");
}

/**
 * Express middleware. MUST be registered last, after all routes.
 *
 * @type {import("express").ErrorRequestHandler}
 */
export function errorHandler(error, req, res, _next) {
  const apiError = normalizeError(error);

  const logPayload = {
    event: "http.error",
    method: req.method,
    url: req.originalUrl,
    status: apiError.status,
    message: apiError.message,
  };

  if (apiError.status >= 500) {
    logger.error({ ...logPayload, err: error }, "Request failed");
  } else {
    logger.warn(logPayload, "Request rejected");
  }

  // Only expose the extra details for 4xx — 5xx details stay internal.
  const body = { message: apiError.message };
  if (apiError.status < 500 && apiError.details !== undefined) {
    body.details = apiError.details;
  }
  if (!env.isProduction && apiError.status >= 500) {
    body.details = error instanceof Error ? error.stack : String(error);
  }

  res.status(apiError.status).json(body);
}

/**
 * 404 fallback — registered as the last non-error route.
 *
 * @type {import("express").RequestHandler}
 */
export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
}
