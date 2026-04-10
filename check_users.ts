import Database from "better-sqlite3";

const db = new Database("app.db");

const users = db.prepare("SELECT id, name, email, mobile, user_type, created_at FROM users ORDER BY id DESC LIMIT 10").all();
console.log(users);
