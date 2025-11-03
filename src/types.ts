/**
 * Types for Sage ERP webhook payload
 * Based on the transformation service structure
 */

export interface SageInvoiceHeader {
  DocType: number;
  DocState: number;
  AccountID: number;
  Description?: string;
  OrderNum: string;
  ExtOrderNum?: string;
  InvDate: string | Date;
  OrderDate?: string | Date;
  DueDate?: string | Date;
  DeliveryDate?: string | Date;
  TaxInclusive?: boolean;
  Address1?: string;
  Address2?: string;
  Address3?: string;
  Address4?: string;
  InvTotExcl: number;
  InvTotTax: number;
  InvTotIncl: number;
  OrdTotExcl?: number;
  OrdTotTax?: number;
  OrdTotIncl?: number;
  InvDisc?: number;
  DelMethodID?: number;
  DocRepID?: number;
  ProjectID?: number;
  TillID?: number;
  // Allow any additional fields for flexibility
  [key: string]: any;
}

export interface SageInvoiceLine {
  cDescription: string;
  fQuantity: number;
  fQtyToProcess: number;
  fUnitPriceExcl: number;
  fUnitPriceIncl: number;
  fTaxRate: number;
  iStockCodeID: number;
  iTaxTypeID: number;
  iWarehouseID: number;
  bIsWhseItem: boolean;
  fQuantityLineTotExcl: number;
  fQuantityLineTotIncl: number;
  fQuantityLineTaxAmount: number;
  iLineID: number;
  fLineDiscount?: number;
  cLineNotes?: string;
}

export interface WebhookPayload {
  deliveryId: string;
  timestamp: string;
  invoiceHeader: SageInvoiceHeader;
  invoiceLines: SageInvoiceLine[];
  metadata: {
    orderId: string;
    orderNumber: string;
    manufacturerId: string;
    erpSystem: string;
    transformedAt: string;
    currency: string;
    taxRate: number;
    taxInclusive: boolean;
  };
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  sageInvoiceId?: number;
  error?: string;
  httpStatus?: number; // For custom HTTP status codes
}
