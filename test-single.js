const axios = require('axios');

/**
 * Single webhook test - for manual testing
 */

const WEBHOOK_URL = 'https://extorsively-sobersided-zora.ngrok-free.dev/receive-order';

async function runSingleTest() {
  const timestamp = new Date().toISOString();
  const orderSuffix = Date.now();
  
  const testOrder = {
    deliveryId: `single-test-${orderSuffix}`,
    timestamp: timestamp,
    invoiceHeader: {
      DocType: 4,
      DocState: 1,
      AccountID: 999,
      Description: "Single Test Order",
      OrderNum: `SINGLE-TEST-${orderSuffix}`,
      ExtOrderNum: `SINGLE-TEST-${orderSuffix}`,
      InvDate: timestamp,
      OrderDate: timestamp,
      TaxInclusive: true,
      Address1: "Single Test Address",
      Address2: "Nairobi",
      Address3: "Kenya",
      InvTotIncl: 580.0,
      InvTotExcl: 500.0,
      InvTotTax: 80.0,
      InvTotExclDEx: 500.0,
      InvTotTaxDEx: 80.0,
      InvTotInclDEx: 580.0,
      OrdTotExcl: 500.0,
      OrdTotTax: 80.0,
      OrdTotIncl: 580.0,
      OrdTotExclDEx: 500.0,
      OrdTotTaxDEx: 80.0,
      OrdTotInclDEx: 580.0,
      InvDisc: 0,
      DelMethodID: 0,
      DocRepID: 0,
      ProjectID: 0,
      TillID: 0,
      bUseFixedPrices: false,
      iDocPrinted: 0,
      iINVNUMAgentID: 1
    },
    invoiceLines: [
      {
        cDescription: "Single Test Product",
        fQuantity: 5,
        fQtyToProcess: 5,
        fUnitPriceExclzDefault: 100.0,
        fUnitPriceInclzDefault: 116.0,
        fTaxRate: 16,
        iStockCodeID: 888,
        iTaxTypeID: 3,
        iWarehouseID: 1,
        bIsWhseItem: true,
        fQuantityLineTotExcl: 500.0,
        fQuantityLineTotIncl: 580.0,
        fQuantityLineTaxAmount: 80.0,
        iLineID: 1
      }
    ],
    metadata: {
      orderId: `single-test-order-${orderSuffix}`,
      orderNumber: `SINGLE-TEST-${orderSuffix}`,
      erpSystem: "sage",
      currency: "KES"
    }
  };
  
  try {
    console.log('📡 Sending single test order...');
    console.log(`   Order: ${testOrder.invoiceHeader.OrderNum}`);
    console.log(`   Total: KES ${testOrder.invoiceHeader.InvTotIncl}`);
    
    const response = await axios.post(WEBHOOK_URL, testOrder, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Test successful!');
      console.log(`   Sage Invoice ID: ${response.data.sageInvoiceId}`);
      console.log(`   Message: ${response.data.message}`);
    } else {
      console.log('❌ Test failed!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);
    }
    
  } catch (error) {
    console.log('❌ Test error!');
    console.log(`   Error: ${error.message}`);
    
    if (error.response) {
      console.log(`   HTTP Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data)}`);
    }
  }
}

// Run single test
runSingleTest().then(() => {
  console.log('\n🏁 Single test completed');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error.message);
  process.exit(1);
});
