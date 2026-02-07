const { validateCredentials } = require('../app/lib/auth');
const db = require('../app/lib/db');

// Mock cookies since auth.ts might import them (but validateCredentials shouldn't use them)
// Wait, validateCredentials imports ensureAdminUser which imports getUserByUsername which imports queryOne from ./db
// The imports in auth.ts are: 
// import { cookies } from 'next/headers'; -> This will crash in node script if not handled?
// Actually Next.js imports might fail in standalone node script if not compiled or if using "require" on TS files.
// I can't easily run TS files with simple `node`.
// I should use `ts-node` if available or just check the DB manually with bcrypt.

const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'josyldo.db');
const dbSqlite = new Database(DB_PATH);

const user = dbSqlite.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE").get('Admin');

if (!user) {
    console.error('❌ User "Admin" not found!');
    process.exit(1);
}

console.log('User found:', user.username);
console.log('Role:', user.role);

const isValid = bcrypt.compareSync('123456', user.password_hash);

if (isValid) {
    console.log('✅ Password "123456" is VALID!');
} else {
    console.error('❌ Password "123456" is INVALID!');
}
