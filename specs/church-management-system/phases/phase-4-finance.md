# Phase 4: Finance (Deferred)

**Status:** Deferred - Awaiting Payment Provider Selection
**Dependencies:** Phase 1 (Foundation)

---

## Overview

Phase 4 adds online donation capabilities, tithe/offering recording, and basic financial reporting. This phase is deferred until payment providers are selected and configured.

**Note:** Database tables for donations are created in earlier migrations as placeholders to allow manual entry of cash/check donations if needed before online payments are implemented.

---

## Functional Requirements (Planned)

### FR12: Donation Recording

**FR12.1: Manual Donation Entry**
- Admin records cash/check donations
- Fields: amount, category, donor, date, payment method, notes
- Link to member or enter guest donor name
- **Success Criteria**: Donation recorded; linked to member

**FR12.2: Donation Categories**
- Categories: tithe, offering, missions, building fund, benevolence, other
- Admin can create custom categories
- **Success Criteria**: Categories manageable; donations categorized

**FR12.3: Donor History**
- View donation history by member
- Total giving by period
- **Success Criteria**: History shows all donations; totals correct

---

### FR13: Online Donations (Future)

**FR13.1: Payment Gateway Integration**
- Stripe and/or PayPal integration
- M-Pesa integration for mobile money
- Secure payment processing
- **Success Criteria**: Payments process successfully; funds received

**FR13.2: Online Giving Page**
- Public donation form
- Select category and amount
- One-time or recurring options
- Guest or member donations
- **Success Criteria**: Form works; payment processes; receipt sent

**FR13.3: Recurring Donations**
- Set up monthly recurring donations
- Manage/cancel recurring donations
- **Success Criteria**: Recurring charges work; cancellation works

**FR13.4: Giving Portal (Member)**
- View personal giving history
- Download tax statements
- Manage payment methods
- **Success Criteria**: History accurate; statements download

---

### FR14: Financial Reports (Future)

**FR14.1: Income Summary**
- Total donations by category
- Monthly/quarterly/annual views
- Charts and visualizations
- **Success Criteria**: Totals accurate; charts display

**FR14.2: Donor Reports**
- Top donors list
- Giving trends by donor
- First-time donors
- **Success Criteria**: Reports accurate; trends visible

**FR14.3: Tax Statements**
- Annual giving statements per donor
- PDF generation
- Bulk email distribution
- **Success Criteria**: Statements accurate; PDF generates; email sends

---

## API Endpoints (Planned)

```
# Donations
GET    /api/v1/donations
POST   /api/v1/donations
GET    /api/v1/donations/{id}
PUT    /api/v1/donations/{id}
DELETE /api/v1/donations/{id}
GET    /api/v1/donations/my-giving
GET    /api/v1/donations/member/{member_id}

# Online Payments (Future)
POST   /api/v1/payments/create-intent
POST   /api/v1/payments/confirm
POST   /api/v1/payments/webhook
GET    /api/v1/payments/methods
POST   /api/v1/payments/recurring
DELETE /api/v1/payments/recurring/{id}

# Categories
GET    /api/v1/donations/categories
POST   /api/v1/donations/categories
PUT    /api/v1/donations/categories/{id}
DELETE /api/v1/donations/categories/{id}

# Reports
GET    /api/v1/donations/reports/summary
GET    /api/v1/donations/reports/by-category
GET    /api/v1/donations/reports/by-donor
GET    /api/v1/donations/reports/statement/{member_id}
```

---

## Database Schema (Placeholder - Created in Phase 1)

```sql
-- Already created in initial migrations
CREATE TABLE donation_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    donor_name VARCHAR(200),
    category_id UUID REFERENCES donation_categories(id),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES',
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(255),
    donation_date DATE NOT NULL,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_id UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- To be added when payment integration is implemented
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,  -- stripe, paypal, mpesa
    provider_method_id VARCHAR(255) NOT NULL,
    method_type VARCHAR(50),  -- card, bank, mpesa
    last_four VARCHAR(4),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recurring_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    payment_method_id UUID REFERENCES payment_methods(id),
    category_id UUID REFERENCES donation_categories(id),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES',
    frequency VARCHAR(20) DEFAULT 'monthly',
    next_charge_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Payment Provider Options

### Option 1: Stripe
- **Pros**: Widely used, excellent documentation, supports recurring
- **Cons**: Higher fees for international transactions
- **Fees**: 2.9% + $0.30 per transaction

### Option 2: PayPal
- **Pros**: Familiar to users, global acceptance
- **Cons**: Higher fees, account holds possible
- **Fees**: 2.9% + $0.30 per transaction

### Option 3: M-Pesa (Kenya)
- **Pros**: Essential for East African market, low fees
- **Cons**: Requires Safaricom business account, Kenya-specific
- **Fees**: ~1% per transaction

### Recommendation
Implement Stripe for card payments (international donors) and M-Pesa for local mobile money payments. PayPal can be added later if needed.

---

## Implementation Considerations

1. **PCI Compliance**: Use Stripe Elements or PayPal SDK to avoid handling card data
2. **Webhooks**: Set up webhook endpoints for payment status updates
3. **Idempotency**: Prevent duplicate charges with idempotency keys
4. **Refunds**: Implement refund functionality for admin
5. **Currency**: Support KES and USD at minimum
6. **Receipts**: Automated email receipts for all donations

---

## Action Items Before Implementation

- [ ] Select payment provider(s)
- [ ] Set up merchant accounts
- [ ] Obtain API credentials
- [ ] Configure webhook URLs
- [ ] Design giving page UI
- [ ] Define reporting requirements
- [ ] Determine tax statement format
