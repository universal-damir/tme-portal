-- TME Portal Database Seeding Script
-- This script populates the database with employee data from employee_details.json

-- First, let's create a function to generate default passwords
CREATE OR REPLACE FUNCTION generate_employee_password(emp_code TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Generate password like "TME2024_XX" where XX is employee code
    RETURN 'TME2024_' || UPPER(emp_code);
END;
$$ LANGUAGE plpgsql;

-- Insert employees from employee_details.json
-- Note: Passwords will be hashed by the application, these are temporary defaults

INSERT INTO users (
    employee_code, 
    email, 
    full_name, 
    department, 
    designation, 
    hashed_password,
    role,
    status,
    must_change_password
) VALUES
-- CEO and Management
('00 UH', 'uwe@TME-Services.com', 'Uwe Hohmann', 'CEO', 'Managing Director', '$2b$10$placeholder_hash_will_be_replaced', 'admin', 'active', true),
('13 DH', 'dijendra@TME-Services.com', 'Dijendra Keshava Hegde', 'Accounting', 'Chief Financial Officer (CFO)', '$2b$10$placeholder_hash_will_be_replaced', 'manager', 'active', true),
('33 MK', 'malavika@TME-Services.com', 'Malavika Nanjappa Kolera', 'Tax & Compliance', 'Director - Tax & Compliance', '$2b$10$placeholder_hash_will_be_replaced', 'manager', 'active', true),

-- IT Department
('14 HH', 'hafees@TME-Services.com', 'Hafees - Shahul Hameed', 'IT', 'Manager - IT Consulting', '$2b$10$placeholder_hash_will_be_replaced', 'manager', 'active', true),
('50 PA', 'praveen@TME-Services.com', 'Praveen Anton Pereira', 'IT', 'System Administrator', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('103 BD', 'brayan@TME-Services.com', 'Brayan Dsouza', 'IT', 'Information Technology Consultant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),

-- Accounting Department
('19 DS', 'dakshath@TME-Services.com', 'Dakshath Shetty Sridhara', 'Accounting', 'Accounting Manager', '$2b$10$placeholder_hash_will_be_replaced', 'manager', 'active', true),
('38 TZ', 'tariq@TME-Services.com', 'Tariq Zarif Khan Malik', 'Accounting', 'Accounting Manager', '$2b$10$placeholder_hash_will_be_replaced', 'manager', 'active', true),
('23 TA', 'tabassum@TME-Services.com', 'Tabassum Begum Syed Arif Ahmed', 'Accounting', 'Client Support Coordinator', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('40 AS', 'akash@TME-Services.com', 'Akash Nagesh Shetty', 'Accounting', 'Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('48 AB', 'ashly@TME-Services.com', 'Ashly Biju', 'Accounting', 'Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('83 TM', 'tanya@TME-Services.com', 'Tanya Maria Miranda', 'Accounting', 'Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('90 MD', 'alicia@TME-Services.com', 'Alicia Myles Elamparo Dela Cruz', 'Accounting', 'Assistant Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('95 Sis', 'saquib@TME-Services.com', 'Saquib Siraj', 'Accounting', 'Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('98 NP', 'nidhi@TME-Services.com', 'Nidhi Pandey', 'Accounting', 'Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('99 AtS', 'atheesha@TME-Services.com', 'Atheesha Shetty', 'Accounting', 'Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('100 MB', 'mehran@TME-Services.com', 'Mehran Masood Barde', 'Accounting', 'Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('106 CV', 'charltzon@TME-Services.com', 'Charltzon Varghese', 'Accounting', 'Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('108 MR', 'mohamed@TME-Services.com', 'Mohamed Rashid Basheer', 'Accounting', 'Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('110 CD', 'carol@TME-Services.com', 'Carol Jenifa Dalmeida', 'Accounting', 'Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),

-- Tax & Compliance Department
('42 RJ', 'reshma@TME-Services.com', 'Reshma Joseph', 'Tax & Compliance', 'Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('58 YF', 'yashika@TME-Services.com', 'Yashika Fernandes', 'Tax & Compliance', 'Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('80 RoJ', 'roja@TME-Services.com', 'Roja James', 'Tax & Compliance', 'Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('86 MA', 'muhammed@TME-Services.com', 'Muhammed Anshad Chandveettil', 'Tax & Compliance', 'Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('92 CM', 'chirath@TME-Services.com', 'Chirath Deshitha Mayakaduwa', 'Tax & Compliance', 'Accountant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),

-- Client Support Department
('22 NF', 'natali@TME-Services.com', 'Natali Bernadette Fernando Wood', 'Client Support', 'Manager - Client Support', '$2b$10$placeholder_hash_will_be_replaced', 'manager', 'active', true),
('25 KM', 'pro@TME-Services.com', 'Mukesh Kumar Beera', 'Client Support', 'Public Relation Officer (PRO)', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('53 JT', 'jovel@TME-Services.com', 'Jovel Monton Tiro', 'Client Support', 'Administrative Supervisor', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('65 WM', 'wilma@TME-Services.com', 'Wilma Menezes', 'Client Support', 'Client Support Coordinator', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('75 WS', 'wafa@TME-Services.com', 'Wafa Sulthana Masood', 'Client Support', 'Client Support Coordinator', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('76 RA', 'rowelyn@TME-Services.com', 'Rowelyn Allibang Jocson', 'Client Support', 'Marketing Specialist', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('79 ST', 'surya@TME-Services.com', 'Surya Padmakumari Thulaseedharan', 'Client Support', 'Client Support Coordinator', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('82 AC', 'alyssa@TME-Services.com', 'Alyssa Marie Jimenez Castillo', 'Client Support', 'Client Support Coordinator', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('87 VR', 'via@TME-Services.com', 'Via Andrea Rosales', 'Client Support', 'Receptionist', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('88 AjA', 'aiswarya@TME-Services.com', 'Aiswarya Ajaykumar', 'Client Support', 'Client Support Coordinator', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('89 RR', 'renji@TME-Services.com', 'Renji Reghunadh', 'Client Support', 'Administration Manager', '$2b$10$placeholder_hash_will_be_replaced', 'manager', 'active', true),
('91 PG', 'priya@TME-Services.com', 'Priya Ganapathy Kariappa', 'Client Support', 'Client Support Coordinator', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('105 MM', 'milani@TME-Services.com', 'Milani Listin Morris', 'Client Support', 'Front Desk Support', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),
('109 PS', 'princyss@TME-Services.com', 'Princyss Sampaga', 'Client Support', 'Administration Officer', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true),

-- Marketing Department
('70 DN', 'damir@TME-Services.com', 'Damir Novalic', 'Marketing', 'Manager - Digital Marketing', '$2b$10$placeholder_hash_will_be_replaced', 'manager', 'active', true),

-- Company Setup Department
('96 TR', 'tina@TME-Services.com', 'Tina Reimann', 'Company Setup', 'Service Station Manager', '$2b$10$placeholder_hash_will_be_replaced', 'manager', 'active', true),
('102 OO', 'onur@TME-Services.com', 'Onur Ozturk', 'Company Setup', 'Business Development Assistant', '$2b$10$placeholder_hash_will_be_replaced', 'employee', 'active', true);

-- Assign default permissions based on roles
-- Admin permissions (for CEOs and system admins)
INSERT INTO user_permissions (user_id, permission_id, granted_by)
SELECT u.id, p.id, 1 
FROM users u, permissions p 
WHERE u.role = 'admin';

-- Manager permissions (department heads and managers)
INSERT INTO user_permissions (user_id, permission_id, granted_by)
SELECT u.id, p.id, 1 
FROM users u, permissions p 
WHERE u.role = 'manager' 
AND p.name IN (
    'cost_overview_read', 'cost_overview_write', 'cost_overview_export',
    'company_services_read', 'company_services_write', 'company_services_export',
    'golden_visa_read', 'golden_visa_write', 'golden_visa_export',
    'taxation_read', 'taxation_write', 'taxation_export'
);

-- Employee permissions (basic access)
INSERT INTO user_permissions (user_id, permission_id, granted_by)
SELECT u.id, p.id, 1 
FROM users u, permissions p 
WHERE u.role = 'employee' 
AND p.name IN (
    'cost_overview_read', 'company_services_read', 'golden_visa_read', 'taxation_read'
)
AND (
    -- IT department gets write access
    (u.department = 'IT' AND p.name LIKE '%_write') OR 
    -- Accounting gets full access to cost_overview and company_services
    (u.department = 'Accounting' AND p.name IN ('cost_overview_write', 'cost_overview_export', 'company_services_write', 'company_services_export')) OR
    -- Tax & Compliance gets full access to taxation and golden_visa
    (u.department = 'Tax & Compliance' AND p.name IN ('taxation_write', 'taxation_export', 'golden_visa_write', 'golden_visa_export')) OR
    -- Company Setup gets access to company services
    (u.department = 'Company Setup' AND p.name IN ('company_services_write', 'company_services_export')) OR
    -- Everyone gets read access
    p.name LIKE '%_read'
);

-- Clean up function
DROP FUNCTION IF EXISTS generate_employee_password(TEXT);

-- Insert some initial audit log entries
INSERT INTO audit_logs (user_id, action, resource, details) VALUES
(1, 'SYSTEM_SETUP', 'database', '{"action": "initial_database_setup", "employees_created": 37}');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database seeded successfully with % employees', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Default admin user: uwe@TME-Services.com (Employee Code: 00 UH)';
    RAISE NOTICE 'All users have default password: TME2024_[EMPLOYEE_CODE]';
    RAISE NOTICE 'All users must change password on first login';
END $$;