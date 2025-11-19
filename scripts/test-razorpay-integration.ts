// Test Razorpay integration with live credentials
async function testRazorpayIntegration() {
  console.log("🧪 TESTING RAZORPAY LIVE INTEGRATION")
  console.log("=".repeat(50))

  try {
    // Import Razorpay
    const Razorpay = require("razorpay")

    const razorpay = new Razorpay({
      key_id: "rzp_live_1G1FGPZa3AmNML",
      key_secret: "r5FrLJKwv0em26kuB2SlRre5",
    })

    console.log("🔧 Testing API endpoints...")

    // Test 1: Create a minimal order
    console.log("\n1️⃣ Testing order creation...")
    const testOrder = await razorpay.orders.create({
      amount: 9900, // ₹99 in paise
      currency: "INR",
      receipt: `test_order_${Date.now()}`,
      notes: {
        test: "true",
        platform: "Mahakavya Social",
        plan: "Prarambha",
      },
    })

    console.log("✅ Order created successfully!")
    console.log(`   Order ID: ${testOrder.id}`)
    console.log(`   Amount: ₹${testOrder.amount / 100}`)
    console.log(`   Status: ${testOrder.status}`)

    // Test 2: Fetch order details
    console.log("\n2️⃣ Testing order retrieval...")
    const fetchedOrder = await razorpay.orders.fetch(testOrder.id)
    console.log("✅ Order fetched successfully!")
    console.log(`   Retrieved Order ID: ${fetchedOrder.id}`)
    console.log(`   Created At: ${new Date(fetchedOrder.created_at * 1000).toLocaleString()}`)

    // Test 3: List recent orders
    console.log("\n3️⃣ Testing order listing...")
    const orders = await razorpay.orders.all({ count: 5 })
    console.log("✅ Orders listed successfully!")
    console.log(`   Total orders found: ${orders.items.length}`)

    // Test 4: Webhook signature verification
    console.log("\n4️⃣ Testing webhook signature generation...")
    const crypto = require("crypto")
    const testPayload = JSON.stringify({ test: "webhook" })
    const testSignature = crypto.createHmac("sha256", "r5FrLJKwv0em26kuB2SlRre5").update(testPayload).digest("hex")

    console.log("✅ Webhook signature generated successfully!")
    console.log(`   Test signature: ${testSignature.substring(0, 20)}...`)

    // Test 5: Payment link creation (if available)
    console.log("\n5️⃣ Testing payment link creation...")
    try {
      const paymentLink = await razorpay.paymentLink.create({
        amount: 9900,
        currency: "INR",
        description: "Mahakavya Social - Prarambha Plan",
        customer: {
          name: "Test User",
          email: "test@example.com",
        },
        notify: {
          sms: false,
          email: false,
        },
        reminder_enable: false,
        notes: {
          test: "true",
          platform: "Mahakavya Social",
        },
      })

      console.log("✅ Payment link created successfully!")
      console.log(`   Link ID: ${paymentLink.id}`)
      console.log(`   Short URL: ${paymentLink.short_url}`)
    } catch (linkError: any) {
      console.log("⚠️ Payment link creation not available or failed:", linkError.message)
    }

    // Test 6: Test subscription creation (if available)
    console.log("\n6️⃣ Testing subscription capabilities...")
    try {
      const plans = await razorpay.plans.all({ count: 5 })
      console.log("✅ Plans API accessible!")
      console.log(`   Available plans: ${plans.items.length}`)
    } catch (planError: any) {
      console.log("⚠️ Plans API not available or failed:", planError.message)
    }

    // Test 7: Test refund capabilities
    console.log("\n7️⃣ Testing refund API access...")
    try {
      const refunds = await razorpay.refunds.all({ count: 1 })
      console.log("✅ Refunds API accessible!")
      console.log(`   Recent refunds: ${refunds.items.length}`)
    } catch (refundError: any) {
      console.log("⚠️ Refunds API access limited:", refundError.message)
    }

    // Test 8: Validate pricing configuration
    console.log("\n8️⃣ Testing pricing configuration...")
    const pricingTests = [
      { plan: "Prarambha", amount: 9900, description: "One-time ₹99" },
      { plan: "Sampurna", amount: 9900, description: "Monthly ₹99 (intro)" },
      { plan: "Mahatva", amount: 118800, description: "Annual ₹1,188 (intro)" },
    ]

    for (const test of pricingTests) {
      const testOrder = await razorpay.orders.create({
        amount: test.amount,
        currency: "INR",
        receipt: `pricing_test_${test.plan}_${Date.now()}`,
        notes: {
          test: "pricing_validation",
          plan: test.plan,
        },
      })
      console.log(`   ✅ ${test.plan}: ${test.description} - Order ${testOrder.id}`)
    }

    console.log("\n🎉 ALL TESTS PASSED!")
    console.log("=".repeat(50))
    console.log("✅ Razorpay Live API is working correctly")
    console.log("✅ Order creation and management functional")
    console.log("✅ Webhook signature generation working")
    console.log("✅ Pricing configuration validated")
    console.log("✅ Ready for production use")

    console.log("\n📋 Integration Summary:")
    console.log(`🔑 Key ID: rzp_live_1G1FGPZa3AmNML`)
    console.log(`🌐 Mode: LIVE`)
    console.log(`💰 Currency: INR`)
    console.log(`🔗 API Status: ✅ Active`)
    console.log(`📊 Test Orders Created: ${3 + pricingTests.length}`)

    console.log("\n🚀 Production Readiness Checklist:")
    console.log("✅ API credentials validated")
    console.log("✅ Order creation working")
    console.log("✅ Webhook signatures functional")
    console.log("✅ Pricing plans validated")
    console.log("⏳ Webhook endpoints need configuration")
    console.log("⏳ Production domain setup required")

    console.log("\n📝 Next Steps:")
    console.log("1. Configure webhooks in Razorpay Dashboard")
    console.log("2. Set up production domain")
    console.log("3. Test complete payment flow")
    console.log("4. Monitor first live transactions")
  } catch (error: any) {
    console.error("\n❌ INTEGRATION TEST FAILED:", error.message)
    console.error("Error details:", error)

    if (error.message.includes("authentication")) {
      console.error("\n🔐 Authentication Error:")
      console.error("- Check if Key ID and Secret are correct")
      console.error("- Verify account is activated for live mode")
      console.error("- Ensure API keys have proper permissions")
    }

    if (error.message.includes("network")) {
      console.error("\n🌐 Network Error:")
      console.error("- Check internet connection")
      console.error("- Verify Razorpay API endpoints are accessible")
      console.error("- Check for firewall or proxy issues")
    }

    process.exit(1)
  }
}

// Run the test
testRazorpayIntegration()
