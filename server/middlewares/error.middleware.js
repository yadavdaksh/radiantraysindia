import { ApiError } from "../utils/ApiError.js";

export const notFoundHandler = (_req, _res, next) => {
  next(new ApiError(404, "Route not found"));
};

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const payload = {
    success: false,
    message: err.message || "Internal server error",
  };

  if (err instanceof ApiError && err.errors?.length) {
    payload.errors = err.errors;
  }

  res.status(statusCode).json(payload);
};

