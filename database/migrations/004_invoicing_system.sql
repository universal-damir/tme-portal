-- Invoicing System Database Schema
-- Phase 1: Foundation Tables
-- ===================================

-- 1. Clients table for invoice management
CREATE TABLE IF NOT EXISTS invoice_clients (
    id SERIAL PRIMARY KEY,
    client_code VARCHAR(5) UNIQUE NOT NULL,  -- 5-digit permanent code
    client_name VARCHAR(255) NOT NULL,
    client_address TEXT NOT NULL,
    manager_name VARCHAR(255) NOT NULL,
    manager_email VARCHAR(255),  -- For approval notifications
    vat_number VARCHAR(50),
    annual_code VARCHAR(3),  -- 3-digit code reset annually
    annual_code_year INTEGER NOT NULL,  -- Year for the annual code
    issuing_company VARCHAR(10) CHECK (issuing_company IN ('DET', 'FZCO', 'DMCC')) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_recurring BOOLEAN DEFAULT false,  -- Flag for recurring clients
    default_services JSONB,  -- Store default services for recurring invoices
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- 2. Service catalog for standardized invoice items
CREATE TABLE IF NOT EXISTS service_catalog (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,  -- 'Consulting', 'Accounting', 'Salary', 'Others'
    service_name TEXT NOT NULL,
    description TEXT,
    default_unit VARCHAR(50),  -- 'month', 'hours', 'quarter', 'salaries', '%'
    default_unit_price DECIMAL(15,2),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Invoices table with approval workflow
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,  -- YYMMXXX-YYYYY-NN PMS format
    client_id INTEGER REFERENCES invoice_clients(id),
    invoice_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
        'draft', 
        'pending_approval', 
        'approved', 
        'sent', 
        'partially_paid',
        'paid', 
        'overdue', 
        'cancelled'
    )),
    
    -- Payment tracking fields
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance_due DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    
    -- VAT fields (always 5%)
    subtotal DECIMAL(15,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 5.00,
    vat_amount DECIMAL(15,2) NOT NULL,
    
    -- Approval workflow
    submitted_for_approval_at TIMESTAMP,
    submitted_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    approval_notes TEXT,
    
    -- Recurring invoice fields
    is_recurring BOOLEAN DEFAULT false,
    template_id INTEGER REFERENCES invoices(id),  -- Reference to previous invoice
    
    notes TEXT,
    internal_notes TEXT,  -- Notes not shown to client
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    sent_at TIMESTAMP,
    sent_to_emails TEXT[]  -- Array of email addresses
);

-- 4. Invoice sections for grouping items
CREATE TABLE IF NOT EXISTS invoice_sections (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    section_name VARCHAR(100) NOT NULL,  -- 'Consulting/PRO/Commercial services', 'Accounting service', etc.
    sort_order INTEGER DEFAULT 0,
    subtotal DECIMAL(15,2) DEFAULT 0
);

-- 5. Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    section_id INTEGER REFERENCES invoice_sections(id) ON DELETE CASCADE,
    service_catalog_id INTEGER REFERENCES service_catalog(id),
    
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit VARCHAR(50),  -- 'month', 'hours', 'quarter', 'salaries', '%'
    unit_price DECIMAL(15,2) NOT NULL,
    
    -- Calculated fields
    net_amount DECIMAL(15,2) NOT NULL,
    vat_amount DECIMAL(15,2) GENERATED ALWAYS AS (net_amount * 0.05) STORED,
    gross_amount DECIMAL(15,2) GENERATED ALWAYS AS (net_amount * 1.05) STORED,
    
    sort_order INTEGER DEFAULT 0
);

-- 6. Payment tracking table
CREATE TABLE IF NOT EXISTS invoice_payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),  -- 'bank_transfer', 'cash', 'cheque', etc.
    reference_number VARCHAR(100),
    notes TEXT,
    recorded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Invoice reminders table
CREATE TABLE IF NOT EXISTS invoice_reminders (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    reminder_type VARCHAR(20) CHECK (reminder_type IN ('due_soon', 'overdue', 'follow_up', 'custom')),
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    sent_to_emails TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Annual code tracking table
CREATE TABLE IF NOT EXISTS annual_code_sequence (
    year INTEGER PRIMARY KEY,
    last_code INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Approval queue for manager review
CREATE TABLE IF NOT EXISTS invoice_approvals (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    requested_by INTEGER REFERENCES users(id),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to INTEGER REFERENCES users(id),  -- Manager who needs to approve
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_required')),
    reviewed_at TIMESTAMP,
    comments TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_client_code ON invoice_clients(client_code);
CREATE INDEX IF NOT EXISTS idx_clients_annual_code ON invoice_clients(annual_code, annual_code_year);
CREATE INDEX IF NOT EXISTS idx_clients_issuing_company ON invoice_clients(issuing_company);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_client_date ON invoices(client_id, invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_item_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_item_section_id ON invoice_items(section_id);
CREATE INDEX IF NOT EXISTS idx_payment_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_date ON invoice_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_approval_invoice_id ON invoice_approvals(invoice_id);
CREATE INDEX IF NOT EXISTS idx_approval_assigned_to ON invoice_approvals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_approval_status ON invoice_approvals(status);

-- Insert default service catalog
INSERT INTO service_catalog (category, service_name, default_unit, sort_order) VALUES
-- Consulting/PRO/Commercial services
('Consulting/PRO/Commercial services', 'PRO/Commercial services', 'month', 1),
('Consulting/PRO/Commercial services', 'Company setup / restructuring service', NULL, 2),
('Consulting/PRO/Commercial services', 'Bank periodic review service', NULL, 3),
('Consulting/PRO/Commercial services', 'VAT consulting / reg / exception / dereg', 'hours', 4),
('Consulting/PRO/Commercial services', 'FTA portal update', NULL, 5),
('Consulting/PRO/Commercial services', 'Compliance consulting (ESR / UBO)', 'hours', 6),
('Consulting/PRO/Commercial services', 'IT AMC service fee', 'month', 7),
('Consulting/PRO/Commercial services', 'IT consulting', 'hours', 8),

-- Accounting service
('Accounting service', 'Accounting service', 'month', 10),
('Accounting service', 'VAT booking fee', '%', 11),
('Accounting service', 'VAT return filing', 'quarter', 12),
('Accounting service', 'VAT figures for tax group return filing', 'quarter', 13),
('Accounting service', 'Cost center booking', 'month', 14),

-- Salary preparation
('Salary preparation', 'Salary preparation', 'salaries', 20),

-- Others
('Others', 'Writing and receiving of emails', 'hours', 30),
('Others', 'Admin fee', '%', 31)
ON CONFLICT DO NOTHING;

-- Add invoice permissions to the permissions table
INSERT INTO permissions (name, description, resource, action) VALUES
('invoice_read', 'View invoices', 'invoicing', 'read'),
('invoice_write', 'Create and edit invoices', 'invoicing', 'write'),
('invoice_approve', 'Approve invoices', 'invoicing', 'approve'),
('invoice_send', 'Send invoices to clients', 'invoicing', 'send'),
('payment_record', 'Record invoice payments', 'invoicing', 'payment'),
('client_manage', 'Manage invoice clients', 'invoicing', 'client_manage')
ON CONFLICT DO NOTHING;

-- Triggers for updated_at timestamps
CREATE TRIGGER update_invoice_clients_updated_at 
    BEFORE UPDATE ON invoice_clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-update invoice status based on payments
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoices 
    SET status = CASE 
        WHEN (SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = NEW.invoice_id) >= total_amount THEN 'paid'
        WHEN (SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = NEW.invoice_id) > 0 THEN 'partially_paid'
        ELSE status
    END,
    paid_amount = COALESCE((SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = NEW.invoice_id), 0)
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_payment_status
    AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
    FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();

-- Function to reset annual codes on January 1st
CREATE OR REPLACE FUNCTION reset_annual_codes()
RETURNS void AS $$
DECLARE
    current_year INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Reset all annual codes for the new year
    UPDATE invoice_clients 
    SET annual_code = NULL, 
        annual_code_year = current_year
    WHERE annual_code_year < current_year;
    
    -- Reset the sequence counter
    INSERT INTO annual_code_sequence (year, last_code) 
    VALUES (current_year, 0)
    ON CONFLICT (year) DO UPDATE SET last_code = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to assign next annual code
CREATE OR REPLACE FUNCTION assign_annual_code(client_id INTEGER)
RETURNS VARCHAR AS $$
DECLARE
    current_year INTEGER;
    next_code INTEGER;
    code_str VARCHAR(3);
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Get next available code
    SELECT last_code + 1 INTO next_code
    FROM annual_code_sequence
    WHERE year = current_year;
    
    -- If no record exists for this year, create it
    IF next_code IS NULL THEN
        INSERT INTO annual_code_sequence (year, last_code)
        VALUES (current_year, 1);
        next_code := 1;
    ELSE
        -- Update the sequence
        UPDATE annual_code_sequence
        SET last_code = next_code
        WHERE year = current_year;
    END IF;
    
    -- Format as 3-digit string
    code_str := LPAD(next_code::text, 3, '0');
    
    -- Update the client
    UPDATE invoice_clients
    SET annual_code = code_str,
        annual_code_year = current_year
    WHERE id = client_id;
    
    RETURN code_str;
END;
$$ LANGUAGE plpgsql;