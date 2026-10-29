// src/utils/ApiError.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,     
    public code: string,           
    message: string,               
    public details?: unknown,      
  ) {
    super(message);
    this.name = 'ApiError';
  }


  static badRequest(msg: string, details?: unknown) {
    return new ApiError(400, 'BAD_REQUEST', msg, details);
  }
  static notFound(msg = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', msg);
  }
  static unprocessable(msg: string, details?: unknown) {
    return new ApiError(422, 'UNPROCESSABLE_ENTITY', msg, details);
  }
  static conflict(msg: string) {
    return new ApiError(409, 'CONFLICT', msg);
  }
  static pricingUnavailable() {
    return new ApiError(503, 'PRICING_UNAVAILABLE', 'Pricing is temporarily unavailable. Please try again shortly.');
  }
  static forbidden(msg = 'Access denied') {
  return new ApiError(403, 'FORBIDDEN', msg);
}
}