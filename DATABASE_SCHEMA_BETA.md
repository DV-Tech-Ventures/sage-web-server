# 🗄️ Sage ERP Database Schema - BETA Testing Mode

**Complete database schema and webhook payload specification for BETA testing with X-suffix fields**

---

## 🧪 **BETA Testing Mode Overview**

**Why X-Suffix Fields?**

- 🛡️ **Safe testing** - Prevents accidental writes to production Sage tables
- 🧪 **Complete validation** - Test all functionality without risk
- 🔄 **Easy transition** - Remove X suffix when ready for production
- ✅ **Same functionality** - All features work identically

---

## 🖱️ **Easy Table Creation**

**No SQL knowledge required! The webhook server creates these tables automatically:**

### **Setup Process:**

1. **Configure database** connection (5 fields)
2. **Test connection** → ✅ Verify access
3. **Click "Create BETA Tables"** → ✅ One-click creation
4. **Tables ready** → All 49+40 fields with X-suffix
5. **Test webhook** → ✅ Safe integration testing

### **What Gets Created:**

- ✅ **dbo.InvNumX** - Invoice headers (49 fields)
- ✅ **dbo.btblInvoiceLinesX** - Invoice lines (40 fields)
- ✅ **All constraints** - Primary keys, foreign keys, defaults
- ✅ **Proper data types** - Matching Sage ERP specification

---

## 📊 **Database Tables Schema**

### **Invoice Headers Table: `dbo.InvNumX`**

```sql
CREATE TABLE dbo.InvNumX (
    -- Primary Key
    AutoIndex int IDENTITY(1,1) PRIMARY KEY,

    -- Core Required Fields (MUST BE exact values)
    DocTypeX int NOT NULL DEFAULT 4,        -- MUST BE 4 for sales orders
    DocStateX int NOT NULL DEFAULT 1,       -- MUST BE 1 for active
    AccountIDX int NOT NULL,                -- Customer account from dbo.Client

    -- Order Identification
    OrderNumX nvarchar(50) NOT NULL UNIQUE, -- Purchase order number
    ExtOrderNumX nvarchar(50),              -- External order number
    DescriptionX nvarchar(255) DEFAULT 'Sales Order',

    -- Dates
    InvDateX datetime NOT NULL,             -- Invoice date
    OrderDateX datetime,                    -- Order date
    DueDateX datetime,                      -- Due date
    DeliveryDateX datetime,                 -- Delivery date

    -- Address Fields (Split from branch address)
    Address1X nvarchar(100),                -- Address line 1
    Address2X nvarchar(100),                -- Address line 2
    Address3X nvarchar(100),                -- Address line 3
    Address4X nvarchar(100),                -- Address line 4

    -- Tax and Pricing
    TaxInclusiveX bit DEFAULT 1,            -- Prices include tax
    InvTotExclX decimal(18,2),              -- Invoice total excluding tax
    InvTotTaxX decimal(18,2),               -- Invoice tax amount
    InvTotInclX decimal(18,2),              -- Invoice total including tax
    InvTotExclDExX decimal(18,2),           -- Invoice total excl tax, excl discount
    InvTotTaxDExX decimal(18,2),            -- Invoice tax excl discount
    InvTotInclDExX decimal(18,2),           -- Invoice total incl, excl discount

    -- Order Totals
    OrdTotExclX decimal(18,2),              -- Order total excluding tax
    OrdTotTaxX decimal(18,2),               -- Order tax amount
    OrdTotInclX decimal(18,2),              -- Order total including tax
    OrdTotExclDExX decimal(18,2),           -- Order total excl tax, excl discount
    OrdTotTaxDExX decimal(18,2),            -- Order tax excl discount
    OrdTotInclDExX decimal(18,2),           -- Order total incl, excl discount

    -- Discounts (Default 0 for no discount)
    InvDiscX decimal(18,2) DEFAULT 0,       -- Invoice discount percentage
    InvDiscAmntX decimal(18,2) DEFAULT 0,   -- Invoice discount amount
    InvDiscAmntExX decimal(18,2) DEFAULT 0, -- Invoice discount amount ex
    OrdDiscAmntX decimal(18,2) DEFAULT 0,   -- Order discount amount
    OrdDiscAmntExX decimal(18,2) DEFAULT 0, -- Order discount amount ex

    -- System Fields (Sage-specific)
    DelMethodIDX int DEFAULT 0,             -- Delivery method ID
    DocRepIDX int DEFAULT 0,                -- Document representative ID
    ProjectIDX int DEFAULT 0,               -- Project ID
    TillIDX int DEFAULT 0,                  -- Till ID
    OrderStatusIDX int DEFAULT 0,           -- Order status ID
    OrderPriorityIDX int DEFAULT 0,         -- Order priority ID
    ForeignCurrencyIDX int DEFAULT 0,       -- Foreign currency ID
    bUseFixedPricesX bit DEFAULT 0,         -- Use fixed prices flag
    iDocPrintedX int DEFAULT 0,             -- Document printed count
    iINVNUMAgentIDX int DEFAULT 1,          -- Agent ID
    fExchangeRateX decimal(18,2) DEFAULT 0, -- Exchange rate
    fGrvSplitFixedAmntForeignX decimal(18,2) DEFAULT 0,
    fInvDiscAmntForeignX decimal(18,2) DEFAULT 0,

    -- Additional Fields
    DeliveryNoteX nvarchar(255),            -- Delivery note
    POSAmntTenderedX decimal(18,2) DEFAULT 0, -- POS amount tendered
    POSChangeX decimal(18,2) DEFAULT 0      -- POS change
);
```

### **Invoice Lines Table: `dbo.btblInvoiceLinesX`**

```sql
CREATE TABLE dbo.btblInvoiceLinesX (
    -- Primary Key
    LineID int IDENTITY(1,1) PRIMARY KEY,

    -- Foreign Key to Invoice Header
    iInvoiceID int NOT NULL,                -- Links to InvNumX.AutoIndex

    -- Product Information
    cDescriptionX nvarchar(255),            -- Product description
    fQuantityX decimal(18,2),               -- Order quantity
    fQtyToProcessX decimal(18,2),           -- Quantity to process
    cLineNotesX nvarchar(500),              -- Line item notes

    -- Pricing
    fUnitPriceExclzDefaultX decimal(18,2),  -- Unit price excluding tax
    fUnitPriceInclzDefaultX decimal(18,2),  -- Unit price including tax
    fUnitCostX decimal(18,2),               -- Unit cost
    fLineDiscountX decimal(18,2) DEFAULT 0, -- Line discount amount
    fTaxRateX decimal(18,2),                -- Tax rate (e.g., 16 for 16%)

    -- Product References
    iStockCodeIDX int,                      -- Stock code from dbo.StkItem
    iWarehouseIDX int DEFAULT 1,            -- Warehouse ID
    iTaxTypeIDX int DEFAULT 3,              -- Tax type (3=VAT, 7=Exempt)
    iPriceListNameIDX int DEFAULT 0,        -- Price list ID
    bIsWhseItemX bit DEFAULT 1,             -- Warehouse item flag

    -- Line Totals (With Discount Applied)
    fQuantityLineTotInclX decimal(18,2),    -- Line total including tax
    fQuantityLineTotExclX decimal(18,2),    -- Line total excluding tax
    fQuantityLineTotInclNoDiskX decimal(18,2), -- Line total incl tax, no discount
    fQuantityLineTotExclNoDiskX decimal(18,2), -- Line total excl tax, no discount
    fQuantityLineTaxAmountX decimal(18,2),  -- Line tax amount
    fQuantityLineTaxAmountNoDiskX decimal(18,2), -- Line tax amount, no discount

    -- Quantity to Process Totals
    fQtyToProcessLineTotInclX decimal(18,2), -- Qty to process total incl tax
    fQtyToProcessLineTotExclX decimal(18,2), -- Qty to process total excl tax
    fQtyToProcessLineTotInclNoDiskX decimal(18,2),
    fQtyToProcessLineTotExclNoDiskX decimal(18,2),
    fQtyToProcessLineTaxAmountX decimal(18,2),
    fQtyToProcessLineTaxAmountNoDiskX decimal(18,2),

    -- System Fields
    iLineRepIDX int DEFAULT 0,              -- Line representative ID
    iLineProjectIDX int DEFAULT 0,          -- Line project ID
    iLedgerAccountIDX int DEFAULT 0,        -- Ledger account ID
    iModuleX int DEFAULT 0,                 -- Module ID
    bChargeComX bit DEFAULT 1,              -- Charge commission flag
    iLineIDX int,                           -- Line sequence number

    -- Quantity Fields
    fQtyLinkedUsedX decimal(18,2),          -- Quantity linked used
    fQtyChangeX decimal(18,2),              -- Quantity change
    fQuantityURX decimal(18,2),             -- Quantity UR
    fQtyChangeURX decimal(18,2),            -- Quantity change UR
    fQtyToProcessURX decimal(18,2),         -- Quantity to process UR
    fQtyLastProcessURX decimal(18,2),       -- Last process quantity UR

    -- Foreign Key Constraint
    FOREIGN KEY (iInvoiceID) REFERENCES dbo.InvNumX(AutoIndex)
);
```

---

## 📡 **Webhook Payload from OdaFlow API**

### **Complete Payload Structure**

**When OdaFlow approves an order, it sends this to your webhook:**

```json
{
  "deliveryId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-11-04T13:15:00.000Z",
  "invoiceHeader": {
    "DocTypeX": 4,
    "DocStateX": 1,
    "AccountIDX": 16,
    "DescriptionX": "Sales Order",
    "OrderNumX": "PO-2024-001234",
    "ExtOrderNumX": "PO-2024-001234",
    "InvDateX": "2025-11-04T00:00:00.000Z",
    "OrderDateX": "2025-11-04T00:00:00.000Z",
    "DueDateX": "2025-11-11T00:00:00.000Z",
    "DeliveryDateX": null,
    "TaxInclusiveX": true,
    "Address1X": "P.O. Box 1234",
    "Address2X": "Nairobi",
    "Address3X": "Kenya",
    "Address4X": "Industrial Area",
    "InvTotExclX": 1724.14,
    "InvTotTaxX": 275.86,
    "InvTotInclX": 2000.0,
    "InvTotExclDExX": 1724.14,
    "InvTotTaxDExX": 275.86,
    "InvTotInclDExX": 2000.0,
    "OrdTotExclX": 1724.14,
    "OrdTotTaxX": 275.86,
    "OrdTotInclX": 2000.0,
    "OrdTotExclDExX": 1724.14,
    "OrdTotTaxDExX": 275.86,
    "OrdTotInclDExX": 2000.0,
    "InvDiscX": 0,
    "InvDiscAmntX": 0,
    "InvDiscAmntExX": 0,
    "OrdDiscAmntX": 0,
    "OrdDiscAmntExX": 0,
    "DelMethodIDX": 0,
    "DocRepIDX": 0,
    "ProjectIDX": 0,
    "TillIDX": 0,
    "OrderStatusIDX": 0,
    "OrderPriorityIDX": 0,
    "ForeignCurrencyIDX": 0,
    "bUseFixedPricesX": false,
    "iDocPrintedX": 0,
    "iINVNUMAgentIDX": 1,
    "fExchangeRateX": 0,
    "fGrvSplitFixedAmntForeignX": 0,
    "fInvDiscAmntForeignX": 0,
    "DeliveryNoteX": "",
    "POSAmntTenderedX": 0,
    "POSChangeX": 0
  },
  "invoiceLines": [
    {
      "cDescriptionX": "CERES ORANGE JUICE 1LTS",
      "fQuantityX": 10,
      "fQtyToProcessX": 10,
      "cLineNotesX": "Premium orange juice",
      "fUnitPriceExclzDefaultX": 86.21,
      "fUnitPriceInclzDefaultX": 100.0,
      "fUnitCostX": 60.0,
      "fLineDiscountX": 0,
      "fTaxRateX": 16,
      "iStockCodeIDX": 80,
      "iWarehouseIDX": 1,
      "iTaxTypeIDX": 3,
      "iPriceListNameIDX": 0,
      "bIsWhseItemX": true,
      "fQuantityLineTotInclX": 1000.0,
      "fQuantityLineTotExclX": 862.07,
      "fQuantityLineTotInclNoDiskX": 1000.0,
      "fQuantityLineTotExclNoDiskX": 862.07,
      "fQuantityLineTaxAmountX": 137.93,
      "fQuantityLineTaxAmountNoDiskX": 137.93,
      "fQtyToProcessLineTotInclX": 1000.0,
      "fQtyToProcessLineTotExclX": 862.07,
      "fQtyToProcessLineTotInclNoDiskX": 1000.0,
      "fQtyToProcessLineTotExclNoDiskX": 862.07,
      "fQtyToProcessLineTaxAmountX": 137.93,
      "fQtyToProcessLineTaxAmountNoDiskX": 137.93,
      "iLineRepIDX": 0,
      "iLineProjectIDX": 0,
      "iLedgerAccountIDX": 0,
      "iModuleX": 0,
      "bChargeComX": true,
      "iLineIDX": 1,
      "fQtyLinkedUsedX": 10,
      "fQtyChangeX": 10,
      "fQuantityURX": 10,
      "fQtyChangeURX": 10,
      "fQtyToProcessURX": 10,
      "fQtyLastProcessURX": 10
    },
    {
      "cDescriptionX": "SPRITE 500ML PET",
      "fQuantityX": 20,
      "fQtyToProcessX": 20,
      "cLineNotesX": "Carbonated soft drink",
      "fUnitPriceExclzDefaultX": 43.1,
      "fUnitPriceInclzDefaultX": 50.0,
      "fUnitCostX": 30.0,
      "fLineDiscountX": 0,
      "fTaxRateX": 16,
      "iStockCodeIDX": 81,
      "iWarehouseIDX": 1,
      "iTaxTypeIDX": 3,
      "iPriceListNameIDX": 0,
      "bIsWhseItemX": true,
      "fQuantityLineTotInclX": 1000.0,
      "fQuantityLineTotExclX": 862.07,
      "fQuantityLineTotInclNoDiskX": 1000.0,
      "fQuantityLineTotExclNoDiskX": 862.07,
      "fQuantityLineTaxAmountX": 137.93,
      "fQuantityLineTaxAmountNoDiskX": 137.93,
      "fQtyToProcessLineTotInclX": 1000.0,
      "fQtyToProcessLineTotExclX": 862.07,
      "fQtyToProcessLineTotInclNoDiskX": 1000.0,
      "fQtyToProcessLineTotExclNoDiskX": 862.07,
      "fQtyToProcessLineTaxAmountX": 137.93,
      "fQtyToProcessLineTaxAmountNoDiskX": 137.93,
      "iLineRepIDX": 0,
      "iLineProjectIDX": 0,
      "iLedgerAccountIDX": 0,
      "iModuleX": 0,
      "bChargeComX": true,
      "iLineIDX": 2,
      "fQtyLinkedUsedX": 20,
      "fQtyChangeX": 20,
      "fQuantityURX": 20,
      "fQtyChangeURX": 20,
      "fQtyToProcessURX": 20,
      "fQtyLastProcessURX": 20
    }
  ],
  "metadata": {
    "orderId": "64f8a9b0c1d2e3f4g5h6i7j8",
    "orderNumber": "PO-2024-001234",
    "manufacturerId": "6863ecfcf2c7749f5413ba66",
    "erpSystem": "sage",
    "currency": "KES",
    "taxRate": 16,
    "taxInclusive": true,
    "transformedAt": "2025-11-04T13:15:00.000Z"
  }
}
```

---

## 🔄 **Data Transformation Process**

### **1. OdaFlow Order (MongoDB)**

```json
{
  "purchaseOrderNumber": "PO-2024-001234",
  "totalAmount": 2000.0,
  "branch": {
    "address": "P.O. Box 1234, Nairobi, Kenya, Industrial Area"
  },
  "orderItems": [
    {
      "product": {
        "name": "CERES ORANGE JUICE",
        "packSize": "1LTS",
        "sageStockLink": 80
      },
      "quantity": 10,
      "unitPrice": 100.0
    }
  ]
}
```

### **2. Transformation to Sage Format (BETA)**

```json
{
  "invoiceHeader": {
    "DocTypeX": 4, // ← Always 4 for sales
    "AccountIDX": 16, // ← From branch mapping
    "OrderNumX": "PO-2024-001234", // ← From MongoDB order
    "InvTotInclX": 2000.0, // ← From MongoDB total
    "InvTotExclX": 1724.14, // ← Calculated (total / 1.16)
    "InvTotTaxX": 275.86, // ← Calculated (16% VAT)
    "Address1X": "P.O. Box 1234", // ← Split from branch address
    "Address2X": "Nairobi" // ← Split from branch address
  }
}
```

### **3. Database Insertion**

```sql
-- Inserts into dbo.InvNumX
INSERT INTO dbo.InvNumX (DocTypeX, AccountIDX, OrderNumX, InvTotInclX, ...)
VALUES (4, 16, 'PO-2024-001234', 2000.00, ...);

-- Returns AutoIndex: 15

-- Inserts into dbo.btblInvoiceLinesX
INSERT INTO dbo.btblInvoiceLinesX (iInvoiceID, cDescriptionX, fQuantityX, ...)
VALUES (15, 'CERES ORANGE JUICE 1LTS', 10, ...);
```

---

## 📊 **Field Mapping Reference**

### **Header Field Mappings**

| MongoDB Field          | BETA Sage Field | Notes                        |
| ---------------------- | --------------- | ---------------------------- |
| `purchaseOrderNumber`  | `OrderNumX`     | Purchase order number        |
| `totalAmount`          | `InvTotInclX`   | Total including tax          |
| (calculated)           | `InvTotExclX`   | Total excluding tax (÷ 1.16) |
| (calculated)           | `InvTotTaxX`    | Tax amount (16% VAT)         |
| `purchaseOrderDate`    | `InvDateX`      | Invoice date                 |
| `expectedDeliveryDate` | `DueDateX`      | Due date                     |
| `branch.address`       | `Address1X-4X`  | Split address                |
| (constant: 4)          | `DocTypeX`      | Sales order type             |
| (constant: 1)          | `DocStateX`     | Active state                 |
| (from mapping)         | `AccountIDX`    | Customer account             |

### **Line Field Mappings**

| MongoDB Field  | BETA Sage Field           | Notes                  |
| -------------- | ------------------------- | ---------------------- |
| `product.name` | `cDescriptionX`           | Product description    |
| `quantity`     | `fQuantityX`              | Order quantity         |
| `unitPrice`    | `fUnitPriceInclzDefaultX` | Unit price with tax    |
| (calculated)   | `fUnitPriceExclzDefaultX` | Unit price without tax |
| (from mapping) | `iStockCodeIDX`           | Product stock code     |
| (calculated)   | `fQuantityLineTotInclX`   | Line total with tax    |
| (calculated)   | `fQuantityLineTaxAmountX` | Line tax amount        |
| (config: 16)   | `fTaxRateX`               | Tax rate percentage    |
| (index)        | `iLineIDX`                | Line sequence number   |

---

## 🧪 **BETA Testing Benefits**

### **Safe Testing:**

- ✅ **No production risk** - X-suffix tables separate from real Sage
- ✅ **Complete functionality** - All features work identically
- ✅ **Real database** - Actual SQL Server insertion
- ✅ **Easy cleanup** - Drop X tables when done

### **Data Validation:**

- ✅ **Field mapping** - Verify all 49+40 fields transform correctly
- ✅ **Tax calculations** - Validate 16% VAT calculations
- ✅ **Address splitting** - Check address parsing
- ✅ **Product mapping** - Verify stock code lookups

### **Production Transition:**

- ✅ **Simple change** - Remove X suffix from all field names
- ✅ **Same code** - No logic changes needed
- ✅ **Proven system** - Tested with real data structure
- ✅ **Confident deployment** - Known to work

---

## 📈 **Example Database Records**

### **Invoice Header Record (dbo.InvNumX)**

```
AutoIndex: 15
DocTypeX: 4
DocStateX: 1
AccountIDX: 16
OrderNumX: PO-2024-001234
InvDateX: 2025-11-04 00:00:00.000
InvTotInclX: 2000.00
InvTotExclX: 1724.14
InvTotTaxX: 275.86
Address1X: P.O. Box 1234
Address2X: Nairobi
Address3X: Kenya
```

### **Invoice Line Records (dbo.btblInvoiceLinesX)**

```
LineID: 1, iInvoiceID: 15, cDescriptionX: CERES ORANGE JUICE 1LTS, fQuantityX: 10.00
LineID: 2, iInvoiceID: 15, cDescriptionX: SPRITE 500ML PET, fQuantityX: 20.00
```

---

## 🔧 **Database Viewer Features**

### **Tables Displayed:**

- 📊 **Invoice Headers** - Shows all OrderNumX, AccountIDX, totals
- 📦 **Line Items** - Shows all cDescriptionX, fQuantityX, pricing
- 📥 **Excel Export** - Download with X-suffix column names
- 🔄 **Real-time Updates** - Auto-refresh every 60 seconds

### **Monitoring Capabilities:**

- 📈 **Statistics** - Count of BETA records
- 💚 **Health Status** - Connection to BETA tables
- 🔍 **Search/Filter** - Find specific BETA orders
- 📋 **Audit Trail** - Complete BETA testing history

---

## ✅ **Ready for Production**

### **When BETA Testing Complete:**

1. **Rename tables** - `InvNumX` → `InvNum`, `btblInvoiceLinesX` → `btblInvoiceLines`
2. **Update field names** - Remove X suffix from all fields
3. **Update webhook server** - Change table names in code
4. **Deploy to production** - Same code, production tables

### **Transition Script:**

```sql
-- Rename BETA tables to production (when ready)
EXEC sp_rename 'dbo.InvNumX', 'InvNum';
EXEC sp_rename 'dbo.btblInvoiceLinesX', 'btblInvoiceLines';

-- Update all column names (remove X suffix)
EXEC sp_rename 'dbo.InvNum.DocTypeX', 'DocType', 'COLUMN';
EXEC sp_rename 'dbo.InvNum.OrderNumX', 'OrderNum', 'COLUMN';
-- ... repeat for all columns
```

---

**🧪 Perfect BETA testing environment with complete Sage ERP integration!**

**📊 All 49 header fields + 40 line fields supported with X-suffix for safe testing!**
