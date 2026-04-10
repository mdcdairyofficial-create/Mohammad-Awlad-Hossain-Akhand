import Database from 'better-sqlite3';
const db = new Database('app.db');
try {
  const stmt = db.prepare("INSERT INTO ptc_balances (user_id, balance, total_earned) VALUES (?, 0, 0)");
  stmt.run(100n);
  console.log("Success");
} catch (e) {
  console.error("Error:", e.message);
}
