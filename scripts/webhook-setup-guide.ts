#!/usr/bin/env node

interface WebhookEndpoint {
  path: string
  description: string
  events: string[]
  method: string
}

const webhookEndpoints: WebhookEndpoint[] = [
  {
    path: "/api/payments/razorpay/webhook",
    description: "Main Razorpay webhook for payment processing",
    events: [
      "payment.captured",
      "payment.failed",
      "subscription.charged",
      "subscription.cancelled",
      "subscription.completed",
    ],
    method: "POST",
  },
]

class WebhookSetupGuide {
  private readonly baseUrl = "https://mahakavya.app"
  private readonly razorpayDashboard = "https://dashboard.razorpay.com"

  public displaySetupGuide(): void {
    console.log("🔗 RAZORPAY WEBHOOK SETUP GUIDE")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    console.log("\n📋 STEP 1: Access Razorpay Dashboard")
    console.log(`🌐 URL: ${this.razorpayDashboard}`)
    console.log("👤 Login with your Razorpay account credentials")

    console.log("\n📋 STEP 2: Navigate to Webhooks")
    console.log("1. Go to Settings → Webhooks")
    console.log('2. Click "Add New Webhook"')

    console.log("\n📋 STEP 3: Configure Webhook Endpoints")

    webhookEndpoints.forEach((endpoint, index) => {
      console.log(`\n🔗 Webhook ${index + 1}: ${endpoint.description}`)
      console.log(`📍 URL: ${this.baseUrl}${endpoint.path}`)
      console.log(`📤 Method: ${endpoint.method}`)
      console.log("📋 Events to subscribe:")
      endpoint.events.forEach((event) => {
        console.log(`   ✅ ${event}`)
      })
    })

    console.log("\n📋 STEP 4: Webhook Configuration Details")
    console.log("🔐 Secret: Generate a strong webhook secret")
    console.log("🌐 Active: Yes")
    console.log("📧 Alert Email: sreekar.pratap@gmail.com")

    console.log("\n📋 STEP 5: Test Webhook")
    console.log("1. Save the webhook configuration")
    console.log('2. Use "Test Webhook" feature in Razorpay dashboard')
    console.log("3. Check webhook logs in your application")

    console.log("\n🔒 SECURITY BEST PRACTICES")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("1. ✅ Always verify webhook signatures")
    console.log("2. ✅ Use HTTPS endpoints only")
    console.log("3. ✅ Implement idempotency for webhook processing")
    console.log("4. ✅ Log all webhook events for debugging")
    console.log("5. ✅ Set up monitoring and alerts")

    console.log("\n🧪 TESTING CHECKLIST")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("□ Test successful payment webhook")
    console.log("□ Test failed payment webhook")
    console.log("□ Test subscription creation webhook")
    console.log("□ Test subscription cancellation webhook")
    console.log("□ Verify webhook signature validation")
    console.log("□ Test webhook retry mechanism")

    console.log("\n🚨 TROUBLESHOOTING")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("❌ Webhook not receiving events:")
    console.log("   • Check URL accessibility from internet")
    console.log("   • Verify HTTPS certificate")
    console.log("   • Check firewall settings")

    console.log("\n❌ Webhook signature verification failing:")
    console.log("   • Verify webhook secret in environment variables")
    console.log("   • Check request body parsing")
    console.log("   • Ensure raw body is used for signature verification")

    console.log("\n❌ Webhook processing errors:")
    console.log("   • Check application logs")
    console.log("   • Verify database connectivity")
    console.log("   • Test with Razorpay webhook simulator")

    console.log("\n📞 SUPPORT CONTACTS")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("🏢 Razorpay Support: support@razorpay.com")
    console.log("📚 Documentation: https://razorpay.com/docs/webhooks/")
    console.log("💬 Community: https://razorpay.com/community/")

    console.log("\n✅ WEBHOOK SETUP COMPLETE!")
    console.log("Your Mahakavya Social Platform is ready for live payments! 🎉")
  }

  public generateWebhookTestScript(): string {
    return `
#!/bin/bash
# Webhook Test Script for Mahakavya Social Platform

echo "🧪 Testing Razorpay Webhooks..."

# Test webhook endpoint accessibility
echo "📡 Testing webhook endpoint..."
curl -X POST ${this.baseUrl}/api/payments/razorpay/webhook \\
  -H "Content-Type: application/json" \\
  -d '{"test": true}' \\
  -w "HTTP Status: %{http_code}\\n"

echo "✅ Webhook test completed!"
echo "Check your application logs for webhook processing details."
    `.trim()
  }
}

// Legal Policy Documents
const legalPolicies = {
  termsAndConditions: `
# Terms and Conditions - Mahakavya Social Platform

**Effective Date:** January 15, 2025  
**Last Updated:** January 15, 2025

## 1. Acceptance of Terms

By accessing and using Mahakavya Social Platform ("Platform", "Service", "we", "us"), you accept and agree to be bound by the terms and provision of this agreement.

## 2. Description of Service

Mahakavya is a comprehensive social platform that celebrates Indian cultural heritage through:
- Social networking and content sharing
- Fundraising campaigns for meaningful causes
- Peer support services (Sahaya)
- Video content creation and sharing (Drishya)
- Lucky draws and community engagement (Bhagyachakra)
- Real-time messaging and group conversations

## 3. User Accounts and Registration

### 3.1 Account Creation
- Users must provide accurate and complete information
- Users must be at least 13 years old to create an account
- One account per person is allowed
- Users are responsible for maintaining account security

### 3.2 Account Responsibilities
- Keep login credentials confidential
- Notify us immediately of any unauthorized access
- Accept responsibility for all activities under your account

## 4. Subscription Plans and Payments

### 4.1 Available Plans
- **Prarambha Plan:** ₹99 (One-time access to basic features)
- **Sampurna Plan:** ₹99/month (Full access with intro pricing)
- **Mahatva Plan:** ₹1,188/year (Premium annual plan)

### 4.2 Payment Terms
- All payments are processed through Razorpay
- Prices are in Indian Rupees (INR)
- Payments are non-refundable except as specified in our Refund Policy
- Subscription auto-renewal can be cancelled anytime

### 4.3 Free Trial and Promotional Offers
- New users may receive promotional pricing
- Trial periods and promotional offers are subject to change
- Promotional pricing may not be combined with other offers

## 5. User Content and Conduct

### 5.1 Content Guidelines
Users agree not to post content that:
- Violates any laws or regulations
- Infringes on intellectual property rights
- Contains hate speech, harassment, or discrimination
- Promotes violence or illegal activities
- Contains explicit sexual content
- Spreads misinformation or spam

### 5.2 Content Ownership
- Users retain ownership of their original content
- Users grant Mahakavya a license to use, display, and distribute content
- Mahakavya may remove content that violates these terms

### 5.3 Community Standards
- Respect other users and their opinions
- Engage constructively in discussions
- Report inappropriate content or behavior
- Follow cultural sensitivity guidelines

## 6. Fundraising and Donations

### 6.1 Campaign Creation
- Fundraising campaigns must be for legitimate causes
- Campaign creators are responsible for accurate information
- Mahakavya reserves the right to review and approve campaigns

### 6.2 Donation Processing
- All donations are processed securely through Razorpay
- Donation receipts are provided for tax purposes
- Donors can track campaign progress and fund utilization

### 6.3 Fund Distribution
- Funds are released to campaign creators after verification
- Mahakavya may hold funds if fraud is suspected
- Unused funds may be returned to donors or redirected

## 7. Privacy and Data Protection

### 7.1 Data Collection
- We collect information as described in our Privacy Policy
- Users can control their privacy settings
- Data is used to improve service quality

### 7.2 Data Security
- We implement industry-standard security measures
- Users are notified of any data breaches
- Data is stored securely and encrypted

## 8. Intellectual Property

### 8.1 Platform Content
- Mahakavya owns all platform-related intellectual property
- Users may not copy, modify, or distribute platform code
- Trademarks and logos are protected

### 8.2 User Content
- Users retain rights to their original content
- Users must respect others' intellectual property
- Copyright infringement reports are handled promptly

## 9. Termination

### 9.1 Account Termination
- Users may delete their accounts at any time
- Mahakavya may suspend accounts for terms violations
- Terminated accounts lose access to paid features

### 9.2 Data Retention
- Account data is retained for 30 days after deletion
- Users can request immediate data deletion
- Some data may be retained for legal compliance

## 10. Disclaimers and Limitations

### 10.1 Service Availability
- Service is provided "as is" without warranties
- We do not guarantee uninterrupted service
- Maintenance and updates may cause temporary downtime

### 10.2 Limitation of Liability
- Mahakavya's liability is limited to the amount paid by users
- We are not liable for indirect or consequential damages
- Users assume risks associated with online interactions

## 11. Governing Law

These terms are governed by the laws of India. Any disputes will be resolved in the courts of Bangalore, Karnataka.

## 12. Changes to Terms

We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or platform notifications.

## 13. Contact Information

For questions about these terms, contact us at:
- **Email:** legal@mahakavya.app
- **Address:** 123, MG Road, Bengaluru, KA 560001, India
- **Phone:** +91-80-1234-5678

---

**Mahakavya Social Pvt. Ltd.**  
*Celebrating Indian Cultural Heritage Through Technology*
  `,

  privacyPolicy: `
# Privacy Policy - Mahakavya Social Platform

**Effective Date:** January 15, 2025  
**Last Updated:** January 15, 2025

## 1. Introduction

Mahakavya Social Platform ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.

## 2. Information We Collect

### 2.1 Personal Information
- **Account Information:** Name, email address, phone number, date of birth
- **Profile Information:** Bio, profile picture, location, interests
- **Payment Information:** Billing address, payment method details (processed by Razorpay)
- **Identity Verification:** Government ID for certain features (encrypted and secure)

### 2.2 Usage Information
- **Activity Data:** Posts, comments, likes, shares, messages
- **Interaction Data:** Connections, groups joined, campaigns supported
- **Device Information:** IP address, browser type, operating system
- **Location Data:** Approximate location based on IP address (with consent)

### 2.3 Communication Data
- **Messages:** Direct messages and group conversations
- **Support Communications:** Help desk interactions and feedback
- **Marketing Communications:** Newsletter subscriptions and promotional content

## 3. How We Use Your Information

### 3.1 Service Provision
- Create and manage your account
- Process payments and subscriptions
- Provide customer support
- Enable social features and interactions

### 3.2 Platform Improvement
- Analyze usage patterns and trends
- Develop new features and services
- Improve user experience and interface
- Conduct research and analytics

### 3.3 Communication
- Send service-related notifications
- Provide customer support responses
- Share platform updates and news
- Send marketing communications (with consent)

### 3.4 Safety and Security
- Detect and prevent fraud
- Monitor for harmful or illegal content
- Enforce community guidelines
- Protect user safety and platform integrity

## 4. Information Sharing and Disclosure

### 4.1 With Your Consent
- Share information when you explicitly consent
- Public posts and profile information
- Campaign information for fundraising
- Social interactions and connections

### 4.2 Service Providers
- **Payment Processing:** Razorpay for secure payment handling
- **Cloud Storage:** Supabase for data storage and management
- **Analytics:** Anonymized data for platform improvement
- **Communication:** Email and SMS service providers

### 4.3 Legal Requirements
- Comply with legal obligations
- Respond to legal requests and court orders
- Protect rights, property, and safety
- Prevent fraud and illegal activities

### 4.4 Business Transfers
- In case of merger, acquisition, or sale
- Data may be transferred to new owners
- Users will be notified of any changes
- Privacy protections will be maintained

## 5. Data Security

### 5.1 Security Measures
- **Encryption:** Data encrypted in transit and at rest
- **Access Controls:** Limited access to authorized personnel
- **Regular Audits:** Security assessments and vulnerability testing
- **Secure Infrastructure:** Industry-standard security practices

### 5.2 Data Breach Response
- Immediate investigation and containment
- User notification within 72 hours
- Regulatory authority notification
- Remediation and prevention measures

## 6. Your Privacy Rights

### 6.1 Access and Control
- **Account Settings:** Manage privacy preferences
- **Data Access:** Request copy of your personal data
- **Data Correction:** Update or correct inaccurate information
- **Data Deletion:** Request account and data deletion

### 6.2 Communication Preferences
- **Email Notifications:** Opt-out of marketing emails
- **Push Notifications:** Control mobile app notifications
- **SMS Messages:** Unsubscribe from text messages
- **Targeted Advertising:** Opt-out of personalized ads

### 6.3 Data Portability
- Export your data in standard formats
- Transfer data to other platforms
- Maintain data ownership rights
- Receive data within 30 days of request

## 7. Cookies and Tracking

### 7.1 Cookie Usage
- **Essential Cookies:** Required for platform functionality
- **Analytics Cookies:** Track usage and performance
- **Preference Cookies:** Remember user settings
- **Marketing Cookies:** Personalize advertising (with consent)

### 7.2 Cookie Management
- Browser settings to control cookies
- Opt-out of non-essential cookies
- Third-party cookie policies
- Regular cookie policy updates

## 8. Children's Privacy

### 8.1 Age Restrictions
- Platform is not intended for children under 13
- Parental consent required for users 13-17
- Special protections for minor users
- Educational content and safety features

### 8.2 Parental Controls
- Account monitoring and restrictions
- Content filtering options
- Communication limitations
- Privacy setting management

## 9. International Data Transfers

### 9.1 Data Location
- Primary data storage in India
- Cloud services may involve international transfers
- Adequate protection measures in place
- Compliance with local data protection laws

### 9.2 Transfer Safeguards
- Standard contractual clauses
- Adequacy decisions recognition
- Data protection impact assessments
- Regular compliance monitoring

## 10. Data Retention

### 10.1 Retention Periods
- **Account Data:** Retained while account is active
- **Transaction Data:** 7 years for financial records
- **Communication Data:** 2 years for support purposes
- **Analytics Data:** Anonymized and aggregated indefinitely

### 10.2 Deletion Process
- Automatic deletion after retention period
- User-requested deletion within 30 days
- Backup data removal within 90 days
- Legal hold exceptions may apply

## 11. Third-Party Services

### 11.1 Integrated Services
- **Razorpay:** Payment processing and financial services
- **Supabase:** Database and authentication services
- **Social Media:** Login and sharing integrations
- **Analytics:** Usage tracking and insights

### 11.2 Third-Party Policies
- Each service has its own privacy policy
- We are not responsible for third-party practices
- Users should review third-party policies
- Data sharing is limited to necessary purposes

## 12. Updates to Privacy Policy

### 12.1 Policy Changes
- Regular review and updates
- User notification of material changes
- Continued use implies acceptance
- Previous versions available upon request

### 12.2 Notification Methods
- Email notifications to registered users
- Platform announcements and banners
- App notifications for mobile users
- Website posting of updated policy

## 13. Contact Information

For privacy-related questions or concerns:

- **Privacy Officer:** privacy@mahakavya.app
- **General Inquiries:** support@mahakavya.app
- **Postal Address:** 123, MG Road, Bengaluru, KA 560001, India
- **Phone:** +91-80-1234-5678

### 13.1 Data Protection Officer
- **Name:** Sreekar Pratap
- **Email:** dpo@mahakavya.app
- **Response Time:** Within 5 business days

---

**Mahakavya Social Pvt. Ltd.**  
*Your Privacy, Our Priority*
  `,

  refundPolicy: `
# Refund Policy - Mahakavya Social Platform

**Effective Date:** January 15, 2025  
**Last Updated:** January 15, 2025

## 1. Overview

This Refund Policy outlines the terms and conditions for refunds on Mahakavya Social Platform. We strive to provide excellent service and fair refund practices for our users.

## 2. Subscription Refunds

### 2.1 Prarambha Plan (₹99 One-time)
- **Refund Period:** 7 days from purchase date
- **Conditions:** No content creation or significant platform usage
- **Process:** Automatic refund to original payment method
- **Timeline:** 5-7 business days

### 2.2 Sampurna Plan (₹99/month)
- **Refund Period:** 14 days from subscription start
- **Pro-rated Refunds:** Available for unused portion
- **Cancellation:** Can cancel anytime, no future charges
- **Process:** Contact support for refund request

### 2.3 Mahatva Plan (₹1,188/year)
- **Refund Period:** 30 days from subscription start
- **Pro-rated Refunds:** Available for unused months
- **Conditions:** Limited platform usage required
- **Process:** Detailed review and approval process

## 3. Donation Refunds

### 3.1 Campaign Donations
- **Refund Period:** 48 hours from donation
- **Conditions:** Campaign not yet funded or started
- **Process:** Contact campaign creator or support
- **Exceptions:** Emergency campaigns may have different terms

### 3.2 Platform Donations
- **General Donations:** Non-refundable after 24 hours
- **Accidental Donations:** Case-by-case review
- **Fraudulent Campaigns:** Full refund if verified
- **Process:** Submit refund request with documentation

## 4. In-App Purchase Refunds

### 4.1 Virtual Goods
- **Digital Content:** Generally non-refundable
- **Unused Credits:** Refundable within 30 days
- **Technical Issues:** Full refund if service unavailable
- **Process:** Automatic or support-assisted

### 4.2 Premium Features
- **Feature Access:** Pro-rated refunds available
- **Service Interruption:** Automatic credit or refund
- **Dissatisfaction:** Case-by-case evaluation
- **Timeline:** 3-5 business days

## 5. Refund Eligibility Criteria

### 5.1 Qualifying Conditions
- ✅ Technical issues preventing service use
- ✅ Billing errors or duplicate charges
- ✅ Service not delivered as promised
- ✅ Account security compromises
- ✅ Platform policy violations by us

### 5.2 Non-Qualifying Conditions
- ❌ Change of mind after extended usage
- ❌ Violation of terms and conditions
- ❌ Account suspension due to user misconduct
- ❌ Requests beyond specified time limits
- ❌ Services already consumed or utilized

## 6. Refund Process

### 6.1 Request Submission
1. **Contact Support:** Email support@mahakavya.app
2. **Provide Details:** Order ID, reason, supporting documents
3. **Review Process:** 2-3 business days evaluation
4. **Decision Notification:** Email confirmation of decision
5. **Processing:** 5-7 business days for approved refunds

### 6.2 Required Information
- **Account Details:** Username and registered email
- **Transaction ID:** Payment reference number
- **Purchase Date:** When the transaction occurred
- **Reason:** Detailed explanation for refund request
- **Supporting Documents:** Screenshots, receipts, etc.

## 7. Refund Methods

### 7.1 Original Payment Method
- **Credit/Debit Cards:** 5-7 business days
- **Net Banking:** 3-5 business days
- **Digital Wallets:** 1-3 business days
- **UPI:** 1-2 business days

### 7.2 Alternative Methods
- **Platform Credits:** Instant credit to account
- **Bank Transfer:** 7-10 business days
- **Cheque:** 15-20 business days (for large amounts)
- **Cash:** Not available for online transactions

## 8. Special Circumstances

### 8.1 Technical Issues
- **Platform Downtime:** Automatic service credits
- **Feature Malfunctions:** Pro-rated refunds
- **Data Loss:** Compensation based on impact
- **Security Breaches:** Full refund if requested

### 8.2 Medical/Emergency Situations
- **Medical Emergencies:** Extended refund periods
- **Family Emergencies:** Case-by-case consideration
- **Financial Hardship:** Payment plan alternatives
- **Documentation Required:** Medical certificates, etc.

## 9. Dispute Resolution

### 9.1 Internal Process
1. **Initial Review:** Support team evaluation
2. **Escalation:** Senior management review
3. **Final Decision:** Within 7 business days
4. **Appeal Process:** One appeal allowed within 30 days

### 9.2 External Resolution
- **Consumer Courts:** As per Indian consumer laws
- **Banking Ombudsman:** For payment disputes
- **Razorpay Disputes:** Through payment gateway
- **Legal Action:** Last resort for unresolved issues

## 10. Chargeback Policy

### 10.1 Chargeback Prevention
- Clear billing descriptors
- Proactive customer communication
- Easy refund request process
- Detailed transaction records

### 10.2 Chargeback Response
- **Investigation:** Within 24 hours of notification
- **Documentation:** Comprehensive evidence submission
- **Resolution:** Work with banks and payment processors
- **Account Impact:** May affect future payment processing

## 11. Refund Limitations

### 11.1 Time Limits
- **Subscription Refunds:** As specified per plan
- **Donation Refunds:** 48 hours maximum
- **Technical Issues:** 90 days from occurrence
- **Billing Disputes:** 60 days from statement

### 11.2 Amount Limitations
- **Processing Fees:** May be deducted from refunds
- **Currency Conversion:** Exchange rate fluctuations
- **Tax Implications:** User responsibility for tax matters
- **Partial Refunds:** Based on usage and circumstances

## 12. Policy Updates

### 12.1 Modification Rights
- We reserve the right to modify this policy
- Users will be notified of significant changes
- Continued use implies acceptance of changes
- Previous transactions governed by applicable policy

### 12.2 Notification Methods
- Email notifications to registered users
- Platform announcements
- Website policy updates
- App notifications

## 13. Contact Information

For refund requests and inquiries:

### 13.1 Support Channels
- **Email:** refunds@mahakavya.app
- **Support Portal:** https://mahakavya.app/support
- **Phone:** +91-80-1234-5678 (Mon-Fri, 9 AM - 6 PM IST)
- **Live Chat:** Available on platform during business hours

### 13.2 Escalation Contacts
- **Refund Manager:** refund-manager@mahakavya.app
- **Customer Relations:** customer-relations@mahakavya.app
- **Legal Team:** legal@mahakavya.app

---

**Mahakavya Social Pvt. Ltd.**  
*Fair Refunds, Happy Users*
  `,

  cancellationPolicy: `
# Cancellation Policy - Mahakavya Social Platform

**Effective Date:** January 15, 2025  
**Last Updated:** January 15, 2025

## 1. Overview

This Cancellation Policy explains how users can cancel their subscriptions, services, and accounts on Mahakavya Social Platform. We provide flexible cancellation options to ensure user satisfaction.

## 2. Subscription Cancellations

### 2.1 Prarambha Plan (₹99 One-time)
- **Cancellation:** Not applicable (one-time purchase)
- **Access:** Lifetime access to basic features
- **Refund:** Available within 7 days (see Refund Policy)
- **Downgrade:** Not applicable

### 2.2 Sampurna Plan (₹99/month)
- **Cancellation:** Anytime before next billing cycle
- **Access:** Continues until current period ends
- **Auto-renewal:** Stops after cancellation
- **Reactivation:** Available anytime with new billing cycle

### 2.3 Mahatva Plan (₹1,188/year)
- **Cancellation:** Anytime during subscription period
- **Access:** Continues until subscription expires
- **Pro-rated Refund:** Available within 30 days
- **Downgrade:** Option to switch to monthly plan

## 3. How to Cancel Subscriptions

### 3.1 Self-Service Cancellation
1. **Login:** Access your Mahakavya account
2. **Settings:** Go to Account Settings → Billing
3. **Subscription:** Find active subscription
4. **Cancel:** Click "Cancel Subscription" button
5. **Confirmation:** Confirm cancellation request
6. **Email:** Receive cancellation confirmation

### 3.2 Support-Assisted Cancellation
- **Email:** billing@mahakavya.app
- **Phone:** +91-80-1234-5678
- **Live Chat:** Available during business hours
- **Required Info:** Account email and subscription details

### 3.3 Emergency Cancellation
- **Immediate Stop:** For billing disputes
- **Fraud Protection:** Suspicious activity detection
- **Account Security:** Compromised account protection
- **Contact:** emergency@mahakavya.app

## 4. Campaign Cancellations

### 4.1 Fundraising Campaigns
- **Creator Cancellation:** Before campaign goes live
- **Platform Cancellation:** Policy violations or fraud
- **Donor Impact:** Full refunds for cancelled campaigns
- **Timeline:** 24-48 hours processing time

### 4.2 Cancellation Conditions
- ✅ Campaign not yet published
- ✅ No donations received
- ✅ Policy compliance issues
- ✅ Creator request with valid reason
- ❌ Active campaigns with donations (special process required)

## 5. Service Cancellations

### 5.1 Sahaya (Support Services)
- **Session Cancellation:** Up to 2 hours before scheduled time
- **Listener Cancellation:** 24 hours notice required
- **Emergency Cancellation:** Medical or family emergencies
- **Rescheduling:** Alternative to cancellation

### 5.2 Drishya (Video Services)
- **Upload Cancellation:** Before processing completion
- **Live Stream Cancellation:** Up to 30 minutes before start
- **Scheduled Content:** 1 hour advance notice
- **Automatic Cancellation:** Technical issues or violations

## 6. Account Cancellation (Deletion)

### 6.1 Account Deletion Process
1. **Backup Data:** Download your information
2. **Cancel Subscriptions:** Stop all active billing
3. **Clear Obligations:** Resolve pending issues
4. **Submit Request:** Use account deletion form
5. **Verification:** Confirm identity and intent
6. **Processing:** 30-day deletion timeline

### 6.2 Data Retention After Cancellation
- **Personal Data:** Deleted within 30 days
- **Transaction Records:** Retained for 7 years (legal requirement)
- **Content:** Removed from public view immediately
- **Backups:** Purged within 90 days

### 6.3 Account Reactivation
- **Grace Period:** 30 days to reactivate
- **Data Recovery:** Full restoration during grace period
- **After Grace Period:** New account creation required
- **Premium Features:** Require new subscription

## 7. Cancellation Effects

### 7.1 Immediate Effects
- **Billing Stop:** No future charges
- **Feature Access:** Premium features disabled at period end
- **Data Access:** Full access until subscription expires
- **Support:** Basic support continues

### 7.2 End of Billing Period Effects
- **Feature Downgrade:** Revert to free tier features
- **Storage Limits:** Reduced storage capacity
- **Advanced Features:** AI, blockchain features disabled
- **Priority Support:** Standard support only

## 8. Cancellation Fees

### 8.1 No Cancellation Fees
- **Subscription Cancellations:** Always free
- **Account Deletions:** No charges
- **Service Cancellations:** Generally free
- **Early Termination:** No penalties

### 8.2 Processing Fees
- **Refund Processing:** May apply for certain payment methods
- **International Transactions:** Currency conversion fees
- **Third-party Fees:** Bank or payment gateway charges
- **Expedited Processing:** Optional fast-track fees

## 9. Special Cancellation Scenarios

### 9.1 Medical Emergencies
- **Extended Grace Period:** Up to 90 days
- **Documentation Required:** Medical certificates
- **Partial Refunds:** Case-by-case evaluation
- **Service Suspension:** Temporary hold option

### 9.2 Financial Hardship
- **Payment Plans:** Alternative to cancellation
- **Reduced Pricing:** Temporary discounts
- **Service Pause:** Up to 6 months
- **Documentation:** Income proof may be required

### 9.3 Technical Issues
- **Platform Problems:** Automatic service credits
- **User Device Issues:** Troubleshooting support
- **Connectivity Problems:** Service extensions
- **Bug-related Issues:** Compensation consideration

## 10. Business Account Cancellations

### 10.1 Enterprise Accounts
- **Contract Terms:** As per signed agreement
- **Notice Period:** 30-90 days advance notice
- **Data Migration:** Assistance provided
- **Final Billing:** Pro-rated charges

### 10.2 Creator Accounts
- **Content Ownership:** Retained by creator
- **Revenue Sharing:** Final settlement within 30 days
- **Platform Tools:** Access until subscription ends
- **Migration Support:** Export tools provided

## 11. Cancellation Prevention

### 11.1 Retention Offers
- **Discount Offers:** Special pricing for cancelling users
- **Feature Upgrades:** Additional benefits
- **Service Improvements:** Address specific concerns
- **Pause Options:** Temporary suspension instead of cancellation

### 11.2 Feedback Collection
- **Exit Surveys:** Understand cancellation reasons
- **Improvement Initiatives:** Based on user feedback
- **Win-back Campaigns:** Re-engagement efforts
- **Service Enhancements:** Continuous platform improvements

## 12. Legal and Compliance

### 12.1 Consumer Rights
- **Right to Cancel:** As per Indian consumer laws
- **Cooling-off Period:** For certain services
- **Fair Practice:** Transparent cancellation process
- **Dispute Resolution:** Multiple channels available

### 12.2 Regulatory Compliance
- **RBI Guidelines:** Payment and refund compliance
- **Consumer Protection Act:** User rights protection
- **Data Protection:** GDPR and local privacy laws
- **Industry Standards:** Best practice adherence

## 13. Contact Information

For cancellation assistance:

### 13.1 Cancellation Support
- **Email:** cancel@mahakavya.app
- **Phone:** +91-80-1234-5678
- **Live Chat:** Available 9 AM - 9 PM IST
- **Support Portal:** https://mahakavya.app/support/cancel

### 13.2 Specialized Support
- **Billing Issues:** billing@mahakavya.app
- **Technical Problems:** tech-support@mahakavya.app
- **Account Deletion:** account-deletion@mahakavya.app
- **Emergency Cancellation:** emergency@mahakavya.app

---

**Mahakavya Social Pvt. Ltd.**  
*Easy Cancellations, No Hassles*
  `,
}

// Run guide
if (require.main === module) {
  const guide = new WebhookSetupGuide()
  guide.displaySetupGuide()

  console.log("\n📄 LEGAL POLICIES CREATED")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("✅ Terms and Conditions")
  console.log("✅ Privacy Policy")
  console.log("✅ Refund Policy")
  console.log("✅ Cancellation Policy")
  console.log("\n🔗 Policy Links:")
  console.log("📋 Terms: https://mahakavya.app/legal/terms")
  console.log("🔒 Privacy: https://mahakavya.app/legal/privacy")
  console.log("💰 Refunds: https://mahakavya.app/legal/refunds")
  console.log("❌ Cancellation: https://mahakavya.app/legal/cancellation")
}

export { WebhookSetupGuide, legalPolicies }
