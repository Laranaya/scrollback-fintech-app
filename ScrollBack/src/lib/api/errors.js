// Single error type thrown by the service layer (mock or HTTP) so the UI handles both identically.
export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
