import Database from "better-sqlite3";

const db = new Database("app.db");
const user = db.prepare("SELECT * FROM users WHERE id = 2").get();
console.log(user);
