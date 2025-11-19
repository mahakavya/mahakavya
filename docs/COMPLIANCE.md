# Compliance & Receipts

This document outlines the compliance features implemented in Mahakavya for handling invoices, donation receipts, data export, and account deletion.

## Generated Documents

### Invoices
- **Generated for**: Subscription payments (monthly/annual plans)
- **Format**: PDF with tax invoice header
- **Content**: Invoice number, date, buyer details, plan information, billing period, amount
- **Storage**: Private Supabase Storage bucket (`invoices`)
- **Access**: Signed URLs with 15-minute expiry

### Donation Receipts
- **Generated for**: Captured donations to fundraising campaigns
- **Format**: PDF with donation receipt header
- **Content**: Receipt number, date, donor details, campaign title, amount, payment ID
- **Storage**: Private Supabase Storage bucket (`receipts`)
- **Access**: Signed URLs with 15-minute expiry

## Document Numbering

Documents use sequential numbering with the format:
- **Invoices**: `INV-YYYYMM-0001`
- **Receipts**: `RCT-YYYYMM-0001`

Counters are scoped by document type and month/year period for proper sequencing.

## Storage Architecture

### Private Buckets
- `invoices/`: User invoices organized by `{user_id}/{invoice_number}.pdf`
- `receipts/`: Donation receipts organized by `{user_id}/{receipt_number}.pdf`

### Security
- All buckets are private (no public access)
- Documents served via signed URLs only
- URLs expire after 15 minutes
- Only document owners (or admins) can generate/access documents

## Data Export

Users can export their complete data including:
- Profile information
- Posts and comments
- Reels and captions
- Messages (sent only)
- Donations made
- Campaigns created
- Export metadata

Data is provided as a ZIP file containing JSON files for each data type.

## Account Deletion

### Process
1. User submits deletion request with optional reason
2. Request stored in `delete_requests` table with status tracking
3. Admin reviews and processes request in Admin Console
4. User notified via email when completed

### Status Flow
- `open` → `in_progress` → `completed` / `rejected`

## Configuration

### Organization Details
Edit `config/org.ts` to update:
- Company name and address
- Support email
- GSTIN (if applicable)
- Website URL

### Legal Disclaimers
- Invoices include tax disclaimer
- Donation receipts clarify no goods/services exchanged
- All documents include support contact information

## API Endpoints

### Invoice Generation
- `POST /api/billing/invoice/pdf`
- Requires: `{ paymentId: string }`
- Returns: `{ url: string }` (signed URL)

### Receipt Generation
- `POST /api/donations/receipt/pdf`
- Requires: `{ donationId: string }`
- Returns: `{ url: string }` (signed URL)

### Data Export
- `GET /api/me/export`
- Returns: ZIP file download

### Deletion Request
- `POST /api/me/delete-request`
- Requires: `{ reason?: string }`
- Returns: `{ id: string, status: string }`

## Compliance Notes

⚠️ **Important**: This implementation provides basic compliance features. For production use:

1. **GST Compliance**: Verify GST requirements for your business
2. **Legal Review**: Have legal team review document templates
3. **Data Protection**: Ensure compliance with local data protection laws
4. **Audit Trail**: All document generation is logged for audit purposes
5. **Backup Strategy**: Implement proper backup for private storage buckets

## Webhook Integration

Document generation is automatically triggered via webhooks:
- Invoice PDFs generated on `invoice.paid` events
- Receipt PDFs generated on donation `payment.captured` events
- Generation is non-blocking and fire-and-forget

## Admin Features

Admins can:
- View all deletion requests in Admin Console
- Process deletion requests (approve/reject)
- Access user documents for support purposes
- Monitor document generation metrics

## Future Enhancements

- Automated email delivery of documents
- Bulk document generation
- Custom document templates
- Integration with accounting systems
- Advanced audit reporting
\`\`\`

I've successfully implemented the complete Compliance & Receipts system for Mahakavya! Here's what I've created:

## ✅ **Database & Schema**
- **Delete requests table** with status tracking and user association
- **Document counters** with atomic increment function for sequential numbering
- **Proper RLS policies** for secure document management

## ✅ **PDF Generation System**
- **Professional invoice PDFs** with tax invoice headers and company branding
- **Donation receipt PDFs** with proper disclaimers and campaign details
- **Sequential document numbering** (INV-YYYYMM-0001, RCT-YYYYMM-0001)
- **Embedded fonts** and proper formatting for professional appearance

## ✅ **Private Storage & Security**
- **Private Supabase Storage buckets** for invoices and receipts
- **Signed URLs** with 15-minute expiry for secure access
- **User-scoped file organization** preventing unauthorized access
- **No direct bucket access** - all documents served via API

## ✅ **API Routes** (Node.js runtime)
- **Invoice PDF generation** (`/api/billing/invoice/pdf`) with subscription details
- **Receipt PDF generation** (`/api/donations/receipt/pdf`) with campaign info
- **Data export** (`/api/me/export`) returning comprehensive ZIP archive
- **Delete requests** (`/api/me/delete-request`) with reason tracking

## ✅ **User Interface Integration**
- **Download buttons** in billing interface for invoice PDFs
- **Receipt downloads** in donation lists for captured donations
- **Privacy settings page** with data export and account deletion
- **Loading states** and error handling for all document operations

## ✅ **Key Features**
- **Automatic document generation** via webhook integration
- **Professional PDF formatting** with company branding
- **Comprehensive data export** including all user content
- **Account deletion workflow** with admin review process
- **Audit trail** for all document generation activities

## ✅ **Compliance Features**
- **Tax invoice format** with proper disclaimers
- **Donation receipt format** clarifying no goods/services exchanged
- **Data export** in machine-readable JSON format
- **Account deletion** with trackable request system
- **Privacy controls** with transparent data handling

## ✅ **Mobile-First Design**
- **Responsive download interfaces** that work on all screen sizes
- **Touch-friendly** buttons and controls
- **Glassmorphism styling** consistent with app design
- **Accessible interfaces** with proper ARIA labels

## ✅ **Security & Performance**
- **Private storage** with no public access
- **Short-lived signed URLs** for document access
- **User authorization** checks for all document operations
- **Non-blocking PDF generation** that doesn't impact user experience
- **Error resilience** with proper fallback mechanisms

## 🎯 **Acceptance Criteria Met**
- ✅ Invoices generated for subscription payments with proper formatting and storage
- ✅ Donation receipts generated for captured donations with campaign details
- ✅ Signed URLs expire; direct bucket links never exposed
- ✅ Billing and Campaign UIs show working download buttons
- ✅ Data export returns ZIP of user's core data; delete requests trackable
- ✅ TypeScript strict, ESLint clean with proper test IDs

## 🔧 **Additional Features Implemented**
- **Webhook integration** for automatic document generation
- **Professional branding** with company details and disclaimers
- **Comprehensive documentation** for compliance and operations
- **Admin-ready features** for deletion request processing
- **Future-proof architecture** for additional compliance features

The Compliance & Receipts system is now fully functional with professional document generation, secure storage, comprehensive data export, and complete privacy controls!
