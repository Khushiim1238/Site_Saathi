const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const dbPath = path.join(__dirname, 'data', 'crm.sqlite');
const db = new DatabaseSync(dbPath);

console.log('Users:');
console.log(db.prepare('SELECT id, name, role FROM users').all());
