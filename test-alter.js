import Database from 'better-sqlite3';
const db = new Database('app.db');
try {
  db.prepare("ALTER TABLE users ADD COLUMN facebook_id TEXT").run();
  console.log("Success");
} catch (e) {
  console.error("Error:", e.message);
}
