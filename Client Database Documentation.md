⏺ 📋 Client Database Documentation for Team

  🗄️ Database Schema:

  Table: clients
  -- Location: database/migrations/005_clients_management.sql
  CREATE TABLE clients (
      id SERIAL PRIMARY KEY,
      company_code VARCHAR(10) UNIQUE NOT NULL,           -- "10015", "12345"
      company_name VARCHAR(500) NOT NULL,                 -- "Alliance Laundry bvba"
      company_name_short VARCHAR(200) NOT NULL,           -- "Alliance"
      registered_authority VARCHAR(100) NOT NULL,         -- "DXB DET", "AUH DED" 
      management_name VARCHAR(300) NOT NULL,              -- "Tim Bacon"
      management_email VARCHAR(255) NOT NULL,             -- "tim@company.com"
      city VARCHAR(100) NOT NULL,                         -- "Dubai", "Abu Dhabi"
      po_box VARCHAR(50),                                  -- "393291" or NULL
      vat_trn VARCHAR(50),                                 -- "10020 43865 00003" or NULL
      status VARCHAR(20) DEFAULT 'active',                -- 'active', 'inactive', 'archived'
      notes TEXT,                                          -- Additional notes
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER REFERENCES users(id),            -- Admin who created
      updated_by INTEGER REFERENCES users(id)             -- Admin who last updated
  );

  🔌 API Endpoints:

  Base URL: /api/admin/clients

  // GET all clients (with search/filter)
  GET /api/admin/clients?search=Alliance&authority=DXB DET&city=Dubai&status=active

  // GET specific client
  GET /api/admin/clients/123

  // CREATE new client  
  POST /api/admin/clients
  Body: { company_code, company_name, company_name_short, registered_authority, management_name, management_email, city, po_box?, vat_trn?, status?, notes? }

  // UPDATE client
  PATCH /api/admin/clients/123
  Body: { field_to_update: new_value }

  // DELETE client
  DELETE /api/admin/clients/123

  // BULK operations
  POST /api/admin/clients/bulk
  Body: { clientIds: [1,2,3], action: "activate|deactivate|delete|archive" }

  🎯 How to Reference Clients in Your Features:

  1. Database Queries:

  -- Get all active clients
  SELECT * FROM clients WHERE status = 'active' ORDER BY company_code;

  -- Find client by code
  SELECT * FROM clients WHERE company_code = '10015';

  -- Get clients by authority
  SELECT * FROM clients WHERE registered_authority = 'DXB DET';

  -- Search clients
  SELECT * FROM clients WHERE company_name ILIKE '%alliance%' OR company_code ILIKE '%10015%';

  2. TypeScript Interface:

  // Location: src/components/admin/ClientManagementPanel.tsx (lines 17-30)
  interface Client {
    id: number;
    company_code: string;
    company_name: string;
    company_name_short: string;
    registered_authority: string;
    management_name: string;
    management_email: string;
    city: string;
    po_box?: string;
    vat_trn?: string;
    status: 'active' | 'inactive' | 'archived';
    notes?: string;
    created_at: string;
    updated_at: string;
  }

  3. Frontend Components:

  // Import existing components
  import ClientManagementPanel from '@/components/admin/ClientManagementPanel';
  import ClientModal from '@/components/admin/ClientModal';

  // Fetch clients in your components
  const fetchClients = async () => {
    const response = await fetch('/api/admin/clients');
    const data = await response.json();
    return data.clients; // Array of Client objects
  };

  📊 Current Data:

  - 339 total clients imported and active
  - 26 unique authorities (DXB DET, AUH DED, etc.)
  - 13 unique cities (Dubai, Abu Dhabi, etc.)
  - 7 clients with placeholder emails (flagged with ! in UI)

  🔗 Integration Examples:

  Link to Golden Visa:

  -- Add client_id to golden_visa applications
  ALTER TABLE golden_visa_applications
  ADD COLUMN client_id INTEGER REFERENCES clients(id);

  Link to Cost Overview:

  -- Add client reference to cost calculations
  ALTER TABLE cost_calculations
  ADD COLUMN client_id INTEGER REFERENCES clients(id);

  Client Dropdown Component:

  // Create reusable client selector
  const ClientSelector = ({ onSelect }) => {
    const [clients, setClients] = useState([]);

    useEffect(() => {
      fetch('/api/admin/clients?status=active')
        .then(res => res.json())
        .then(data => setClients(data.clients));
    }, []);

    return (
      <select onChange={(e) => onSelect(e.target.value)}>
        <option value="">Select Client</option>
        {clients.map(client => (
          <option key={client.id} value={client.id}>
            [{client.company_code}] {client.company_name}
          </option>
        ))}
      </select>
    );
  };

  🔑 Key Points for Team:

  1. Always reference by id - not company_code (for foreign keys)
  2. Company codes are unique - good for user-facing references
  3. Status field - use for filtering active/inactive clients
  4. Admin-only access - all client endpoints require admin authentication
  5. Audit logging - all client changes are automatically logged

  This gives your team everything they need to integrate client data into new features! 🚀