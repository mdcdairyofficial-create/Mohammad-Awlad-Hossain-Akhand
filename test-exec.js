import Database from 'better-sqlite3';
const db = new Database('app.db');
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    mobile TEXT UNIQUE,
    password TEXT,
    user_type TEXT,
    district TEXT,
    country TEXT,
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    subscription_end_date DATETIME,
    subscription_package TEXT DEFAULT 'free',
    profile_picture TEXT,
    appointed_by INTEGER,
    ai_questions_count INTEGER DEFAULT 0,
    last_ai_reset_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    facebook_id TEXT,
    youtube_id TEXT,
    instagram_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `);
  console.log("Success");
} catch (e) {
  console.error("Error:", e.message);
}
