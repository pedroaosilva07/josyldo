const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'josyldo.db');
const db = new Database(DB_PATH);

try {
    console.log('Verifying users table schema...');
    const columns = db.pragma('table_info(users)');
    const hasRole = columns.some(c => c.name === 'role');

    if (!hasRole) {
        console.log('Adding role column to users table...');
        db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'USER'").run();
        console.log('✅ Role column added successfully.');
    } else {
        console.log('ℹ️ Role column already exists.');
    }
} catch (error) {
    console.error('❌ Error updating database:', error);
} finally {
    db.close();
}
