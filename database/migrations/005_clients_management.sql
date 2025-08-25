-- TME Portal - Client Management System
-- Migration: 005_clients_management.sql

-- Clients table - Core client database
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    company_code VARCHAR(10) UNIQUE NOT NULL,
    company_name VARCHAR(500) NOT NULL,
    company_name_short VARCHAR(200) NOT NULL,
    registered_authority VARCHAR(100) NOT NULL CHECK (registered_authority IN (
        'AJM Ajman FZ',
        'AUH DED',
        'AUH Masdar FZ',
        'DXB DACC',
        'DXB DAC',
        'DXB DAFZ FZ',
        'DXB DDA FZ',
        'DXB DET',
        'DXB DHCC FZ',
        'DXB DIFC FZ',
        'DXB DMCC FZ',
        'DXB DSO FZ',
        'DXB DWC FZ',
        'DXB DWTC FZ',
        'DXB ECDA FZ',
        'DXB IFZA FZ',
        'DXB JAFZA FZ',
        'DXB JAFZA Offshore',
        'DXB Meydan FZ',
        'FUJ FM FZ',
        'FUJ Fujairah FZ',
        'RAK RAKEZ FZ',
        'RAK RAKICC Offshore',
        'RAK RAKMC FZ',
        'SHJ Hamriyah FZ',
        'SHJ SAIF FZ',
        'SHJ Shams FZ',
        'SHJ SPC FZ',
        'UMM Umm Al Quwain FZ',
        'X Not registered',
        'X Outside UAE'
    )),
    management_name VARCHAR(300) NOT NULL,
    management_email VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    po_box VARCHAR(50),
    vat_trn VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_clients_company_code ON clients(company_code);
CREATE INDEX idx_clients_registered_authority ON clients(registered_authority);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_created_at ON clients(created_at);
CREATE INDEX idx_clients_company_name ON clients USING gin(to_tsvector('english', company_name));

-- Trigger to automatically update updated_at
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add audit logging for client operations
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id);

-- Insert client management permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('client_management_read', 'View client database', 'clients', 'read'),
('client_management_write', 'Create and edit clients', 'clients', 'write'),
('client_management_delete', 'Delete clients', 'clients', 'delete'),
('client_management_export', 'Export client data', 'clients', 'export');

-- Grant permissions to admin role users automatically
DO $$
DECLARE
    admin_user RECORD;
    perm_id INTEGER;
BEGIN
    -- Get all client management permission IDs
    FOR perm_id IN 
        SELECT id FROM permissions WHERE resource = 'clients'
    LOOP
        -- Grant to all admin users
        FOR admin_user IN 
            SELECT id FROM users WHERE role = 'admin'
        LOOP
            INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_at)
            VALUES (admin_user.id, perm_id, admin_user.id, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, permission_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;