
-- Default Password Reference:
-- ============================
-- 00 UH    | uwe@TME-Services.com                | TME2024_00_UH
-- 13 DH    | dijendra@TME-Services.com           | TME2024_13_DH
-- 14 HH    | hafees@TME-Services.com             | TME2024_14_HH
-- 19 DS    | dakshath@TME-Services.com           | TME2024_19_DS
-- 22 NF    | natali@TME-Services.com             | TME2024_22_NF
-- 23 TA    | tabassum@TME-Services.com           | TME2024_23_TA
-- 25 KM    | pro@TME-Services.com                | TME2024_25_KM
-- 33 MK    | malavika@TME-Services.com           | TME2024_33_MK
-- 38 TZ    | tariq@TME-Services.com              | TME2024_38_TZ
-- 40 AS    | akash@TME-Services.com              | TME2024_40_AS
-- 42 RJ    | reshma@TME-Services.com             | TME2024_42_RJ
-- 48 AB    | ashly@TME-Services.com              | TME2024_48_AB
-- 50 PA    | praveen@TME-Services.com            | TME2024_50_PA
-- 53 JT    | jovel@TME-Services.com              | TME2024_53_JT
-- 58 YF    | yashika@TME-Services.com            | TME2024_58_YF
-- 65 WM    | wilma@TME-Services.com              | TME2024_65_WM
-- 70 DN    | damir@TME-Services.com              | TME2024_70_DN
-- 75 WS    | wafa@TME-Services.com               | TME2024_75_WS
-- 76 RA    | rowelyn@TME-Services.com            | TME2024_76_RA
-- 79 ST    | surya@TME-Services.com              | TME2024_79_ST
-- 80 RoJ   | roja@TME-Services.com               | TME2024_80_ROJ
-- 82 AC    | alyssa@TME-Services.com             | TME2024_82_AC
-- 83 TM    | tanya@TME-Services.com              | TME2024_83_TM
-- 86 MA    | muhammed@TME-Services.com           | TME2024_86_MA
-- 87 VR    | via@TME-Services.com                | TME2024_87_VR
-- 88 AjA   | aiswarya@TME-Services.com           | TME2024_88_AJA
-- 89 RR    | renji@TME-Services.com              | TME2024_89_RR
-- 90 MD    | alicia@TME-Services.com             | TME2024_90_MD
-- 91 PG    | priya@TME-Services.com              | TME2024_91_PG
-- 92 CM    | chirath@TME-Services.com            | TME2024_92_CM
-- 95 Sis   | saquib@TME-Services.com             | TME2024_95_SIS
-- 96 TR    | tina@TME-Services.com               | TME2024_96_TR
-- 98 NP    | nidhi@TME-Services.com              | TME2024_98_NP
-- 99 AtS   | atheesha@TME-Services.com           | TME2024_99_ATS
-- 100 MB   | mehran@TME-Services.com             | TME2024_100_MB
-- 102 OO   | onur@TME-Services.com               | TME2024_102_OO
-- 103 BD   | brayan@TME-Services.com             | TME2024_103_BD
-- 105 MM   | milani@TME-Services.com             | TME2024_105_MM
-- 106 CV   | charltzon@TME-Services.com          | TME2024_106_CV
-- 108 MR   | mohamed@TME-Services.com            | TME2024_108_MR
-- 109 PS   | princyss@TME-Services.com           | TME2024_109_PS
-- 110 CD   | carol@TME-Services.com              | TME2024_110_CD
-- ============================
-- All users must change their password on first login

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
('00 UH', 'uwe@TME-Services.com', 'Uwe Hohmann', 'Management', 'Managing Director', '$2b$12$1oPXh.M5KYlGs5wWiqN2a.mhKmsBSE0cIBv6nT5q3HZHXY8EgiGSi', 'admin', 'active', true),
('13 DH', 'dijendra@TME-Services.com', 'Dijendra Keshava Hegde', 'Accounting', 'Chief Financial Officer (CFO)', '$2b$12$JQydMDV6ibtE5AKPRYJgzua4hp5g25Nv2hUx49b.k0yFfcYpELtrG', 'manager', 'active', true),
('14 HH', 'hafees@TME-Services.com', 'Hafees - Shahul Hameed', 'IT', 'Manager - IT Consulting', '$2b$12$.jmJxIuRfIMkop8O3XU5oOBdA//P0EXKxlltvWNCpi66SKa5Y2fde', 'manager', 'active', true),
('19 DS', 'dakshath@TME-Services.com', 'Dakshath Shetty Sridhara', 'Accounting', 'Accounting Manager', '$2b$12$1N7Gsp0Hjp17O7jTmeSXUu3KWbBKcNMs8oxkqvWOAKGB0jH2eye3q', 'manager', 'active', true),
('22 NF', 'natali@TME-Services.com', 'Natali Bernadette Fernando Wood', 'Client Support', 'Manager - Client Support ', '$2b$12$I17vhtdIyqDTbHfVtCDRaezcycYY2gtzqL0tj0gVmiKotYmKT2jK2', 'manager', 'active', true),
('23 TA', 'tabassum@TME-Services.com', 'Tabassum Begum Syed Arif Ahmed', 'Accounting', 'Client Support Coordinator', '$2b$12$OnHAmXzi3A2v8vyQk7oShu3FhHWZtAIcCSt2V7dXpQ7DqSVdjpLqa', 'employee', 'active', true),
('25 KM', 'pro@TME-Services.com', 'Mukesh Kumar Beera', 'Client Support', 'Public Relation Officer (PRO)', '$2b$12$qX9HtLpPC7kU6f4stkygUeKIjXvqpF0Fh..x94AaUz4nTKUIB2YqK', 'employee', 'active', true),
('33 MK', 'malavika@TME-Services.com', 'Malavika Nanjappa Kolera', 'Tax & Compliance', 'Director - Tax & Compliance', '$2b$12$AHoq8AOHDgHpcBPABL638.gPD0JCRDABhhZwYRcFdx/Wcb65DD.Y.', 'manager', 'active', true),
('38 TZ', 'tariq@TME-Services.com', 'Tariq Zarif Khan Malik', 'Accounting', 'Accounting Manager', '$2b$12$ziEoWTTEBTDi9AcMXxI5weL.uJnk9c4waXNEmLD9CY9rGtr5SlXmK', 'manager', 'active', true),
('40 AS', 'akash@TME-Services.com', 'Akash Nagesh Shetty', 'Accounting', 'Accountant', '$2b$12$BJYd2Kj3k20ICBRsibg46OIfV/iUoI/yy.wCEvuJSHE6jnvYRQtNC', 'employee', 'active', true),
('42 RJ', 'reshma@TME-Services.com', 'Reshma Joseph', 'Tax & Compliance', 'Accountant', '$2b$12$gWpikDxiWiUCf4SqFWluvO2SHWXOzEyIg0cBMuGgR1uSTqn/oN2LS', 'employee', 'active', true),
('48 AB', 'ashly@TME-Services.com', 'Ashly Biju', 'Accounting', 'Accountant', '$2b$12$wBpskegBqVRWv8Poo7waZ.9FIYVLd5eA5tvpR8Sv8hbk/oMl4EsOS', 'employee', 'active', true),
('50 PA', 'praveen@TME-Services.com', 'Praveen Anton Pereira', 'IT', 'System Administrator', '$2b$12$7PmWu2b3T.IH2aZAAT/qZeygTLQIOMJkfz/sTOea87Z5ZMk9czRgu', 'employee', 'active', true),
('53 JT', 'jovel@TME-Services.com', 'Jovel Monton Tiro', 'Client Support', 'Administrative Supervisor', '$2b$12$awVCySwpo7BhXUOdECa3m.Kgx5/MxYM/haqsNPbzF.3B5gyJ1VZ4K', 'manager', 'active', true),
('58 YF', 'yashika@TME-Services.com', 'Yashika Fernandes', 'Tax & Compliance', 'Accountant', '$2b$12$grhFNo1XhOY.opXk7sMm2u0blsmy4TPfGE2S77cjjmkyy.wpC0yI6', 'employee', 'active', true),
('65 WM', 'wilma@TME-Services.com', 'Wilma Menezes', 'Client Support', 'Client Support Coordinator', '$2b$12$XiI0.oc75HEOFRlvnO0sseWqbZRFo/nhHi7vGEC/ZSUZSZdUyp8SW', 'employee', 'active', true),
('70 DN', 'damir@TME-Services.com', 'Damir Novalic', 'Marketing ', 'Manager - Digital Marketing', '$2b$12$I5m1ijlmFM10PwyOxry/wOLWQ6NOfW3IKFFKaOLf.wtgX8iRS7X/K', 'manager', 'active', true),
('75 WS', 'wafa@TME-Services.com', 'Wafa Sulthana Masood', 'Client Support', 'Client Support Coordinator', '$2b$12$FfmPFckdcvqBfJaOozRQZet6zaW02C/7kwXktcLkR.xwk9.HgRlhy', 'employee', 'active', true),
('76 RA', 'rowelyn@TME-Services.com', 'Rowelyn Allibang Jocson', 'Client Support', 'Marketing Specialist', '$2b$12$Rr/9JO6JgZIQkZQ9hzlRy.ahDbvwmX46RVsuF.tgXr33daaTGi3Em', 'employee', 'active', true),
('79 ST', 'surya@TME-Services.com', 'Surya Padmakumari Thulaseedharan', 'Client Support', 'Client Support Coordinator', '$2b$12$ArlRYsHbopVGsY/rls9qdemoCdPQxgFJGiiTLgh9iRNRQNgrEpmMK', 'employee', 'active', true),
('80 RoJ', 'roja@TME-Services.com', 'Roja James', 'Tax & Compliance', 'Accountant', '$2b$12$Vv84K9OZbhRs1l2a13cJEeUN8gxXlb.JpM9bHlSHpEidASSiPo8K2', 'employee', 'active', true),
('82 AC', 'alyssa@TME-Services.com', 'Alyssa Marie Jimenez Castillo', 'Client Support', 'Client Support Coordinator', '$2b$12$MyAdnbDBMQUlUTJzjNwULut5k4pqTPnwRJgvltLmZfq5q76tideW2', 'employee', 'active', true),
('83 TM', 'tanya@TME-Services.com', 'Tanya Maria Miranda', 'Accounting', 'Accountant', '$2b$12$yf3ssBi7.CdZ6rc2dXmeD.nUT1H4Ay7Jm5QlpcQP5rh.pk/Jx68Y.', 'employee', 'active', true),
('86 MA', 'muhammed@TME-Services.com', 'Muhammed Anshad Chandveettil', 'Tax & Compliance', 'Accountant', '$2b$12$/L6DbpuWBaR7.cgN6m8.qe/tVxQlnSJcDIBgeER3MwcX6emg1NQV.', 'employee', 'active', true),
('87 VR', 'via@TME-Services.com', 'Via Andrea Rosales', 'Client Support', 'Receptionist', '$2b$12$sKtOL3dmbUAe0AKp5aPOxuqsMtnySJBteCAZ6GyxnfZEI32T1M2uq', 'employee', 'active', true),
('88 AjA', 'aiswarya@TME-Services.com', 'Aiswarya Ajaykumar', 'Client Support', 'Client Support Coordinator', '$2b$12$keOHhrjepGvoSDB/3Uq6l.ZGiAVgiNBKnhC7D1PCRAHE4wteAFqwy', 'employee', 'active', true),
('89 RR', 'renji@TME-Services.com', 'Renji Reghunadh', 'Client Support', 'Administration Manager', '$2b$12$WSGVqnm807A8/wmBGNkVwu5jf/rPxW7.qQkZG/jNP6IPJjCtxIh/y', 'manager', 'active', true),
('90 MD', 'alicia@TME-Services.com', 'Alicia Myles Elamparo Dela Cruz', 'Accounting', 'Assistant Accountant', '$2b$12$K9Iuwvp7itX4VQmZT5WFpu9vb17.ZwUVT2J283itp.RDNLKBDlCt2', 'employee', 'active', true),
('91 PG', 'priya@TME-Services.com', 'Priya Ganapathy Kariappa', 'Client Support', 'Client Support Coordinator', '$2b$12$W6WhAIiIfS/.wkWGnv41M.x3/uyG7wJuv2.geWskDGNQ94mjczAY6', 'employee', 'active', true),
('92 CM', 'chirath@TME-Services.com', 'Chirath Deshitha Mayakaduwa', 'Tax & Compliance', 'Accountant', '$2b$12$GsPJ38WpwSDa/buXz85BX.0huZ8Dwp0FF.t/SD.SRW6..WIqjXBCK', 'employee', 'active', true),
('95 Sis', 'saquib@TME-Services.com', 'Saquib Siraj', 'Accounting', 'Accountant', '$2b$12$6ubCs9./.kGnGh4aLj3j4u2gKJR7Q5Fgncm5s/GKek1aNRtPrkKri', 'employee', 'active', true),
('96 TR', 'tina@TME-Services.com', 'Tina Reimann', 'Company Setup', 'Service Station Manager', '$2b$12$eoxia5HgY8Cx1dt85YUp..cZS4H.x7HdDEyOZYEmbFMCXKJSOwtia', 'manager', 'active', true),
('98 NP', 'nidhi@TME-Services.com', 'Nidhi Pandey', 'Accounting', 'Accountant', '$2b$12$9zoG6u7/IHOEVhzIycAfLuJF6SdSt8Cb.3uxcRytgLds9QtDyeleO', 'employee', 'active', true),
('99 AtS', 'atheesha@TME-Services.com', 'Atheesha Shetty', 'Accounting', 'Accountant', '$2b$12$czaGoPDdbfAPs2kbWG8naesXRv43OqetN8.ZVJ59ugGktp.wIxXm6', 'employee', 'active', true),
('100 MB', 'mehran@TME-Services.com', 'Mehran Masood Barde', 'Accounting', 'Accountant', '$2b$12$3Ewzg5urFf06jb8XTUZAguLRDBOXxfI9XzYrJSlDadKSZHZ0b6QMK', 'employee', 'active', true),
('102 OO', 'onur@TME-Services.com', 'Onur Ozturk', 'Company Setup', 'Business Development Assistant', '$2b$12$MGeVbEdtwYOjomVyUBqZZO5Rlw9ZnK5lUI10hOJhnqX8yyLcqirgG', 'employee', 'active', true),
('103 BD', 'brayan@TME-Services.com', 'Brayan Dsouza', 'IT', 'Information Technology Consultant', '$2b$12$8xuSDSeCzMVzSN5gFHxH1OU8E3u9nC6MwibfOZ65N/pJz3jYxCmIu', 'employee', 'active', true),
('105 MM', 'milani@TME-Services.com', 'Milani Listin Morris', 'Client Support', 'Front Desk Support', '$2b$12$xWNePVOt0f3K6Zn9dbPQnuvnPoBTsdfsKBGjUmbj/AZG5O8NZf9gW', 'employee', 'active', true),
('106 CV', 'charltzon@TME-Services.com', 'Charltzon Varghese', 'Accounting', 'Accountant', '$2b$12$fPkdhqX2QxWHBgkCTWhNZOxfTQ.298nMhC1f.U.fXERpf88eQdrp2', 'employee', 'active', true),
('108 MR', 'mohamed@TME-Services.com', 'Mohamed Rashid Basheer', 'Accounting', 'Accountant', '$2b$12$At5piP59Q26auBZjUS6mqOZSR5HjXJvxTc7E3rpG/xWFcjkTXTt0C', 'employee', 'active', true),
('109 PS', 'princyss@TME-Services.com', 'Princyss Sampaga', 'Client Support', 'Administration Officer', '$2b$12$TjYj8oODSqgBfjJoNBR0OugFiZrovCQqdyV7eD/NzjtMOT7cCBgKS', 'employee', 'active', true),
('110 CD', 'carol@TME-Services.com', 'Carol Jenifa Dalmeida', 'Accounting', 'Accountant', '$2b$12$Y88ngJPyof0nQ1zyIWxisO9XnYuQ/JcgLzCarZIPoHKcA0Ib10Gn2', 'employee', 'active', true);

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