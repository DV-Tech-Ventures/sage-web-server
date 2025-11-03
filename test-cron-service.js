const axios = require("axios");

/**
 * Automated Webhook Testing Service
 *
 * Sends test orders to webhook server every 45 minutes
 * Tests longevity and stability of the webhook integration
 */

const WEBHOOK_URL =
  "https://extorsively-sobersided-zora.ngrok-free.dev/receive-order";
const INTERVAL_MINUTES = 45;

// Test data template
const generateTestOrder = () => {
  const timestamp = new Date().toISOString();
  const orderSuffix = Date.now();

  return {
    deliveryId: `cron-test-${orderSuffix}`,
    timestamp: timestamp,
    invoiceHeader: {
      DocType: 4,
      DocState: 1,
      AccountID: Math.floor(Math.random() * 900) + 100, // Random 100-999
      Description: "Automated Test Order",
      OrderNum: `CRON-TEST-${orderSuffix}`,
      ExtOrderNum: `CRON-TEST-${orderSuffix}`,
      InvDate: timestamp,
      OrderDate: timestamp,
      TaxInclusive: true,
      Address1: "Automated Test Address",
      Address2: "Nairobi",
      Address3: "Kenya",
      Address4: `Test Road ${Math.floor(Math.random() * 100)}`,

      // Random totals between 100-2000 KES
      InvTotIncl: Math.floor(Math.random() * 1900) + 100,
      InvTotExcl: 0, // Will be calculated
      InvTotTax: 0, // Will be calculated
      InvTotExclDEx: 0,
      InvTotTaxDEx: 0,
      InvTotInclDEx: 0,
      OrdTotExcl: 0,
      OrdTotTax: 0,
      OrdTotIncl: 0,
      OrdTotExclDEx: 0,
      OrdTotTaxDEx: 0,
      OrdTotInclDEx: 0,

      // System defaults
      InvDisc: 0,
      InvDiscAmnt: 0,
      InvDiscAmntEx: 0,
      OrdDiscAmnt: 0,
      OrdDiscAmntEx: 0,
      DelMethodID: 0,
      DocRepID: 0,
      ProjectID: 0,
      TillID: 0,
      OrderStatusID: 0,
      OrderPriorityID: 0,
      ForeignCurrencyID: 0,
      bUseFixedPrices: false,
      iDocPrinted: 0,
      iINVNUMAgentID: 1,
      fExchangeRate: 0,
      fGrvSplitFixedAmntForeign: 0,
      fInvDiscAmntForeign: 0,
      POSAmntTendered: 0,
      POSChange: 0,
    },
    invoiceLines: [],
    metadata: {
      orderId: `cron-test-order-${orderSuffix}`,
      orderNumber: `CRON-TEST-${orderSuffix}`,
      manufacturerId: "6863ecfcf2c7749f5413ba66",
      erpSystem: "sage",
      currency: "KES",
      taxRate: 16,
      taxInclusive: true,
      transformedAt: timestamp,
    },
  };
};

// Generate random invoice lines
const generateInvoiceLines = (totalIncl, taxRate = 16) => {
  const numLines = Math.floor(Math.random() * 3) + 1; // 1-3 lines
  const lines = [];

  // Calculate totals
  const totalExcl = parseFloat((totalIncl / (1 + taxRate / 100)).toFixed(2));
  const totalTax = totalIncl - totalExcl;

  for (let i = 0; i < numLines; i++) {
    const quantity = Math.floor(Math.random() * 10) + 1; // 1-10 qty
    const lineTotal = parseFloat((totalIncl / numLines).toFixed(2));
    const lineTotalExcl = parseFloat(
      (lineTotal / (1 + taxRate / 100)).toFixed(2)
    );
    const lineTax = lineTotal - lineTotalExcl;
    const unitPriceIncl = parseFloat((lineTotal / quantity).toFixed(2));
    const unitPriceExcl = parseFloat(
      (unitPriceIncl / (1 + taxRate / 100)).toFixed(2)
    );

    lines.push({
      cDescription: `Test Product ${String.fromCharCode(
        65 + i
      )} - ${quantity}KG`,
      fQuantity: quantity,
      fQtyToProcess: quantity,
      cLineNotes: `Automated test line ${i + 1}`,
      fUnitPriceExclzDefault: unitPriceExcl,
      fUnitPriceInclzDefault: unitPriceIncl,
      fUnitCost: parseFloat((unitPriceExcl * 0.6).toFixed(2)), // 60% cost
      fLineDiscount: 0,
      fTaxRate: taxRate,
      bIsWhseItem: true,
      iStockCodeID: Math.floor(Math.random() * 900) + 100, // Random 100-999
      iWarehouseID: 1,
      iTaxTypeID: 3,
      iPriceListNameID: 0,

      // Line totals
      fQuantityLineTotIncl: lineTotal,
      fQuantityLineTotExcl: lineTotalExcl,
      fQuantityLineTotInclNoDisc: lineTotal,
      fQuantityLineTotExclNoDisc: lineTotalExcl,
      fQuantityLineTaxAmount: lineTax,
      fQuantityLineTaxAmountNoDisc: lineTax,

      // Qty to process totals (same as quantity)
      fQtyToProcessLineTotIncl: lineTotal,
      fQtyToProcessLineTotExcl: lineTotalExcl,
      fQtyToProcessLineTotInclNoDisc: lineTotal,
      fQtyToProcessLineTotExclNoDisc: lineTotalExcl,
      fQtyToProcessLineTaxAmount: lineTax,
      fQtyToProcessLineTaxAmountNoDisc: lineTax,

      // System fields
      iLineRepID: 0,
      iLineProjectID: 0,
      iLedgerAccountID: 0,
      iModule: 0,
      bChargeCom: true,
      iLineID: i + 1,

      // Quantity fields
      fQtyLinkedUsed: quantity,
      fQtyChange: quantity,
      fQuantityUR: quantity,
      fQtyChangeUR: quantity,
      fQtyToProcessUR: quantity,
      fQtyLastProcessUR: quantity,
    });
  }

  return { lines, totalExcl, totalTax };
};

// Send test order to webhook
async function sendTestOrder() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("🕐 AUTOMATED WEBHOOK TEST - " + new Date().toLocaleString());
    console.log("=".repeat(60));

    // Generate test order
    const testOrder = generateTestOrder();
    const { lines, totalExcl, totalTax } = generateInvoiceLines(
      testOrder.invoiceHeader.InvTotIncl
    );

    // Update header totals
    testOrder.invoiceHeader.InvTotExcl = totalExcl;
    testOrder.invoiceHeader.InvTotTax = totalTax;
    testOrder.invoiceHeader.InvTotExclDEx = totalExcl;
    testOrder.invoiceHeader.InvTotTaxDEx = totalTax;
    testOrder.invoiceHeader.InvTotInclDEx = testOrder.invoiceHeader.InvTotIncl;
    testOrder.invoiceHeader.OrdTotExcl = totalExcl;
    testOrder.invoiceHeader.OrdTotTax = totalTax;
    testOrder.invoiceHeader.OrdTotIncl = testOrder.invoiceHeader.InvTotIncl;
    testOrder.invoiceHeader.OrdTotExclDEx = totalExcl;
    testOrder.invoiceHeader.OrdTotTaxDEx = totalTax;
    testOrder.invoiceHeader.OrdTotInclDEx = testOrder.invoiceHeader.InvTotIncl;

    // Add generated lines
    testOrder.invoiceLines = lines;

    console.log("📋 Test Order Details:");
    console.log(`   Order Number: ${testOrder.invoiceHeader.OrderNum}`);
    console.log(`   Account ID: ${testOrder.invoiceHeader.AccountID}`);
    console.log(`   Total: KES ${testOrder.invoiceHeader.InvTotIncl}`);
    console.log(`   Lines: ${lines.length} items`);
    console.log(`   Webhook: ${WEBHOOK_URL}`);

    // Send to webhook
    console.log("\n📡 Sending to webhook...");
    const startTime = Date.now();

    const response = await axios.post(WEBHOOK_URL, testOrder, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "OdaFlow-Cron-Tester/1.0",
      },
      timeout: 30000, // 30 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (response.status === 200 && response.data.success) {
      console.log("✅ SUCCESS!");
      console.log(`   Response Time: ${responseTime}ms`);
      console.log(`   Sage Invoice ID: ${response.data.sageInvoiceId}`);
      console.log(`   Message: ${response.data.message}`);

      // Update statistics
      updateStats("success", responseTime, response.data.sageInvoiceId);
    } else {
      console.log("❌ FAILED!");
      console.log(`   HTTP Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);

      updateStats("failed", responseTime, null, response.data.error);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime || 0;
    console.log("❌ ERROR!");
    console.log(`   Error: ${error.message}`);
    console.log(`   Response Time: ${responseTime}ms`);

    if (error.response) {
      console.log(`   HTTP Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data)}`);
    }

    updateStats("error", responseTime, null, error.message);
  }

  console.log("=".repeat(60));
}

// Statistics tracking
let stats = {
  totalTests: 0,
  successful: 0,
  failed: 0,
  errors: 0,
  startTime: new Date(),
  lastTest: null,
  avgResponseTime: 0,
  totalResponseTime: 0,
  lastInvoiceId: null,
};

function updateStats(status, responseTime, invoiceId, error) {
  stats.totalTests++;
  stats.totalResponseTime += responseTime;
  stats.avgResponseTime = Math.round(
    stats.totalResponseTime / stats.totalTests
  );
  stats.lastTest = new Date();

  if (status === "success") {
    stats.successful++;
    stats.lastInvoiceId = invoiceId;
  } else if (status === "failed") {
    stats.failed++;
  } else {
    stats.errors++;
  }

  // Log statistics every test
  console.log("\n📊 STATISTICS:");
  console.log(`   Total Tests: ${stats.totalTests}`);
  console.log(
    `   Successful: ${stats.successful} (${(
      (stats.successful / stats.totalTests) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Errors: ${stats.errors}`);
  console.log(`   Avg Response Time: ${stats.avgResponseTime}ms`);
  console.log(`   Running Since: ${stats.startTime.toLocaleString()}`);
  console.log(
    `   Uptime: ${Math.floor(
      (Date.now() - stats.startTime.getTime()) / 60000
    )} minutes`
  );
  if (stats.lastInvoiceId) {
    console.log(`   Last Invoice ID: ${stats.lastInvoiceId}`);
  }
}

// Health check function
async function checkWebhookHealth() {
  try {
    const response = await axios.get(
      WEBHOOK_URL.replace("/receive-order", "/health"),
      {
        timeout: 10000,
        headers: { Accept: "application/json" },
      }
    );

    console.log("💚 HEALTH CHECK:");
    console.log(`   Status: ${response.data.status}`);
    console.log(
      `   Database Connected: ${
        response.data.connection?.isConnected ? "✅" : "❌"
      }`
    );
    console.log(
      `   Total Invoices: ${response.data.database?.totalInvoices || "N/A"}`
    );
    console.log(
      `   Server Uptime: ${Math.floor(response.data.uptime / 60)} minutes`
    );

    return true;
  } catch (error) {
    console.log("❌ HEALTH CHECK FAILED:");
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Main cron function
async function runCronTest() {
  console.log("\n🤖 CRON SERVICE STARTED");
  console.log(`⏰ Testing every ${INTERVAL_MINUTES} minutes`);
  console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`🚀 Started at: ${new Date().toLocaleString()}`);

  // Initial health check
  await checkWebhookHealth();

  // Initial test
  await sendTestOrder();

  // Schedule recurring tests
  setInterval(async () => {
    // Health check every other test (every 90 minutes)
    if (stats.totalTests % 2 === 0) {
      await checkWebhookHealth();
    }

    // Send test order
    await sendTestOrder();

    // Log next test time
    const nextTest = new Date(Date.now() + INTERVAL_MINUTES * 60 * 1000);
    console.log(`⏰ Next test scheduled for: ${nextTest.toLocaleString()}`);
  }, INTERVAL_MINUTES * 60 * 1000); // Convert minutes to milliseconds

  console.log(`⏰ Next test in ${INTERVAL_MINUTES} minutes...`);
}

// Graceful shutdown
function shutdown() {
  console.log("\n📴 CRON SERVICE STOPPING...");
  console.log("\n📊 FINAL STATISTICS:");
  console.log(`   Total Tests Run: ${stats.totalTests}`);
  console.log(
    `   Success Rate: ${
      stats.totalTests > 0
        ? ((stats.successful / stats.totalTests) * 100).toFixed(1)
        : 0
    }%`
  );
  console.log(
    `   Total Runtime: ${Math.floor(
      (Date.now() - stats.startTime.getTime()) / 60000
    )} minutes`
  );
  console.log(`   Average Response Time: ${stats.avgResponseTime}ms`);

  if (stats.lastInvoiceId) {
    console.log(`   Last Successfully Created Invoice: ${stats.lastInvoiceId}`);
  }

  console.log(
    "\n👋 Cron service stopped. Webhook server longevity test complete!"
  );
  process.exit(0);
}

// Handle shutdown signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error.message);
  console.log("🔄 Continuing cron service...");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection:", reason);
  console.log("🔄 Continuing cron service...");
});

// Start the cron service
console.log("🤖 Starting Webhook Longevity Test Service...");
console.log("📋 This service will:");
console.log(`   - Send test orders every ${INTERVAL_MINUTES} minutes`);
console.log("   - Monitor webhook server health");
console.log("   - Track response times and success rates");
console.log("   - Test database connectivity and longevity");
console.log("   - Generate unique orders (no conflicts)");
console.log("\nPress Ctrl+C to stop the service\n");

// Start after 5 seconds
setTimeout(() => {
  runCronTest().catch((error) => {
    console.error("❌ Failed to start cron service:", error.message);
    process.exit(1);
  });
}, 5000);

console.log("⏰ Starting in 5 seconds...");
