# Invoicing Tab Implementation Guide

## 📌 Overview
Implementation of a comprehensive invoicing system for TME Portal that manages client invoices with unique numbering, approval workflows, payment tracking, and recurring invoice capabilities.

## 🎯 Core Requirements

### Invoice Number Format
- **Structure**: `YYMMXXX-YYYYY-NN PMS`
  - `YY`: Last two digits of year
  - `MM`: Two-digit month
  - `XXX`: 3-digit annual client code (reset yearly)
  - `YYYYY`: 5-digit permanent client code
  - `NN`: Company code (DET=30, FZCO=10, DMCC=00)
  - `PMS`: Fixed suffix for "Professional & Management Consulting Services"

### Client Management
- **Permanent Fields**:
  - 5-digit client code (never changes)
  - Client name
  - Client address
  - Manager name & email
  - VAT number
  - Issuing company (DET/FZCO/DMCC)

- **Annual Fields**:
  - 3-digit code (001-999)
  - Alphabetical assignment
  - Reset every January 1st
  - First-come, first-served for new clients

### Invoice Features
- **VAT**: Fixed 5% rate
- **Currency**: AED only
- **Recurring**: 90% of clients have recurring monthly invoices
- **Approval**: Manager review required before client delivery
- **Payment Tracking**: Record and track partial/full payments

## 📊 Database Design Checklist

### [✓] Core Tables
- [✓] `invoice_clients` - Client master data
- [✓] `invoices` - Invoice headers with approval workflow
- [✓] `invoice_sections` - Group invoice items by category
- [✓] `invoice_items` - Individual line items
- [✓] `invoice_payments` - Payment tracking
- [✓] `invoice_reminders` - Automated reminders
- [✓] `invoice_approvals` - Manager approval queue
- [✓] `service_catalog` - Predefined services
- [✓] `annual_code_sequence` - Annual code tracking

### [✓] Key Fields & Constraints
- [✓] Unique invoice number generation
- [✓] Annual code reset mechanism
- [✓] Payment status auto-calculation
- [✓] VAT auto-calculation (5%)
- [✓] Approval workflow states
- [✓] Audit trail (created_by, updated_at)

## 🎨 UI Components Checklist

### [✓] Main Invoice Tab Structure
- [✓] Tab navigation integration
- [✓] Permission-based access control
- [✓] Responsive layout following TME design system

### [✓] Client Management Section
- [✓] Client list/grid view
- [✓] Add new client form
- [✓] Edit client modal
- [✓] Client search/filter
- [✓] Active/inactive status toggle
- [✓] Annual code display and management

### [✓] Invoice Creation Workflow
- [✓] **Step 1: Client Selection**
  - [✓] Client dropdown/selector
  - [✓] Display client details
  - [ ] Show previous invoices
  
- [✓] **Step 2: Invoice Details**
  - [✓] Auto-generated invoice number
  - [✓] Invoice date picker
  - [✓] Due date calculation
  - [✓] Internal notes field
  
- [✓] **Step 3: Service Items**
  - [✓] Service category sections:
    - [✓] Consulting/PRO/Commercial services
    - [✓] Accounting service
    - [✓] Salary preparation
    - [✓] Others
  - [✓] Service catalog dropdown
  - [✓] Quantity and unit selection
  - [✓] Unit price input
  - [✓] Auto-calculation of totals
  - [✓] Add/remove line items
  
- [Partial] **Step 4: Review & Submit**
  - [ ] Invoice preview
  - [✓] Submit for approval button
  - [✓] Save as draft option

### [✓] Invoice Management Dashboard
- [✓] **List View Features**:
  - [✓] Month/year filter
  - [✓] Status filter (draft, pending, sent, paid)
  - [✓] Client filter
  - [✓] Search functionality
  - [✓] Pagination
  
- [ ] **Quick Actions**:
  - [ ] View/Edit invoice
  - [ ] Generate PDF
  - [ ] Send to client
  - [ ] Record payment
  - [ ] Clone for recurring

### [ ] Approval Workflow UI
- [ ] **For Submitters**:
  - [ ] Submit for approval button
  - [ ] View approval status
  - [ ] See manager comments
  
- [ ] **For Managers**:
  - [ ] Approval queue dashboard
  - [ ] Invoice preview in approval modal
  - [ ] Approve/Reject/Request revision buttons
  - [ ] Comments field

### [ ] Payment Tracking Interface
- [ ] Record payment modal
- [ ] Payment history view
- [ ] Outstanding balance display
- [ ] Payment method selection
- [ ] Reference number field

### [ ] Email Integration
- [ ] Use existing EmailPreviewModal
- [ ] Pre-populated email templates
- [ ] PDF attachment
- [ ] Multiple recipient support
- [ ] Send to manager for approval
- [ ] Send to client after approval

## 🔧 Service Catalog Structure

### Predefined Services
1. **Consulting/PRO/Commercial Services**
   - PRO/Commercial services (monthly)
   - Company setup/restructuring
   - Bank periodic review service
   - VAT consulting (hourly)
   - FTA portal updates
   - Compliance consulting (hourly)
   - IT AMC service (monthly)
   - IT consulting (hourly)

2. **Accounting Service**
   - Monthly accounting service
   - VAT booking fee (percentage)
   - VAT return filing (quarterly)
   - VAT figures for tax group (quarterly)
   - Cost center booking (monthly)

3. **Salary Preparation**
   - Salary processing (per salary count)

4. **Others**
   - Email correspondence (hourly)
   - Admin fee (percentage)

## 🔄 Workflows & Business Logic

### [✓] Invoice Creation Flow
1. [✓] Select/create client
2. [✓] Auto-generate invoice number
3. [ ] Load previous invoice if recurring
4. [✓] Add/modify service items
5. [✓] Calculate totals with VAT
6. [✓] Save as draft
7. [✓] Submit for approval

### [ ] Approval Flow
1. [ ] User submits invoice for approval
2. [ ] System notifies assigned manager
3. [ ] Manager reviews in approval queue
4. [ ] Manager approves/rejects/requests revision
5. [ ] System updates invoice status
6. [ ] Notifies submitter of decision

### [ ] Sending Flow
1. [ ] Ensure invoice is approved
2. [ ] Generate PDF
3. [ ] Open email preview modal
4. [ ] Customize email if needed
5. [ ] Send to client
6. [ ] Update invoice status to "sent"
7. [ ] Set automatic reminders

### [ ] Payment Recording Flow
1. [ ] Select invoice
2. [ ] Enter payment details
3. [ ] System updates paid amount
4. [ ] Auto-update status (partially_paid/paid)
5. [ ] Log payment in history

### [ ] Recurring Invoice Flow
1. [ ] Identify recurring clients
2. [ ] Clone previous month's invoice
3. [ ] Auto-populate with same items
4. [ ] Allow modifications
5. [ ] Follow normal approval flow

## 🔌 Integration Points

### [Partial] Existing Systems Integration
- [✓] Authentication system (user roles/permissions)
- [✓] Audit logging system
- [ ] Email system (EmailPreviewModal)
- [ ] PDF generator
- [ ] Notification system
- [✓] Session management

### [ ] New Permissions Required
- [ ] `invoice_read` - View invoices
- [ ] `invoice_write` - Create/edit invoices
- [ ] `invoice_approve` - Approve invoices
- [ ] `invoice_send` - Send invoices to clients
- [ ] `payment_record` - Record payments
- [ ] `client_manage` - Manage client data

## 📋 Implementation Phases

### Phase 1: Foundation (Week 1) ✅ COMPLETED
- [✓] Database schema creation
- [✓] Migration scripts
- [✓] Basic CRUD APIs for clients
- [✓] Annual code management logic
- [✓] Invoice number generator

### Phase 2: Core UI (Week 2) ✅ COMPLETED
- [✓] Invoice tab layout
- [✓] Client management interface
- [✓] Invoice creation form
- [✓] Service catalog integration
- [✓] Basic invoice list view

### Phase 3: Workflows (Week 3)
- [ ] Approval workflow implementation
- [ ] Manager dashboard
- [ ] Email integration
- [ ] PDF generation for invoices
- [ ] Payment recording interface

### Phase 4: Advanced Features (Week 4)
- [ ] Recurring invoice automation
- [ ] Reminder system
- [ ] Bulk operations
- [ ] Search and filters
- [ ] Export capabilities

### Phase 5: Testing & Refinement
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] User acceptance testing
- [ ] Bug fixes and improvements

## 🎯 Success Criteria

### Functional Requirements
- [ ] Unique invoice numbering works correctly
- [ ] Annual codes reset on January 1st
- [ ] Approval workflow enforced
- [ ] Payment tracking accurate
- [ ] Recurring invoices auto-populate
- [ ] Email sending with PDF attachment
- [ ] All service categories available

### Non-Functional Requirements
- [ ] Page load < 2 seconds
- [ ] Support 100+ concurrent users
- [ ] Mobile responsive design
- [ ] Follows TME design system
- [ ] Audit trail for all actions
- [ ] Data validation enforced

## 🚨 Risk Mitigation

### Technical Risks
- **Annual Code Reset**: Implement scheduled job with fallback manual trigger
- **Invoice Number Conflicts**: Database constraints + application-level validation
- **PDF Generation Performance**: Implement queuing for bulk operations
- **Email Delivery**: Add retry mechanism and delivery status tracking

### Business Risks
- **Data Migration**: Plan for importing existing client data
- **User Training**: Create user guide and training materials
- **Approval Delays**: Implement escalation and reminder system
- **Payment Reconciliation**: Regular audit reports

## 📝 Testing Checklist

### [ ] Unit Tests
- [ ] Invoice number generation
- [ ] Annual code assignment
- [ ] VAT calculations
- [ ] Payment status updates

### [ ] Integration Tests
- [ ] Client CRUD operations
- [ ] Invoice workflow end-to-end
- [ ] Email sending
- [ ] PDF generation

### [ ] User Acceptance Tests
- [ ] Create client and invoice
- [ ] Approval workflow
- [ ] Payment recording
- [ ] Recurring invoice creation
- [ ] Monthly invoice management

## 📚 Documentation Needs

- [ ] API documentation
- [ ] User guide for accounting team
- [ ] Manager approval guide
- [ ] System administration guide
- [ ] Troubleshooting guide

## 🔐 Security Considerations

- [ ] Role-based access control
- [ ] Audit logging for all changes
- [ ] Secure PDF storage
- [ ] Email delivery tracking
- [ ] Data validation and sanitization
- [ ] SQL injection prevention
- [ ] XSS protection

## 📊 Monitoring & Maintenance

- [ ] Invoice generation metrics
- [ ] Approval turnaround time
- [ ] Payment collection rate
- [ ] System performance metrics
- [ ] Error tracking and alerting
- [ ] Regular backups
- [ ] Annual code reset automation

---

## Next Steps

1. **Review and approve** this implementation guide
2. **Prioritize** features if needed
3. **Assign** development resources
4. **Set up** development environment
5. **Begin** Phase 1 implementation

## Questions to Resolve

1. **Backup approver**: Who approves if primary manager is unavailable?
2. **Invoice amendments**: Process for modifying sent invoices?
3. **Credit notes**: Need for credit note functionality?
4. **Multi-language**: Support for Arabic invoices?
5. **Signature**: Digital signature requirements?
6. **Archive**: Long-term storage and retrieval policy?