import Database from 'better-sqlite3';
const db = new Database('app.db');
const columns = db.prepare("PRAGMA table_info(users)").all();
console.log(columns.map(c => c.name));
