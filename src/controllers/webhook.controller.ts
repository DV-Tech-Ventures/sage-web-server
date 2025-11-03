import { Request, Response } from "express";
import { WebhookService } from "../services/webhook.service";
import { WebhookPayload, WebhookResponse } from "../types";

/**
 * Webhook Controller
 * Handles HTTP requests for webhook endpoints
 */
export class WebhookController {
  private webhookService: WebhookService;

  constructor(webhookService: WebhookService) {
    this.webhookService = webhookService;
  }

  /**
   * Main webhook endpoint - receives order data from OdaFlow
   * POST /receive-order
   */
  async receiveOrder(req: Request, res: Response): Promise<void> {
    try {
      const payload: WebhookPayload = req.body;
      
      // Process the order
      const result: WebhookResponse = await this.webhookService.processOrder(payload);

      // Send response with appropriate HTTP status
      const statusCode = result.httpStatus || (result.success ? 200 : 500);
      res.status(statusCode).json(result);

    } catch (error: any) {
      console.error("❌ Controller error:", error.message);
      
      const response: WebhookResponse = {
        success: false,
        error: error.message || "Unknown error",
      };

      res.status(500).json(response);
    }
  }

  /**
   * Health check endpoint
   * GET /health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.webhookService.getStats();
      
      res.json({
        status: "running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: "Sage ERP Webhook Server is running",
        ...stats,
      });
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        error: error.message,
      });
    }
  }

  /**
   * Root endpoint with instructions
   * GET /
   */
  info(req: Request, res: Response): void {
    res.json({
      message: "Sage ERP Webhook Server",
      version: "2.0",
      endpoints: {
        "POST /receive-order": "Main webhook endpoint for order data",
        "GET /health": "Health check with database status",
        "GET /stats": "Database statistics",
        "GET /": "This info page"
      },
      testScenarios: {
        "Normal order": "Any order number → 200 Success",
        "Duplicate test": "Order number containing 'DUPLICATE' → 409 Conflict",
        "Bad request test": "Order number containing 'BADREQ' → 400 Bad Request",
        "Not found test": "Order number containing 'NOTFOUND' → 404 Not Found"
      },
      configuration: {
        "Environment variables": "Set SAGE_DB_* variables",
        "Config file": "Create config.json with database settings",
        "Documentation": "See README.md for setup instructions"
      },
      usage: "Configure Sage database connection, then use this URL in OdaFlow webhook configuration"
    });
  }

  /**
   * Database statistics endpoint
   * GET /stats
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.webhookService.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
      });
    }
  }
}
