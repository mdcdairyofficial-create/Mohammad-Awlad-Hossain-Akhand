import Database from "better-sqlite3";

const db = new Database("app.db");

// Find the last 3 users with an email
const users = db.prepare("SELECT id, name, email, user_type, created_at FROM users WHERE email IS NOT NULL ORDER BY id DESC LIMIT 3").all();

console.log("Found users to delete:");
console.log(users);

if (users.length > 0) {
  const ids = users.map((u: any) => u.id);
  
  // Delete related records first
  db.prepare(`DELETE FROM users_wallet WHERE user_id IN (${ids.join(',')})`).run();
  db.prepare(`DELETE FROM ptc_balances WHERE user_id IN (${ids.join(',')})`).run();
  db.prepare(`DELETE FROM ptc_clicks WHERE user_id IN (${ids.join(',')})`).run();
  db.prepare(`DELETE FROM recharge_orders WHERE user_id IN (${ids.join(',')})`).run();
  db.prepare(`DELETE FROM recharge_history WHERE user_id IN (${ids.join(',')})`).run();
  db.prepare(`DELETE FROM payments WHERE user_id IN (${ids.join(',')})`).run();
  db.prepare(`DELETE FROM cases WHERE user_id IN (${ids.join(',')})`).run();
  db.prepare(`DELETE FROM user_memories WHERE user_id IN (${ids.join(',')})`).run();
  db.prepare(`DELETE FROM affiliate_proofs WHERE user_id IN (${ids.join(',')})`).run();
  
  // Finally delete the users
  const result = db.prepare(`DELETE FROM users WHERE id IN (${ids.join(',')})`).run();
  console.log(`Deleted ${result.changes} users.`);
} else {
  console.log("No users with email found.");
}
