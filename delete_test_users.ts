import Database from "better-sqlite3";
const db = new Database("app.db");
db.prepare("DELETE FROM users_wallet WHERE user_id IN (2, 3)").run();
db.prepare("DELETE FROM ptc_balances WHERE user_id IN (2, 3)").run();
db.prepare("DELETE FROM users WHERE id IN (2, 3)").run();
console.log("Deleted test users");
