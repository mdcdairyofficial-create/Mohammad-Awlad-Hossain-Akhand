import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import SSLCommerzPayment from "sslcommerz-lts";
import fs from "fs";

// Initialize SQLite Database
let db: Database.Database;
try {
  db = new Database("app.db");
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (err: any) {
  if (err.code === 'SQLITE_CORRUPT') {
    console.error("Database is corrupt, deleting and recreating...");
    if (fs.existsSync("app.db")) {
      fs.unlinkSync("app.db");
    }
    db = new Database("app.db");
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  } else {
    throw err;
  }
}

// Create basic tables if they don't exist
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
  
  CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caseNumber TEXT,
    courtName TEXT,
    nextDate TEXT,
    status TEXT,
    caseType TEXT,
    petitioner TEXT,
    respondent TEXT,
    isUpdated BOOLEAN DEFAULT 0,
    order_text TEXT,
    petitionerMobile TEXT,
    respondentMobile TEXT,
    petitionerLawyer TEXT,
    respondentLawyer TEXT,
    petitionerLawyerMobile TEXT,
    respondentLawyerMobile TEXT,
    petitionerClerk TEXT,
    respondentClerk TEXT,
    petitionerClerkMobile TEXT,
    respondentClerkMobile TEXT,
    petitionerAsstLawyer TEXT,
    respondentAsstLawyer TEXT,
    petitionerAsstLawyerMobile TEXT,
    respondentAsstLawyerMobile TEXT,
    petitionerAsstClerk TEXT,
    respondentAsstClerk TEXT,
    petitionerAsstClerkMobile TEXT,
    respondentAsstClerkMobile TEXT,
    filingDate TEXT,
    lastEditedBySide TEXT,
    reportedErrorBySide TEXT,
    visibility TEXT DEFAULT 'private',
    case_section TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- PTC (Paid To Click) Tables
  CREATE TABLE IF NOT EXISTS ptc_ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    reward_amount REAL DEFAULT 0.0,
    duration_seconds INTEGER DEFAULT 10,
    max_clicks INTEGER DEFAULT 0,
    current_clicks INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ptc_clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    ad_id INTEGER,
    earned_amount REAL,
    clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (ad_id) REFERENCES ptc_ads(id)
  );

  CREATE TABLE IF NOT EXISTS ptc_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    balance REAL DEFAULT 0.0,
    total_earned REAL DEFAULT 0.0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Recharge Module Tables
  CREATE TABLE IF NOT EXISTS users_wallet (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    balance REAL DEFAULT 0.0,
    points REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS recharge_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    mobile_number TEXT,
    operator TEXT,
    package_type TEXT,
    amount REAL,
    commission REAL,
    cashback REAL,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    transaction_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    tran_id TEXT UNIQUE,
    amount REAL,
    purpose TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS recharge_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    mobile_number TEXT,
    operator TEXT,
    package TEXT,
    amount REAL,
    status TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    uploaded_by INTEGER,
    uploader_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS subscription_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_mobile TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    duration TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS affiliate_proofs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    link_id TEXT NOT NULL,
    screenshot_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);
} catch (err) {
  console.error("Error initializing tables:", err);
}

// Add missing columns if they don't exist
try { db.prepare("ALTER TABLE cases ADD COLUMN reportedErrorBySide TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE cases ADD COLUMN petitionerAsstLawyer TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE cases ADD COLUMN respondentAsstLawyer TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE cases ADD COLUMN petitionerAsstLawyerMobile TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE cases ADD COLUMN respondentAsstLawyerMobile TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE cases ADD COLUMN petitionerAsstClerk TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE cases ADD COLUMN respondentAsstClerk TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE cases ADD COLUMN petitionerAsstClerkMobile TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE cases ADD COLUMN respondentAsstClerkMobile TEXT").run(); } catch (e) {}

// Add profile_picture column if it doesn't exist (for existing databases)
try {
  db.exec("ALTER TABLE users ADD COLUMN profile_picture TEXT");
} catch (e) {
  // Column might already exist
}

// Add social media ID columns if they don't exist
try { db.exec("ALTER TABLE users ADD COLUMN facebook_id TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN youtube_id TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN instagram_id TEXT"); } catch (e) {}

// Add uploader_name column if it doesn't exist
try {
  db.exec("ALTER TABLE templates ADD COLUMN uploader_name TEXT;");
} catch (e) {
  // Column already exists
}

// Ensure demo user exists to prevent FOREIGN KEY constraint failures
try {
  const demoUser = db.prepare("SELECT * FROM users WHERE id = 1").get();
  if (!demoUser) {
    db.prepare("INSERT INTO users (id, name, mobile, user_type, district, country, subscription_end_date) VALUES (1, 'ব্যবহারকারী', '01700000000', 'lawyer', 'ঢাকা', 'Bangladesh', datetime('now', '+365 days'))").run();
    db.prepare("INSERT INTO ptc_balances (user_id, balance, total_earned) VALUES (1, 0, 0)").run();
    db.prepare("INSERT INTO users_wallet (user_id, balance, points) VALUES (1, 0, 0)").run();
  }
} catch (e) {
  console.error("Failed to create demo user:", e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.get("/api/users/:id", (req, res) => {
    try {
      const user = db.prepare(`
        SELECT u.id, u.name, u.email, u.mobile, u.user_type, u.district, u.country, u.referral_code, u.referred_by, u.subscription_end_date, u.subscription_package, u.profile_picture, u.ai_questions_count, u.last_ai_reset_date, w.points 
        FROM users u 
        LEFT JOIN users_wallet w ON u.id = w.user_id 
        WHERE u.id = ?
      `).get(req.params.id) as any;
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        id: user.id,
        fullName: user.name,
        email: user.email,
        mobile: user.mobile,
        userType: user.user_type,
        district: user.district,
        country: user.country,
        referralCode: user.referral_code,
        referredBy: user.referred_by,
        subscriptionEndDate: user.subscription_end_date,
        subscriptionPackage: user.subscription_package,
        profilePicture: user.profile_picture,
        aiQuestionsCount: user.ai_questions_count,
        lastAiResetDate: user.last_ai_reset_date,
        points: user.points || 0
      });
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  // Recharge Routes
  app.post("/api/recharge/request", (req, res) => {
    try {
      const { userId, mobileNumber, operator, amount, paymentMethod, transactionId } = req.body;
      
      db.prepare("INSERT INTO recharge_orders (user_id, mobile_number, operator, amount, payment_method, transaction_id) VALUES (?, ?, ?, ?, ?, ?)").run(userId, mobileNumber, operator, amount, paymentMethod, transactionId);
      
      res.json({ success: true, message: "রিচার্জ রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে।" });
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.get("/api/recharge/history/:userId", (req, res) => {
    try {
      const history = db.prepare("SELECT * FROM recharge_orders WHERE user_id = ? ORDER BY created_at DESC").all(req.params.userId) as any[];
      const mappedHistory = history.map(h => {
        let operatorId = 'gp';
        if (h.operator === 'Robi') operatorId = 'robi';
        else if (h.operator === 'Banglalink') operatorId = 'bl';
        else if (h.operator === 'Teletalk') operatorId = 'teletalk';
        else if (h.operator === 'Airtel') operatorId = 'airtel';
        
        return {
          ...h,
          date: h.created_at,
          package: h.package_type,
          operator: operatorId
        };
      });
      res.json({ success: true, history: mappedHistory });
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

app.post('/api/subscription/request', (req, res) => {
  const { mobile, planName, amount, duration, paymentMethod, transactionId, targetType } = req.body;
  
  if (!mobile || !planName || !amount || !duration || !paymentMethod || !transactionId || !targetType) {
    return res.status(400).json({ error: 'সব তথ্য দেওয়া আবশ্যক।' });
  }

  try {
    // 1. Check if this Transaction ID has already been used
    const existingRequest = db.prepare("SELECT * FROM subscription_requests WHERE transaction_id = ?").get(transactionId);
    if (existingRequest) {
      return res.status(400).json({ error: 'এই ট্রাঞ্জেকশন আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে।' });
    }

    // 2. Save the request as 'pending' for Admin verification
    const stmt = db.prepare(`
      INSERT INTO subscription_requests (user_mobile, plan_name, amount, duration, payment_method, transaction_id, target_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `);
    stmt.run(mobile, planName, amount, duration, paymentMethod, transactionId, targetType);

    res.json({ success: true, message: 'আপনার রিকোয়েস্টটি জমা হয়েছে। অ্যাডমিন যাচাই করে দ্রুত অ্যাপ্রুভ করবেন।' });
  } catch (err) {
    console.error('Error saving subscription request:', err);
    res.status(500).json({ error: 'সার্ভার এরর। আবার চেষ্টা করুন।' });
  }
});

  app.post("/api/users/increment-ai-usage", (req, res) => {
    try {
      const { userId, deductPoints } = req.body;
      const user = db.prepare("SELECT ai_questions_count, last_ai_reset_date FROM users WHERE id = ?").get(userId) as { ai_questions_count: number, last_ai_reset_date: string };
      
      if (!user) return res.status(404).json({ error: "ইউজার পাওয়া যায়নি।" });

      if (deductPoints) {
        // Deduct 10 points
        const wallet = db.prepare("SELECT points FROM users_wallet WHERE user_id = ?").get(userId) as any;
        if (!wallet || wallet.points < 10) {
          return res.status(400).json({ error: "পর্যাপ্ত পয়েন্ট নেই।" });
        }
        db.prepare("UPDATE users_wallet SET points = points - 10 WHERE user_id = ?").run(userId);
      } else {
        const lastReset = new Date(user.last_ai_reset_date);
        const now = new Date();
        
        // Reset count if it's a new month
        if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
          db.prepare("UPDATE users SET ai_questions_count = 1, last_ai_reset_date = datetime('now') WHERE id = ?").run(userId);
        } else {
          db.prepare("UPDATE users SET ai_questions_count = ai_questions_count + 1 WHERE id = ?").run(userId);
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Middleware
  app.use("/api/admin", (req, res, next) => {
    const adminId = req.headers['x-admin-id'];
    if (!adminId) {
      return res.status(401).json({ error: "Unauthorized: Admin ID missing" });
    }
    try {
      const adminUser = db.prepare("SELECT user_type FROM users WHERE id = ?").get(adminId) as { user_type: string } | undefined;
      if (!adminUser || !['admin', 'super_admin', 'country_manager'].includes(adminUser.user_type)) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }
      // Attach admin info to request
      (req as any).adminUser = adminUser;
      next();
    } catch (error) {
      console.error("Admin middleware error:", error);
      res.status(500).json({ error: "Internal server error in admin middleware" });
    }
  });

  // Superadmin Appointment Endpoint
  app.post("/api/admin/appoint-district-admin", (req, res) => {
    try {
      const { targetUserId, district } = req.body;
      const adminUser = (req as any).adminUser;

      // Verify superadmin
      if (adminUser.user_type !== 'super_admin') {
        return res.status(403).json({ error: "শুধুমাত্র সুপার অ্যাডমিন এই কাজটি করতে পারবেন।" });
      }

      // Check if district already has an admin
      const existingAdmin = db.prepare("SELECT id FROM users WHERE user_type = 'admin' AND district = ?").get(district);
      if (existingAdmin) {
        return res.status(400).json({ error: "এই জেলায় ইতিমধ্যে একজন অ্যাডমিন নিযুক্ত আছেন।" });
      }

      // Appoint admin
      db.prepare(`
        UPDATE users 
        SET user_type = 'admin', 
            appointed_by = ?, 
            subscription_end_date = datetime('now', '+365 days'),
            ai_questions_count = 0,
            last_ai_reset_date = datetime('now')
        WHERE id = ?
      `).run(req.headers['x-admin-id'], targetUserId);

      res.json({ success: true, message: "অ্যাডমিন সফলভাবে নিযুক্ত করা হয়েছে।" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Affiliate Proofs API
  app.post("/api/affiliate/proof", (req, res) => {
    try {
      console.log("Received proof request:", req.body);
      const { user_id, link_id, screenshot_url } = req.body;
      if (!user_id || !link_id || !screenshot_url) {
        console.log("Missing data:", { user_id, link_id, screenshot_url });
        return res.status(400).json({ error: "তথ্য অসম্পূর্ণ।" });
      }

      // Check if user exists
      const userExists = db.prepare("SELECT id FROM users WHERE id = ?").get(user_id);
      if (!userExists) {
        return res.status(404).json({ error: "ইউজার পাওয়া যায়নি। দয়া করে আবার লগইন করুন।" });
      }
      
      const stmt = db.prepare("INSERT INTO affiliate_proofs (user_id, link_id, screenshot_url) VALUES (?, ?, ?)");
      const info = stmt.run(user_id, link_id, screenshot_url);
      
      res.json({ success: true, id: Number(info.lastInsertRowid) });
    } catch (error: any) {
      console.error("Error inserting proof:", error);
      res.status(500).json({ error: "প্রমাণ জমা দিতে ব্যর্থ হয়েছে। " + error.message });
    }
  });

  app.get("/api/admin/affiliate-proofs", (req, res) => {
    try {
      const proofs = db.prepare(`
        SELECT p.*, u.name as user_name, u.mobile as user_mobile 
        FROM affiliate_proofs p 
        LEFT JOIN users u ON p.user_id = u.id 
        ORDER BY p.created_at DESC
      `).all();
      res.json({ success: true, proofs });
    } catch (error: any) {
      res.status(500).json({ error: "প্রমাণ আনতে ব্যর্থ হয়েছে।" });
    }
  });

  app.post("/api/admin/affiliate-proofs/:id/approve", (req, res) => {
    try {
      const { id } = req.params;
      const proof = db.prepare("SELECT * FROM affiliate_proofs WHERE id = ?").get(id) as any;
      
      if (!proof || proof.status !== 'pending') {
        return res.status(400).json({ error: "Invalid proof or already processed" });
      }

      db.transaction(() => {
        // Update status
        db.prepare("UPDATE affiliate_proofs SET status = 'approved' WHERE id = ?").run(id);
        
        // Add 100 points
        const wallet = db.prepare("SELECT * FROM users_wallet WHERE user_id = ?").get(proof.user_id);
        if (!wallet) {
          db.prepare("INSERT INTO users_wallet (user_id, points) VALUES (?, 100)").run(proof.user_id);
        } else {
          db.prepare("UPDATE users_wallet SET points = points + 100 WHERE user_id = ?").run(proof.user_id);
        }
      })();

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to approve proof" });
    }
  });

  app.post("/api/admin/affiliate-proofs/:id/reject", (req, res) => {
    try {
      const { id } = req.params;
      db.prepare("UPDATE affiliate_proofs SET status = 'rejected' WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to reject proof" });
    }
  });

  app.get("/api/admin/stats", (req, res) => {
    try {
      const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
      const totalCases = db.prepare("SELECT COUNT(*) as count FROM cases").get() as { count: number };
      const rechargeStats = db.prepare("SELECT status, COUNT(*) as count, SUM(amount) as total FROM recharge_requests GROUP BY status").all() as { status: string, count: number, total: number }[];
      const userBreakdown = db.prepare("SELECT user_type, COUNT(*) as count FROM users GROUP BY user_type").all() as { user_type: string, count: number }[];
      
      res.json({
        totalUsers: totalUsers.count,
        totalCases: totalCases.count,
        rechargeStats,
        userBreakdown
      });
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.get("/api/admin/cases", (req, res) => {
    try {
      const cases = db.prepare("SELECT c.*, u.name as lawyer_name FROM cases c LEFT JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC").all();
      res.json(cases);
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

app.get('/api/admin/subscription-requests', (req, res) => {
  try {
    const requests = db.prepare(`
      SELECT * FROM subscription_requests 
      WHERE status = 'pending' 
      ORDER BY created_at DESC
    `).all();
    res.json(requests);
  } catch (err) {
    console.error('Error fetching subscription requests:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/admin/subscription-requests/:id/approve', (req, res) => {
  const { id } = req.params;
  try {
    const request = db.prepare("SELECT * FROM subscription_requests WHERE id = ?").get(id) as any;
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const user = db.prepare("SELECT * FROM users WHERE mobile = ?").get(request.user_mobile) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Calculate end date
    const months = request.duration.includes('12') ? 12 : request.duration.includes('6') ? 6 : 1;
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const packageType = request.plan_name.toLowerCase().includes('premium') ? 'premium' : 'classic';

    let targetUserId = user.id;
    if (request.target_type === 'clerk') {
      const clerk = db.prepare("SELECT * FROM users WHERE appointed_by = ?").get(user.id) as any;
      if (clerk) {
        targetUserId = clerk.id;
      }
    }

    // Update user subscription
    db.prepare("UPDATE users SET subscription_package = ?, subscription_end_date = ? WHERE id = ?")
      .run(packageType, endDate.toISOString(), targetUserId);

    // Update request status
    db.prepare("UPDATE subscription_requests SET status = 'approved' WHERE id = ?").run(id);

    res.json({ success: true });
  } catch (err) {
    console.error('Error approving subscription:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/admin/subscription-requests/:id/reject', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("UPDATE subscription_requests SET status = 'rejected' WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error rejecting subscription:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

  app.get("/api/admin/recharge-requests", (req, res) => {
    try {
      const requests = db.prepare("SELECT r.*, u.name as user_name FROM recharge_orders r JOIN users u ON r.user_id = u.id WHERE r.status = 'pending'").all();
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.get("/api/admin/users", (req, res) => {
    try {
      const users = db.prepare(`
        SELECT 
          u.id, u.name, u.mobile, u.user_type, u.created_at, 
          u.subscription_package, u.subscription_end_date,
          w.balance as wallet_balance
        FROM users u
        LEFT JOIN users_wallet w ON u.id = w.user_id
        ORDER BY u.created_at DESC
      `).all();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.put("/api/admin/users/:id/subscription", (req, res) => {
    try {
      const { id } = req.params;
      const { package: pkg, days } = req.body;
      
      const validPackages = ['free', 'standard', 'premium'];
      if (!validPackages.includes(pkg)) {
        return res.status(400).json({ error: "Invalid package" });
      }

      const now = new Date();
      const newEndDate = new Date(now.getTime() + (days || 30) * 24 * 60 * 60 * 1000);

      db.prepare("UPDATE users SET subscription_package = ?, subscription_end_date = ? WHERE id = ?").run(pkg, newEndDate.toISOString(), id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.put("/api/admin/users/:id/role", (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      const validRoles = ['admin', 'bar_admin', 'lawyer', 'clerk', 'client'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      db.prepare("UPDATE users SET user_type = ? WHERE id = ?").run(role, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.post("/api/admin/recharge-approve", (req, res) => {
    try {
      const { orderId, status } = req.body;
      
      const order = db.prepare("SELECT * FROM recharge_orders WHERE id = ?").get(orderId) as any;
      if (!order) return res.status(404).json({ error: "অর্ডার পাওয়া যায়নি।" });
      
      if (status === 'approved') {
        if (order.status === 'completed' || order.status === 'approved') {
          return res.status(400).json({ error: "অর্ডারটি ইতিমধ্যে সম্পন্ন হয়েছে।" });
        }
        
        // Update order status
        db.prepare("UPDATE recharge_orders SET status = 'approved' WHERE id = ?").run(orderId);
        
        if (order.operator === 'subscription' || order.package_type?.toLowerCase().includes('subscription')) {
          // Handle subscription: Add 30 days to subscription_end_date
          const user = db.prepare("SELECT subscription_end_date FROM users WHERE id = ?").get(order.user_id) as any;
          let newEndDate;
          const now = new Date();
          
          if (user && user.subscription_end_date) {
            const currentEnd = new Date(user.subscription_end_date);
            const baseDate = currentEnd > now ? currentEnd : now;
            newEndDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          } else {
            newEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          }
          
          db.prepare("UPDATE users SET subscription_end_date = ? WHERE id = ?").run(newEndDate.toISOString(), order.user_id);
        } else {
          // Add to history
          db.prepare("INSERT INTO recharge_history (user_id, mobile_number, operator, package, amount, status) VALUES (?, ?, ?, ?, ?, 'success')").run(order.user_id, order.mobile_number, order.operator, order.package_type, order.amount);
          
          // Add cashback to wallet
          const wallet = db.prepare("SELECT * FROM users_wallet WHERE user_id = ?").get(order.user_id) as any;
          if (wallet) {
            db.prepare("UPDATE users_wallet SET balance = balance + ? WHERE user_id = ?").run(order.cashback || 0, order.user_id);
          } else {
            db.prepare("INSERT INTO users_wallet (user_id, balance) VALUES (?, ?)").run(order.user_id, order.cashback || 0);
          }
        }
      } else {
        db.prepare("UPDATE recharge_orders SET status = 'rejected' WHERE id = ?").run(orderId);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.post("/api/admin/reset-all", (req, res) => {
    try {
      console.log("Resetting all data...");
      
      // Temporarily disable foreign key constraints
      db.prepare("PRAGMA foreign_keys = OFF").run();
      
      // Clear all tables
      db.prepare("DELETE FROM recharge_history").run();
      db.prepare("DELETE FROM recharge_orders").run();
      db.prepare("DELETE FROM users_wallet").run();
      db.prepare("DELETE FROM ptc_balances").run();
      db.prepare("DELETE FROM ptc_clicks").run();
      db.prepare("DELETE FROM ptc_ads").run();
      db.prepare("DELETE FROM templates").run();
      db.prepare("DELETE FROM cases").run();
      db.prepare("DELETE FROM user_memories").run();
      db.prepare("DELETE FROM subscription_requests").run();
      db.prepare("DELETE FROM users").run();
      
      // Re-enable foreign key constraints
      db.prepare("PRAGMA foreign_keys = ON").run();
      
      console.log("All data reset successfully.");
      
      res.json({ success: true, message: "সকল ডাটা সফলভাবে মুছে ফেলা হয়েছে।" });
    } catch (error: any) {
      console.error("Error resetting data:", error);
      // Ensure foreign keys are back on even if error occurs
      try { db.prepare("PRAGMA foreign_keys = ON").run(); } catch (e) {}
      res.status(500).json({ error: "ডাটা মুছতে ব্যর্থ: " + error.message });
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: "connected" });
  });

  // SSLCommerz Payment Routes
  app.post("/api/payment/initiate", async (req, res) => {
    try {
      const { userId, amount, orderId, purpose } = req.body;
      
      console.log('Initiating payment for user ' + userId + ', amount ' + amount + ', purpose: ' + purpose);
      
      const store_id = process.env.SSLCOMMERZ_STORE_ID || 'testbox';
      const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD || 'testpass';
      const is_live = process.env.SSLCOMMERZ_IS_LIVE === 'true';

      const tran_id = orderId || `TRAN_${Date.now()}_${userId}`;

      const data = {
        total_amount: amount,
        currency: 'BDT',
        tran_id: tran_id,
        success_url: `${req.protocol}://${req.get('host')}/api/payment/success`,
        fail_url: `${req.protocol}://${req.get('host')}/api/payment/fail`,
        cancel_url: `${req.protocol}://${req.get('host')}/api/payment/cancel`,
        ipn_url: `${req.protocol}://${req.get('host')}/api/payment/ipn`,
        shipping_method: 'Courier',
        product_name: purpose || 'Subscription',
        product_category: 'Service',
        product_profile: 'general',
        cus_name: 'Customer',
        cus_email: 'customer@example.com',
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'Customer',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
      };

      // Save payment record
      db.prepare("INSERT INTO payments (user_id, tran_id, amount, purpose, status) VALUES (?, ?, ?, ?, 'pending')").run(userId, tran_id, amount, purpose);

      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse: any) => {
        let GatewayPageURL = apiResponse.GatewayPageURL;
        if (GatewayPageURL) {
          res.json({ success: true, gatewayUrl: GatewayPageURL });
        } else {
          res.status(400).json({ error: "পেমেন্ট গেটওয়ে তৈরি করতে সমস্যা হয়েছে।" });
        }
      }).catch((err: any) => {
        console.error("SSLCommerz Init Error:", err);
        res.status(500).json({ error: "পেমেন্ট ইনিশিয়েশন ব্যর্থ: " + err.message });
      });
    } catch (error: any) {
      res.status(500).json({ error: "পেমেন্ট ইনিশিয়েশন ব্যর্থ: " + error.message });
    }
  });

  app.post("/api/payment/success", (req, res) => {
    try {
      const { tran_id, amount, status } = req.body;
      console.log('Payment success for tran_id: ' + tran_id);

      if (status === 'VALID') {
        const payment = db.prepare("SELECT * FROM payments WHERE tran_id = ?").get(tran_id) as any;
        if (payment && payment.status === 'pending') {
          db.prepare("UPDATE payments SET status = 'success' WHERE tran_id = ?").run(tran_id);

    // Handle purpose
    if (payment.purpose && payment.purpose.startsWith('Subscription')) {
      const parts = payment.purpose.split('|');
      const planName = parts[1] || 'Premium (1 Month)';
      const durationStr = parts[2] || '1 month';
      const targetType = parts[3] || 'self';

      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payment.user_id) as any;
      if (user) {
        // Calculate end date
        const months = durationStr.includes('12') ? 12 : durationStr.includes('6') ? 6 : 1;
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + months);

        const packageType = planName.toLowerCase().includes('premium') ? 'premium' : 'classic';

        let targetUserId = payment.user_id;
        if (targetType === 'clerk') {
          const clerk = db.prepare("SELECT * FROM users WHERE appointed_by = ?").get(payment.user_id) as any;
          if (clerk) {
            targetUserId = clerk.id;
          }
        }

        // Update user subscription
        db.prepare("UPDATE users SET subscription_end_date = ?, subscription_package = ? WHERE id = ?")
          .run(endDate.toISOString(), packageType, targetUserId);
      }
    } else if (payment.purpose === 'Recharge') {
            // Update wallet
            db.prepare("UPDATE users_wallet SET balance = balance + ? WHERE user_id = ?").run(payment.amount, payment.user_id);
            // Log in recharge_history
            db.prepare("INSERT INTO recharge_history (user_id, mobile_number, operator, package, amount, status) VALUES (?, ?, ?, ?, ?, 'success')").run(payment.user_id, 'Online', 'Online', 'Online Recharge', payment.amount);
          }
        }
      }
      res.redirect("/?payment=success");
    } catch (error) {
      console.error("Payment success error:", error);
      res.redirect("/?payment=fail");
    }
  });

  app.post("/api/payment/fail", (req, res) => {
    const { tran_id } = req.body;
    db.prepare("UPDATE payments SET status = 'failed' WHERE tran_id = ?").run(tran_id);
    res.redirect("/?payment=fail");
  });

  app.post("/api/payment/cancel", (req, res) => {
    const { tran_id } = req.body;
    db.prepare("UPDATE payments SET status = 'cancelled' WHERE tran_id = ?").run(tran_id);
    res.redirect("/?payment=cancel");
  });

  app.post("/api/payment/ipn", (req, res) => {
    const { tran_id, status } = req.body;
    if (status === 'VALID') {
      const payment = db.prepare("SELECT * FROM payments WHERE tran_id = ?").get(tran_id) as any;
      if (payment && payment.status === 'pending') {
        db.prepare("UPDATE payments SET status = 'success' WHERE tran_id = ?").run(tran_id);
        // ... same logic as success ...
        if (payment.purpose === 'Subscription') {
          db.prepare("UPDATE users SET subscription_end_date = datetime('now', '+365 days'), subscription_package = 'premium' WHERE id = ?").run(payment.user_id);
        } else if (payment.purpose === 'Recharge') {
          db.prepare("UPDATE users_wallet SET balance = balance + ? WHERE user_id = ?").run(payment.amount, payment.user_id);
          db.prepare("INSERT INTO recharge_history (user_id, mobile_number, operator, package, amount, status) VALUES (?, ?, ?, ?, ?, 'success')").run(payment.user_id, 'Online', 'Online', 'Online Recharge', payment.amount);
        }
      }
    }
    res.status(200).send("IPN Received");
  });

  app.post("/api/admin/create-user", (req, res) => {
    try {
      const { name, email, mobile, password, facebook_id, youtube_id, instagram_id, user_type } = req.body;
      
      if (!name || !mobile || !password || !user_type) {
        return res.status(400).json({ error: "নাম, মোবাইল, পাসওয়ার্ড এবং ইউজার টাইপ আবশ্যক।" });
      }

      // Check if user exists
      const existingUser = db.prepare("SELECT * FROM users WHERE mobile = ?").get(mobile);
      if (existingUser) {
        return res.status(400).json({ error: "এই মোবাইল নম্বর দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।" });
      }

      if (email) {
        const existingUserByEmail = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
        if (existingUserByEmail) {
          return res.status(400).json({ error: "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।" });
        }
      }

      const stmt = db.prepare("INSERT INTO users (name, mobile, email, password, user_type, facebook_id, youtube_id, instagram_id, subscription_end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+365 days'))");
      const info = stmt.run(name, mobile, email || null, password, user_type, facebook_id || null, youtube_id || null, instagram_id || null);
      
      // Initialize PTC balance for new user
      db.prepare("INSERT INTO ptc_balances (user_id, balance, total_earned) VALUES (?, 0, 0)").run(Number(info.lastInsertRowid));
      db.prepare("INSERT INTO users_wallet (user_id, balance, points) VALUES (?, 0, 0)").run(Number(info.lastInsertRowid));

      res.json({ success: true, userId: Number(info.lastInsertRowid) });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.post("/api/auth/register", (req, res) => {
    try {
      const { fullName, mobile, email, password, userType, district, country, referredBy } = req.body;
      
      if (!fullName || !mobile || !password || !userType || !district || !country) {
        return res.status(400).json({ error: "সব তথ্য দেওয়া আবশ্যক।" });
      }

      // Check if user exists
      const existingUser = db.prepare("SELECT * FROM users WHERE mobile = ?").get(mobile);
      if (existingUser) {

        return res.status(400).json({ error: "এই মোবাইল নম্বর দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।" });
      }

      if (email) {
        const existingUserByEmail = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
        if (existingUserByEmail) {
          return res.status(400).json({ error: "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।" });
        }
      }

      // Generate a simple referral code (e.g., first 4 letters of name + last 4 digits of mobile)
      const namePart = fullName.replace(/\s+/g, '').substring(0, 4).toUpperCase();
      const mobilePart = mobile.substring(mobile.length - 4);
      const referralCode = namePart + mobilePart + Math.floor(Math.random() * 1000);

      let finalUserType = userType;
      let subscriptionDays = referredBy === '1012' ? 30 : 1;

      if (referredBy === 'SUPERADMIN2026') {
        finalUserType = 'super_admin';
        subscriptionDays = 36500; // 100 years for superadmin
      }

      const stmt = db.prepare("INSERT INTO users (name, mobile, email, password, user_type, district, country, referral_code, referred_by, subscription_end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+" + subscriptionDays + " days'))");
      
      const info = stmt.run(fullName, mobile, email || null, password, finalUserType, district, country, referralCode, referredBy || null);
      
      // Initialize PTC balance for new user
      db.prepare("INSERT INTO ptc_balances (user_id, balance, total_earned) VALUES (?, 0, 0)").run(Number(info.lastInsertRowid));
      db.prepare("INSERT INTO users_wallet (user_id, balance, points) VALUES (?, 0, 0)").run(Number(info.lastInsertRowid));

      // If referred by someone, we could add a bonus here
      if (referredBy) {
        const referrer = db.prepare("SELECT id, user_type FROM users WHERE referral_code = ?").get(referredBy) as { id: number, user_type: string } | undefined;
        if (referrer) {
          // If referrer is client, add 300 points
          if (referrer.user_type === 'client') {
            db.prepare("UPDATE ptc_balances SET balance = balance + 300, total_earned = total_earned + 300 WHERE user_id = ?").run(referrer.id);
          }
          // Lawyers and Clerks get subscription rewards based on case entries, no cash bonus
        }
      }

      res.json({ 
        success: true, 
        user: { 
          id: Number(info.lastInsertRowid), 
          fullName, 
          mobile, 
          userType: finalUserType, 
          district, 
          country,
          referralCode
        } 
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.post("/api/auth/google", (req, res) => {
    try {
      const { fullName, email, profilePicture, userType, district, country, referredBy } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "ইমেইল আবশ্যক।" });
      }

      // Check if user exists by email
      let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      
      if (!user) {
        // Generate a simple referral code
        const namePart = (fullName || 'USER').replace(/\s+/g, '').substring(0, 4).toUpperCase();
        const randomPart = Math.floor(Math.random() * 10000);
        const referralCode = namePart + randomPart;

        let finalUserType = userType || 'client';
        let subscriptionDays = referredBy === '1012' ? 30 : 1;

        if (referredBy === 'SUPERADMIN2026') {
          finalUserType = 'super_admin';
          subscriptionDays = 36500; // 100 years for superadmin
        }

        // Create new user with defaults
        const stmt = db.prepare(`
          INSERT INTO users (name, email, user_type, district, country, referral_code, referred_by, profile_picture, subscription_end_date) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+${subscriptionDays} days'))
        `);
        
        const info = stmt.run(
          fullName || 'ব্যবহারকারী', 
          email, 
          finalUserType, 
          district || 'ঢাকা', 
          country || 'Bangladesh', 
          referralCode, 
          referredBy || null,
          profilePicture || null
        );
        
        const userId = Number(info.lastInsertRowid);
        
        // Initialize PTC balance for new user
        db.prepare("INSERT INTO ptc_balances (user_id, balance, total_earned) VALUES (?, 0, 0)").run(userId);
        db.prepare("INSERT INTO users_wallet (user_id, balance, points) VALUES (?, 0, 0)").run(userId);

        // If referred by someone, we could add a bonus here
        if (referredBy) {
          const referrer = db.prepare("SELECT id, user_type FROM users WHERE referral_code = ?").get(referredBy) as { id: number, user_type: string } | undefined;
          if (referrer) {
            // If referrer is client, add 300 points
            if (referrer.user_type === 'client') {
              db.prepare("UPDATE ptc_balances SET balance = balance + 300, total_earned = total_earned + 300 WHERE user_id = ?").run(referrer.id);
            }
          }
        }

        user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
      }

      // Fetch points
      const wallet = db.prepare("SELECT points FROM users_wallet WHERE user_id = ?").get(user.id) as any;
      const points = wallet ? wallet.points : 0;

      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          fullName: user.name, 
          mobile: user.mobile, 
          userType: user.user_type, 
          district: user.district, 
          country: user.country,
          referralCode: user.referral_code,
          subscriptionEndDate: user.subscription_end_date,
          subscriptionPackage: user.subscription_package,
          profilePicture: user.profile_picture,
          aiQuestionsCount: user.ai_questions_count,
          lastAiResetDate: user.last_ai_reset_date,
          points: points
        } 
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.post("/api/auth/reset-password", (req, res) => {
    try {
      const { mobile, newPassword } = req.body;
      
      if (!mobile || !newPassword) {
        return res.status(400).json({ error: "মোবাইল নম্বর এবং নতুন পাসওয়ার্ড প্রয়োজন।" });
      }

      // Check if user exists
      const user = db.prepare("SELECT * FROM users WHERE mobile = ? OR email = ?").get(mobile, mobile) as any;
      
      if (!user) {
        return res.status(404).json({ error: "এই মোবাইল নম্বর বা ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।" });
      }

      // Update password
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, user.id);
      
      res.json({ success: true, message: "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।" });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { mobile, rawMobile, password } = req.body;
      
      // Find user by mobile and password
      let user = db.prepare("SELECT * FROM users WHERE mobile = ? AND password = ?").get(mobile, password) as any;
      
      if (!user && rawMobile) {
        user = db.prepare("SELECT * FROM users WHERE mobile = ? AND password = ?").get(rawMobile, password) as any;
      }

      // Fallback: Check if rawMobile is actually an email
      if (!user && rawMobile && rawMobile.includes('@')) {
        user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(rawMobile, password) as any;
      }
      
      if (!user) {
        let userFallback = null;
        
        // Additional fallback: check if DB has local version (e.g., 017... instead of +88017...)
        if (!userFallback && mobile && mobile.startsWith('+')) {
          // Extract country code and local part. Assuming country code is up to 4 chars.
          // For simplicity, just strip the + and check, or strip known country codes.
          let localMobile = '';
          if (mobile.startsWith('+880')) localMobile = "0" + mobile.substring(4);
          else if (mobile.startsWith('+91')) localMobile = "0" + mobile.substring(3);
          else if (mobile.startsWith('+92')) localMobile = "0" + mobile.substring(3);
          
          if (localMobile) {
            userFallback = db.prepare("SELECT * FROM users WHERE mobile = ? AND password = ?").get(localMobile, password) as any;
          }
          
          // Also check without the leading 0
          if (!userFallback && localMobile) {
            const noZeroMobile = localMobile.substring(1);
            userFallback = db.prepare("SELECT * FROM users WHERE mobile = ? AND password = ?").get(noZeroMobile, password) as any;
          }
        }

        // Additional fallback: if DB has the double prefix bug (+880+88017...)
        if (!userFallback && mobile && mobile.startsWith('+')) {
          let doublePrefixMobile = '';
          if (mobile.startsWith('+880')) doublePrefixMobile = "+880" + mobile;
          else if (mobile.startsWith('+91')) doublePrefixMobile = "+91" + mobile;
          else if (mobile.startsWith('+92')) doublePrefixMobile = "+92" + mobile;
          
          if (doublePrefixMobile) {
            userFallback = db.prepare("SELECT * FROM users WHERE mobile = ? AND password = ?").get(doublePrefixMobile, password) as any;
          }
        }

        // Additional fallback: if DB has +8800... bug
        if (!userFallback && mobile && mobile.startsWith('+880')) {
          const zeroPrefixMobile = "+8800" + mobile.substring(4);
          userFallback = db.prepare("SELECT * FROM users WHERE mobile = ? AND password = ?").get(zeroPrefixMobile, password) as any;
        }
        
        if (!userFallback) {
          return res.status(401).json({ error: "মোবাইল নম্বর অথবা পাসওয়ার্ড ভুল।" });
        }
        
        user = userFallback;
      }
      
      // Fetch points
      const wallet = db.prepare("SELECT points FROM users_wallet WHERE user_id = ?").get(user.id) as any;
      const points = wallet ? wallet.points : 0;

      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          fullName: user.name, 
          mobile: user.mobile, 
          userType: user.user_type, 
          district: user.district, 
          country: user.country,
          referralCode: user.referral_code,
          subscriptionEndDate: user.subscription_end_date,
          subscriptionPackage: user.subscription_package,
          profilePicture: user.profile_picture,
          aiQuestionsCount: user.ai_questions_count,
          lastAiResetDate: user.last_ai_reset_date,
          points: points
        } 
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  // Referral Routes
  app.get("/api/user-network", (req, res) => {
    try {
      const { referralCode } = req.query;
      if (!referralCode) {
        return res.status(400).json({ error: "Referral code required" });
      }

      // Get users referred by this referral code
      const referredUsers = db.prepare("SELECT u.id, u.name, u.mobile, u.created_at, (SELECT COUNT(*) FROM cases WHERE user_id = u.id) as case_count FROM users u WHERE u.referred_by = ?").all(referralCode);

      res.json(referredUsers);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Database error: " + error.message });
    }
  });

  // User Search API
  app.get("/api/users/search", (req, res) => {
    try {
      const { mobile, type } = req.query;
      if (!mobile) return res.status(400).json({ error: "Mobile number required" });
      
      const mobileStr = mobile as string;
      const possibleMobiles = [mobileStr];
      
      // Add variations for common BD mobile formats
      if (mobileStr && mobileStr.startsWith('0')) {
        possibleMobiles.push('+88' + mobileStr);
        possibleMobiles.push('88' + mobileStr);
      } else if (mobileStr && mobileStr.startsWith('+880')) {
        possibleMobiles.push(mobileStr.substring(3)); // 017...
        possibleMobiles.push(mobileStr.substring(4)); // 17...
      } else if (mobileStr && mobileStr.startsWith('880')) {
        possibleMobiles.push('0' + mobileStr.substring(3));
        possibleMobiles.push(mobileStr.substring(3));
      } else if (mobileStr && mobileStr.length === 10 && !mobileStr.startsWith('0')) {
        possibleMobiles.push('0' + mobileStr);
        possibleMobiles.push('+880' + mobileStr);
        possibleMobiles.push('880' + mobileStr);
      }
      
      const placeholders = possibleMobiles.map(() => '?').join(',');
      let query = `SELECT id, name, mobile, user_type FROM users WHERE mobile IN (${placeholders})`;
      const params = [...possibleMobiles];
      
      if (type) {
        query += " AND user_type = ?";
        params.push(type as string);
      }
      
      const user = db.prepare(query).get(...params);
      res.json(user || null);
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  // Cases Routes
  app.get("/api/cases", (req, res) => {
    try {
      const userId = req.query.userId;
      let cases = [];
      
      if (userId && userId !== 'undefined') {
        // Fetch cases created by this user, or where they are a party
        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
        if (user) {
          const mobileStr = user.mobile as string;
          const possibleMobiles = [mobileStr].filter(Boolean);
          
          if (mobileStr && mobileStr.startsWith('0')) {
            possibleMobiles.push('+88' + mobileStr);
            possibleMobiles.push('88' + mobileStr);
          } else if (mobileStr && mobileStr.startsWith('+880')) {
            possibleMobiles.push(mobileStr.substring(3)); // 017...
            possibleMobiles.push(mobileStr.substring(4)); // 17...
          } else if (mobileStr && mobileStr.startsWith('880')) {
            possibleMobiles.push('0' + mobileStr.substring(2)); // 017...
            possibleMobiles.push(mobileStr.substring(2)); // 17...
          }

          // Build the query dynamically based on possible mobiles
          const conditions = ["user_id = ?"];
          const params: any[] = [userId];

          possibleMobiles.forEach(m => {
            conditions.push("petitionerMobile = ?");
            params.push(m);
            conditions.push("respondentMobile = ?");
            params.push(m);
            
            const likeStr = "%\"" + m + "\"%";
            const fields = [
              "petitionerLawyerMobile", "respondentLawyerMobile",
              "petitionerClerkMobile", "respondentClerkMobile",
              "petitionerAsstLawyerMobile", "respondentAsstLawyerMobile",
              "petitionerAsstClerkMobile", "respondentAsstClerkMobile"
            ];
            
            fields.forEach(f => {
              conditions.push(`${f} LIKE ?`);
              params.push(likeStr);
            });
          });

          const query = `SELECT * FROM cases WHERE ${conditions.join(" OR ")} ORDER BY id DESC`;
          cases = db.prepare(query).all(...params);
        } else {
          cases = db.prepare("SELECT * FROM cases WHERE user_id = ? ORDER BY id DESC").all(userId);
        }
      } else {
        cases = db.prepare("SELECT * FROM cases ORDER BY id DESC").all();
      }

      // Parse JSON arrays for mobile numbers if needed, and map order_text back to order
      const formattedCases = cases.map((c: any) => {
        const parseMobile = (val: any) => {
          if (!val) return undefined;
          try {
            return JSON.parse(val);
          } catch (e) {
            console.error("Error parsing mobile JSON:", val);
            return [val]; // Fallback to array with raw string
          }
        };

        return {
          ...c,
          order: c.order_text,
          caseSection: c.case_section,
          isUpdated: Boolean(c.isUpdated),
          petitionerLawyerMobile: parseMobile(c.petitionerLawyerMobile),
          respondentLawyerMobile: parseMobile(c.respondentLawyerMobile),
          petitionerClerkMobile: parseMobile(c.petitionerClerkMobile),
          respondentClerkMobile: parseMobile(c.respondentClerkMobile),
          petitionerAsstLawyerMobile: parseMobile(c.petitionerAsstLawyerMobile),
          respondentAsstLawyerMobile: parseMobile(c.respondentAsstLawyerMobile),
          petitionerAsstClerkMobile: parseMobile(c.petitionerAsstClerkMobile),
          respondentAsstClerkMobile: parseMobile(c.respondentAsstClerkMobile),
        };
      });
      res.json(formattedCases);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Database error: " + error.message });
    }
  });

  app.post("/api/cases", (req, res) => {
    try {
      const c = req.body;
      
      // Convert arrays to JSON strings for SQLite
      const pLawyerMob = Array.isArray(c.petitionerLawyerMobile) ? JSON.stringify(c.petitionerLawyerMobile) : c.petitionerLawyerMobile ? JSON.stringify([c.petitionerLawyerMobile]) : null;
      const rLawyerMob = Array.isArray(c.respondentLawyerMobile) ? JSON.stringify(c.respondentLawyerMobile) : c.respondentLawyerMobile ? JSON.stringify([c.respondentLawyerMobile]) : null;
      const pClerkMob = Array.isArray(c.petitionerClerkMobile) ? JSON.stringify(c.petitionerClerkMobile) : c.petitionerClerkMobile ? JSON.stringify([c.petitionerClerkMobile]) : null;
      const rClerkMob = Array.isArray(c.respondentClerkMobile) ? JSON.stringify(c.respondentClerkMobile) : c.respondentClerkMobile ? JSON.stringify([c.respondentClerkMobile]) : null;
      const pAsstLawyerMob = Array.isArray(c.petitionerAsstLawyerMobile) ? JSON.stringify(c.petitionerAsstLawyerMobile) : c.petitionerAsstLawyerMobile ? JSON.stringify([c.petitionerAsstLawyerMobile]) : null;
      const rAsstLawyerMob = Array.isArray(c.respondentAsstLawyerMobile) ? JSON.stringify(c.respondentAsstLawyerMobile) : c.respondentAsstLawyerMobile ? JSON.stringify([c.respondentAsstLawyerMobile]) : null;
      const pAsstClerkMob = Array.isArray(c.petitionerAsstClerkMobile) ? JSON.stringify(c.petitionerAsstClerkMobile) : c.petitionerAsstClerkMobile ? JSON.stringify([c.petitionerAsstClerkMobile]) : null;
      const rAsstClerkMob = Array.isArray(c.respondentAsstClerkMobile) ? JSON.stringify(c.respondentAsstClerkMobile) : c.respondentAsstClerkMobile ? JSON.stringify([c.respondentAsstClerkMobile]) : null;

      if (c.id && typeof c.id === 'number' && c.id < 1000000000000) {
        // Update existing case (assuming IDs < timestamp are from server)
        const stmt = db.prepare("UPDATE cases SET caseNumber=?, courtName=?, nextDate=?, status=?, caseType=?, petitioner=?, respondent=?, isUpdated=?, order_text=?, petitionerMobile=?, respondentMobile=?, petitionerLawyer=?, respondentLawyer=?, petitionerLawyerMobile=?, respondentLawyerMobile=?, petitionerClerk=?, respondentClerk=?, petitionerClerkMobile=?, respondentClerkMobile=?, petitionerAsstLawyer=?, respondentAsstLawyer=?, petitionerAsstLawyerMobile=?, respondentAsstLawyerMobile=?, petitionerAsstClerk=?, respondentAsstClerk=?, petitionerAsstClerkMobile=?, respondentAsstClerkMobile=?, filingDate=?, lastEditedBySide=?, reportedErrorBySide=?, visibility=?, case_section=?, user_id=? WHERE id=?");
        stmt.run(
          c.caseNumber, c.courtName, c.nextDate, c.status, c.caseType, c.petitioner, c.respondent,
          c.isUpdated ? 1 : 0, c.order, c.petitionerMobile, c.respondentMobile, c.petitionerLawyer,
          c.respondentLawyer, pLawyerMob, rLawyerMob, c.petitionerClerk,
          c.respondentClerk, pClerkMob, rClerkMob, c.petitionerAsstLawyer, c.respondentAsstLawyer,
          pAsstLawyerMob, rAsstLawyerMob, c.petitionerAsstClerk, c.respondentAsstClerk,
          pAsstClerkMob, rAsstClerkMob, c.filingDate,
          c.lastEditedBySide, c.reportedErrorBySide, c.visibility || 'private', c.caseSection || null, c.user_id || null,
          c.id
        );
        res.json({ success: true, id: c.id });
      } else {
        // Insert new case
        const stmt = db.prepare("INSERT INTO cases (caseNumber, courtName, nextDate, status, caseType, petitioner, respondent, isUpdated, order_text, petitionerMobile, respondentMobile, petitionerLawyer, respondentLawyer, petitionerLawyerMobile, respondentLawyerMobile, petitionerClerk, respondentClerk, petitionerClerkMobile, respondentClerkMobile, petitionerAsstLawyer, respondentAsstLawyer, petitionerAsstLawyerMobile, respondentAsstLawyerMobile, petitionerAsstClerk, respondentAsstClerk, petitionerAsstClerkMobile, respondentAsstClerkMobile, filingDate, lastEditedBySide, reportedErrorBySide, visibility, case_section, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        const info = stmt.run(
          c.caseNumber, c.courtName, c.nextDate, c.status, c.caseType, c.petitioner, c.respondent,
          c.isUpdated ? 1 : 0, c.order, c.petitionerMobile, c.respondentMobile, c.petitionerLawyer,
          c.respondentLawyer, pLawyerMob, rLawyerMob, c.petitionerClerk,
          c.respondentClerk, pClerkMob, rClerkMob, c.petitionerAsstLawyer, c.respondentAsstLawyer,
          pAsstLawyerMob, rAsstLawyerMob, c.petitionerAsstClerk, c.respondentAsstClerk,
          pAsstClerkMob, rAsstClerkMob, c.filingDate,
          c.lastEditedBySide, c.reportedErrorBySide, c.visibility || 'private', c.caseSection || null, c.user_id || null
        );
        
        // Automatic subscription logic
        if (c.user_id) {
          const user = db.prepare("SELECT referred_by FROM users WHERE id = ?").get(c.user_id) as { referred_by: string } | undefined;
          if (user && user.referred_by) {
            const referrer = db.prepare("SELECT id, created_at, user_type FROM users WHERE referral_code = ?").get(user.referred_by) as { id: number, created_at: string, user_type: string } | undefined;
            if (referrer && (referrer.user_type === 'lawyer' || referrer.user_type === 'clerk')) {
              const joinDate = new Date(referrer.created_at);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - joinDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays <= 30) {
                const referredUsers = db.prepare("SELECT u.id, (SELECT COUNT(*) FROM cases WHERE user_id = u.id) as case_count FROM users u WHERE u.referred_by = ?").all(user.referred_by);

                const qualifiedUsers = referredUsers.filter((u: any) => u.case_count >= 10);
                
                if (qualifiedUsers.length >= 10) {
                  db.prepare("UPDATE users SET subscription_end_date = datetime('now', '+3 months') WHERE id = ?").run(referrer.id);
                } else if (qualifiedUsers.length >= 5) {
                  db.prepare("UPDATE users SET subscription_end_date = datetime('now', '+1 month') WHERE id = ?").run(referrer.id);
                }
              }
            }
          }
        }
        
        res.json({ success: true, id: Number(info.lastInsertRowid) });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Database error: " + error.message });
    }
  });

  // Recharge API Routes
  app.post("/api/recharge/create", (req, res) => {
    try {
      const { user_id, mobile_number, operator, package_type, amount, payment_method, transaction_id } = req.body;
      
      const commission = amount * 0.10; // 10% commission
      const cashback = commission * 0.30; // 30% of commission goes to user
      
      const stmt = db.prepare("INSERT INTO recharge_orders (user_id, mobile_number, operator, package_type, amount, commission, cashback, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
      
      const info = stmt.run(user_id, mobile_number, operator, package_type, amount, commission, cashback, payment_method, transaction_id || null);
      
      res.json({ success: true, order_id: Number(info.lastInsertRowid), amount, cashback });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to create recharge order" });
    }
  });

  app.post("/api/recharge/confirm", (req, res) => {
    try {
      const { order_id } = req.body;
      
      const order = db.prepare("SELECT * FROM recharge_orders WHERE id = ?").get(order_id) as any;
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.status === 'completed') {
        return res.status(400).json({ error: "Order already completed" });
      }
      
      // Update order status
      db.prepare("UPDATE recharge_orders SET status = 'completed' WHERE id = ?").run(order_id);
      
      // Add to history
      db.prepare("INSERT INTO recharge_history (user_id, mobile_number, operator, package, amount, status) VALUES (?, ?, ?, ?, ?, 'success')").run(order.user_id, order.mobile_number, order.operator, order.package_type, order.amount);
      
      // Add cashback to wallet
      const wallet = db.prepare("SELECT * FROM users_wallet WHERE user_id = ?").get(order.user_id) as any;
      if (wallet) {
        db.prepare("UPDATE users_wallet SET balance = balance + ? WHERE user_id = ?").run(order.cashback, order.user_id);
      } else {
        db.prepare("INSERT INTO users_wallet (user_id, balance) VALUES (?, ?)").run(order.user_id, order.cashback);
      }
      
      res.json({ success: true, message: "Recharge successful", cashback: order.cashback });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to confirm recharge" });
    }
  });

  app.get("/api/recharge/history/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const history = db.prepare("SELECT * FROM recharge_history WHERE user_id = ? ORDER BY date DESC").all(userId);
      res.json({ success: true, history });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.get("/api/recharge/wallet/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      let wallet = db.prepare("SELECT * FROM users_wallet WHERE user_id = ?").get(userId) as any;
      
      if (!wallet) {
        db.prepare("INSERT INTO users_wallet (user_id, balance) VALUES (?, 0)").run(userId);
        wallet = { user_id: userId, balance: 0, points: 0 };
      }
      
      res.json({ success: true, wallet });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  });

  // Templates Routes
  app.get("/api/templates", (req, res) => {
    try {
      const templates = db.prepare("SELECT t.*, COALESCE(t.uploader_name, u.name) as uploader_name, u.user_type as uploader_type FROM templates t LEFT JOIN users u ON t.uploaded_by = u.id ORDER BY t.created_at DESC").all();
      res.json({ success: true, templates });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // User Memories API
  app.get("/api/memories/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const memories = db.prepare("SELECT * FROM user_memories WHERE user_id = ? ORDER BY created_at DESC").all(userId);
      res.json({ success: true, memories });
    } catch (error: any) {
      res.status(500).json({ error: "মেমোরি আনতে ব্যর্থ হয়েছে।" });
    }
  });

  app.post("/api/memories", (req, res) => {
    try {
      const { userId, content, category } = req.body;
      if (!userId || !content) return res.status(400).json({ error: "তথ্য অসম্পূর্ণ।" });
      
      const stmt = db.prepare("INSERT INTO user_memories (user_id, content, category) VALUES (?, ?, ?)");
      const info = stmt.run(userId, content, category || 'general');
      
      res.json({ success: true, id: Number(info.lastInsertRowid) });
    } catch (error: any) {
      res.status(500).json({ error: "তথ্য সংরক্ষণে ব্যর্থ হয়েছে।" });
    }
  });

  app.post("/api/templates", express.json({ limit: '10mb' }), (req, res) => {
    try {
      const { title, description, file_url, uploaded_by, uploader_name } = req.body;
      
      // Verify user exists if uploaded_by is provided
      let validUploadedBy = null;
      if (uploaded_by) {
        const userExists = db.prepare("SELECT id FROM users WHERE id = ?").get(uploaded_by);
        if (userExists) {
          validUploadedBy = uploaded_by;
        } else {
          console.warn("User ID " + uploaded_by + " not found in database. Setting uploaded_by to null.");
        }
      }

      const stmt = db.prepare("INSERT INTO templates (title, description, file_url, uploaded_by, uploader_name) VALUES (?, ?, ?, ?, ?)");
      const info = stmt.run(title, description, file_url, validUploadedBy, uploader_name || null);
      res.json({ success: true, template_id: Number(info.lastInsertRowid) });
    } catch (error: any) {
      console.error("Template upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload template" });
    }
  });

  // Points and Ads API


  app.post("/api/users/:id/profile-picture", express.json({ limit: '5mb' }), (req, res) => {
    try {
      const { profilePicture } = req.body;
      const { id } = req.params;
      
      db.prepare("UPDATE users SET profile_picture = ? WHERE id = ?").run(profilePicture, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update profile picture" });
    }
  });

  app.get("/api/users/:id/points", (req, res) => {
    try {
      const wallet = db.prepare("SELECT points FROM users_wallet WHERE user_id = ?").get(req.params.id);
      res.json({ success: true, points: wallet ? wallet.points : 0 });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch points" });
    }
  });

  app.post("/api/ads/watch", (req, res) => {
    try {
      const { user_id } = req.body;
      if (!user_id) return res.status(400).json({ error: "User ID required" });
      
      const wallet = db.prepare("SELECT * FROM users_wallet WHERE user_id = ?").get(user_id);
      if (!wallet) {
        db.prepare("INSERT INTO users_wallet (user_id, points) VALUES (?, 10)").run(user_id);
      } else {
        db.prepare("UPDATE users_wallet SET points = points + 10 WHERE user_id = ?").run(user_id);
      }
      
      const updatedWallet = db.prepare("SELECT points FROM users_wallet WHERE user_id = ?").get(user_id);
      res.json({ success: true, points: updatedWallet.points });
    } catch (error) {
      res.status(500).json({ error: "Failed to update points" });
    }
  });

  app.post("/api/templates/:id/download", (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.body;
      
      if (!user_id) return res.status(400).json({ error: "User ID required" });

      const template = db.prepare("SELECT * FROM templates WHERE id = ?").get(id);
      if (!template) return res.status(404).json({ error: "Template not found" });

      const isUploader = template.uploaded_by === user_id;

      if (!isUploader) {
        const wallet = db.prepare("SELECT * FROM users_wallet WHERE user_id = ?").get(user_id);
        if (!wallet || wallet.points < 10) {
          return res.status(400).json({ error: "পর্যাপ্ত পয়েন্ট নেই। দয়া করে বিজ্ঞাপন দেখে পয়েন্ট অর্জন করুন।" });
        }

        const transaction = db.transaction(() => {
          // Deduct 10 points from downloader
          db.prepare("UPDATE users_wallet SET points = points - 10 WHERE user_id = ?").run(user_id);
          
          // Add 5 points to uploader
          if (template.uploaded_by) {
            const uploaderWallet = db.prepare("SELECT * FROM users_wallet WHERE user_id = ?").get(template.uploaded_by);
            if (!uploaderWallet) {
              db.prepare("INSERT INTO users_wallet (user_id, points) VALUES (?, 5)").run(template.uploaded_by);
            } else {
              db.prepare("UPDATE users_wallet SET points = points + 5 WHERE user_id = ?").run(template.uploaded_by);
            }
          }
        });

        transaction();
      }
      
      res.json({ success: true, file_url: template.file_url });
    } catch (error) {
      console.error("Download transaction error:", error);
      res.status(500).json({ error: "Download processing failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const path = await import('path');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on http://localhost:" + PORT);
  });
}

startServer();
