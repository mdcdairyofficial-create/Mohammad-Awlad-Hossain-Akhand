import Database from "better-sqlite3";

const db = new Database("app.db");

console.log("Deleting all user data...");

// Delete all related records first
db.prepare(`DELETE FROM users_wallet`).run();
db.prepare(`DELETE FROM ptc_balances`).run();
db.prepare(`DELETE FROM ptc_clicks`).run();
db.prepare(`DELETE FROM recharge_orders`).run();
db.prepare(`DELETE FROM recharge_history`).run();
db.prepare(`DELETE FROM payments`).run();
db.prepare(`DELETE FROM cases`).run();
db.prepare(`DELETE FROM user_memories`).run();
db.prepare(`DELETE FROM affiliate_proofs`).run();

// Finally delete all users
const result = db.prepare(`DELETE FROM users`).run();

// Reset auto-increment counters
try {
  db.prepare(`DELETE FROM sqlite_sequence WHERE name='users'`).run();
  db.prepare(`DELETE FROM sqlite_sequence WHERE name='users_wallet'`).run();
  db.prepare(`DELETE FROM sqlite_sequence WHERE name='ptc_balances'`).run();
  db.prepare(`DELETE FROM sqlite_sequence WHERE name='cases'`).run();
} catch (e) {
  // Ignore if sqlite_sequence doesn't exist or fails
}

console.log(`Successfully deleted ${result.changes} users and all related data.`);
