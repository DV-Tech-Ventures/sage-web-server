import { Request, Response, NextFunction } from "express";

/**
 * Request logging middleware
 */
export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body preview:`, {
      deliveryId: req.body.deliveryId,
      orderNumber: req.body.metadata?.orderNumber,
      erpSystem: req.body.metadata?.erpSystem,
      headerFields: Object.keys(req.body.invoiceHeader || {}),
      lineCount: req.body.invoiceLines?.length || 0,
    });
  }
  
  next();
}

/**
 * Error handling middleware
 */
export function errorHandlingMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error("💥 Unhandled error:", error);
  
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * 404 handler middleware
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    availableEndpoints: ["/receive-order", "/health", "/stats", "/"],
    requestedPath: req.path,
  });
}
