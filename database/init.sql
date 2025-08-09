-- TME Portal Database Schema
-- User Account Management System

-- Users table - Core employee accounts
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(10) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee', 'staff')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    must_change_password BOOLEAN DEFAULT true,
    last_password_change TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Sessions table - User session management
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table - System permissions
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100), -- 'cost_overview', 'company_services', 'golden_visa', etc.
    action VARCHAR(50), -- 'read', 'write', 'delete', 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User permissions - Many-to-many relationship
CREATE TABLE user_permissions (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by INTEGER REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, permission_id)
);

-- Audit logs - Track all user activities
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System configuration - Store system settings
CREATE TABLE system_config (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB,
    description TEXT,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
-- Cost Overview permissions
('cost_overview_read', 'View cost overview calculations', 'cost_overview', 'read'),
('cost_overview_write', 'Create and edit cost overviews', 'cost_overview', 'write'),
('cost_overview_export', 'Export cost overview PDFs', 'cost_overview', 'export'),

-- Company Services permissions  
('company_services_read', 'View company services', 'company_services', 'read'),
('company_services_write', 'Create and edit company services', 'company_services', 'write'),
('company_services_export', 'Export company services PDFs', 'company_services', 'export'),

-- Golden Visa permissions
('golden_visa_read', 'View golden visa applications', 'golden_visa', 'read'),
('golden_visa_write', 'Create and edit golden visa applications', 'golden_visa', 'write'),
('golden_visa_export', 'Export golden visa PDFs', 'golden_visa', 'export'),

-- Taxation permissions
('taxation_read', 'View taxation documents', 'taxation', 'read'),
('taxation_write', 'Create and edit taxation documents', 'taxation', 'write'),
('taxation_export', 'Export taxation PDFs', 'taxation', 'export'),

-- Admin permissions
('user_management', 'Manage user accounts', 'users', 'admin'),
('system_admin', 'System administration access', 'system', 'admin'),
('audit_logs', 'View audit logs', 'audit', 'read');

-- Insert default system configuration
INSERT INTO system_config (key, value, description) VALUES
('password_policy', '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_symbols": true}', 'Password complexity requirements'),
('session_timeout', '28800', 'Session timeout in seconds (8 hours)'),
('company_name', '"TME Services"', 'Company name for branding'),
('admin_email', '"uwe@TME-Services.com"', 'System administrator email');

-- Create indexes for better performance
CREATE INDEX idx_users_employee_code ON users(employee_code);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger to clean sessions on insert (runs cleanup periodically)
CREATE TRIGGER clean_sessions_trigger
    AFTER INSERT ON sessions
    EXECUTE FUNCTION clean_expired_sessions();