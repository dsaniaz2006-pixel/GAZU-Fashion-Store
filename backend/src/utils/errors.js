export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super(404, message);
  }
}
export class ValidationError extends AppError {
  constructor(message) {
    super(400, message);
  }
}
export function fail(status, message) {
  throw new AppError(status, message);
}
