const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5434,
  database: 'tme_portal',
  user: 'tme_user',
  password: 'secure_password',
});

async function populateUsersFromTeam() {
  try {
    // Read team.json file
    const teamFilePath = path.join(__dirname, '..', 'team.json');
    const teamData = JSON.parse(fs.readFileSync(teamFilePath, 'utf8'));
    
    console.log(`Found ${teamData.length} users in team.json`);
    
    // Clear existing users (be careful - this deletes all users!)
    console.log('⚠️  Clearing existing users...');
    await pool.query('DELETE FROM user_permissions');
    await pool.query('DELETE FROM sessions');  
    await pool.query('DELETE FROM audit_logs');
    await pool.query('DELETE FROM users');
    
    // Reset sequence
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    
    console.log('✅ Cleared existing users');
    
    // Default password for all users
    const defaultPassword = 'TME2025!Change';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    // Insert each user
    let insertedCount = 0;
    for (const user of teamData) {
      try {
        const result = await pool.query(`
          INSERT INTO users (
            employee_code, email, first_name, last_name, full_name, 
            phone, department, designation, hashed_password, role, 
            status, must_change_password
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id
        `, [
          user.employee_code,
          user.email,
          user.first_name,
          user.last_name,
          user.full_name,
          user.phone,
          user.department,
          user.designation,
          hashedPassword,
          user.role,
          user.status,
          user.must_change_password
        ]);
        
        insertedCount++;
        console.log(`✅ Inserted user ${insertedCount}: ${user.full_name} (${user.role})`);
        
      } catch (error) {
        console.error(`❌ Failed to insert user ${user.full_name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully inserted ${insertedCount} users!`);
    console.log(`📝 Default password for all users: ${defaultPassword}`);
    console.log(`👑 Admins: Uwe Hohmann, Damir Novalic`);
    
    // Verify the data
    const verifyResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n📊 Total users in database: ${verifyResult.rows[0].count}`);
    
    const adminResult = await pool.query("SELECT full_name, role FROM users WHERE role = 'admin'");
    console.log('🔑 Admin users:', adminResult.rows.map(u => u.full_name).join(', '));
    
  } catch (error) {
    console.error('❌ Error populating users:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  console.log('🚀 Starting user population from team.json...\n');
  populateUsersFromTeam();
}

module.exports = { populateUsersFromTeam };