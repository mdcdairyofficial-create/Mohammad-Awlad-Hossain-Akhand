import express from "express";
import { createServer as createViteServer } from "vite";
import SSLCommerzPayment from "sslcommerz-lts";
import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin
let firestore: admin.firestore.Firestore;
try {
  const firebaseConfigPath = "./firebase-applet-config.json";
  let firebaseConfig = { projectId: "gen-lang-client-0215506885", firestoreDatabaseId: "" };
  
  if (fs.existsSync(firebaseConfigPath)) {
    const rawConfig = fs.readFileSync(firebaseConfigPath, "utf8");
    firebaseConfig = JSON.parse(rawConfig);
    console.log(`[Firebase] Loaded config from file. ProjectId: ${firebaseConfig.projectId}, DbId: ${firebaseConfig.firestoreDatabaseId}`);
  } else {
    console.warn(`[Firebase] Config file NOT found at ${firebaseConfigPath}, using defaults.`);
  }

  const effectiveProjectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT || firebaseConfig.projectId;
  const dbId = process.env.FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;
  
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: effectiveProjectId
    });
  }

  if (dbId && dbId !== "" && dbId !== "(default)") {
    firestore = getFirestore(dbId);
  } else {
    firestore = getFirestore();
  }
} catch (err) {
  console.error("Firebase Admin initialization error:", err);
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: "gen-lang-client-0215506885" });
  }
  firestore = admin.firestore();
}

const db = firestore; // Alias for convenience

// Authentication Middleware
const authenticate = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    
    // Fetch profile from Firestore
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    if (userDoc.exists) {
      req.profile = { id: userDoc.id, ...userDoc.data() };
    }
    
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    res.status(403).json({ error: "Unauthorized: Invalid token" });
  }
};

// No SQLite needed anymore
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.get("/api/users/:id", authenticate, async (req: any, res) => {
    try {
      const userId = req.params.id; // Now a string (doc ID)
      const firebaseUid = req.user.uid;

      // Ensure user is only accessing their own profile OR is an admin
      const isAdmin = ['admin', 'super_admin', 'country_manager'].includes(req.profile?.user_type || '');
      
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data() as any;

      if (userData.firebase_uid !== firebaseUid && !isAdmin) {
        return res.status(403).json({ error: "Forbidden: Access denied" });
      }

      res.json({
        id: userDoc.id,
        firebaseUid: userData.firebase_uid,
        fullName: userData.name,
        email: userData.email,
        mobile: userData.mobile,
        userType: userData.user_type,
        district: userData.district,
        country: userData.country,
        referralCode: userData.referral_code,
        referredBy: userData.referred_by,
        subscriptionEndDate: userData.subscription_end_date,
        subscriptionPackage: userData.subscription_package,
        profilePicture: userData.profile_picture,
        aiQuestionsCount: userData.ai_questions_count,
        lastAiResetDate: userData.last_ai_reset_date,
        chamberAddress: userData.chamber_address,
        officeHours: userData.office_hours,
        barAssociation: userData.bar_association,
        membershipId: userData.membership_id,
        facebookUrl: userData.facebook_url,
        linkedinUrl: userData.linkedin_url,
        points: userData.points || 0,
        walletBalance: userData.wallet_balance || 0
      });
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });


  // Recharge Routes
  app.post("/api/recharge/request", authenticate, async (req: any, res) => {
    try {
      const { mobileNumber, operator, amount, paymentMethod, transactionId } = req.body;
      const userId = req.profile?.id;

      if (!userId) return res.status(404).json({ error: "ইউজার প্রোফাইল পাওয়া যায়নি।" });
      
      await db.collection("recharge_orders").add({
        user_id: userId,
        mobile_number: mobileNumber,
        operator: operator,
        amount: Number(amount),
        payment_method: paymentMethod,
        transaction_id: transactionId,
        status: 'pending',
        created_at: FieldValue.serverTimestamp()
      });
      
      res.json({ success: true, message: "রিচার্জ রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে।" });
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.get("/api/recharge/history/:userId", authenticate, async (req: any, res) => {
    try {
      const targetUserId = req.params.userId;
      const isAdmin = ['admin', 'super_admin', 'country_manager'].includes(req.profile?.user_type || '');

      if (req.profile?.id !== targetUserId && !isAdmin) {
        return res.status(403).json({ error: "ব্যক্তিগত তথ্য দেখার অনুমতি নেই।" });
      }

      const snapshot = await db.collection("recharge_orders")
        .where("user_id", "==", targetUserId)
        .orderBy("created_at", "desc")
        .get();

      const history = snapshot.docs.map(doc => {
        const h = doc.data();
        let operatorId = 'gp';
        const op = (h.operator || '').toLowerCase();
        if (op.includes('robi')) operatorId = 'robi';
        else if (op.includes('banglalink') || op.includes('bl')) operatorId = 'bl';
        else if (op.includes('teletalk')) operatorId = 'teletalk';
        else if (op.includes('airtel')) operatorId = 'airtel';
        
        return {
          id: doc.id,
          ...h,
          date: h.created_at?.toDate ? h.created_at.toDate() : h.created_at,
          package: h.package_type,
          operator: operatorId
        };
      });
      res.json({ success: true, history });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

app.post('/api/subscription/request', async (req, res) => {
  const { mobile, planName, amount, duration, paymentMethod, transactionId, targetType } = req.body;
  
  if (!mobile || !planName || !amount || !duration || !paymentMethod || !transactionId || !targetType) {
    return res.status(400).json({ error: 'সব তথ্য দেওয়া আবশ্যক।' });
  }

  try {
    const existingScan = await db.collection("subscription_requests")
      .where("transaction_id", "==", transactionId)
      .limit(1)
      .get();

    if (!existingScan.empty) {
      return res.status(400).json({ error: 'এই ট্রাঞ্জেকশন আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে।' });
    }

    await db.collection("subscription_requests").add({
      user_mobile: mobile,
      plan_name: planName,
      amount: Number(amount),
      duration: duration,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      target_type: targetType,
      status: 'pending',
      created_at: FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: 'আপনার রিকোয়েস্টটি জমা হয়েছে। অ্যাডমিন যাচাই করে দ্রুত অ্যাপ্রুভ করবেন।' });
  } catch (err) {
    console.error('Error saving subscription request:', err);
    res.status(500).json({ error: 'সার্ভার এরর। আবার চেষ্টা করুন।' });
  }
});

  app.put("/api/users/:id", authenticate, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const isAdmin = ['admin', 'super_admin', 'country_manager'].includes(req.profile?.user_type || '');

      if (req.profile?.id !== userId && !isAdmin) {
        return res.status(403).json({ error: "প্রোফাইল আপডেট করার অনুমতি নেই।" });
      }

      const { fullName, mobile, district, chamberAddress, officeHours, barAssociation, membershipId, socialLinks } = req.body;
      const updateData: any = {};
      if (fullName !== undefined) updateData.name = fullName || 'ব্যবহারকারী';
      if (mobile !== undefined) updateData.mobile = mobile;
      if (district !== undefined) updateData.district = district;
      if (chamberAddress !== undefined) updateData.chamber_address = chamberAddress;
      if (officeHours !== undefined) updateData.office_hours = officeHours;
      if (barAssociation !== undefined) updateData.bar_association = barAssociation;
      if (membershipId !== undefined) updateData.membership_id = membershipId;
      if (socialLinks?.facebook !== undefined) updateData.facebook_url = socialLinks.facebook;
      if (socialLinks?.linkedin !== undefined) updateData.linkedin_url = socialLinks.linkedin;

      if (Object.keys(updateData).length > 0) {
        await db.collection("users").doc(userId).update(updateData);
      }
      res.json({ success: true, message: "Profile updated successfully" });
    } catch (err: any) {
      console.error('Error updating user profile:', err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });


  app.put("/api/users/:id/password", authenticate, async (req: any, res) => {
    try {
      const userId = req.params.id;
      if (req.profile?.id !== userId) {
        return res.status(403).json({ error: "পাসওয়ার্ড পরিবর্তনের অনুমতি নেই।" });
      }

      const { newPassword } = req.body;
      if (!newPassword) {
        return res.status(400).json({ error: "New password is required" });
      }

      await db.collection("users").doc(userId).update({ password: newPassword });

      res.json({ success: true, message: "Password updated successfully" });
    } catch (err: any) {
      console.error('Error updating password:', err);
      res.status(500).json({ error: 'Failed to update password' });
    }
  });

  app.post("/api/users/increment-ai-usage", authenticate, async (req: any, res) => {
    try {
      const { deductPoints } = req.body;
      const userId = req.profile?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) return res.status(404).json({ error: "ইউজার পাওয়া যায়নি।" });
      const user = userDoc.data() as any;

      if (deductPoints) {
        if ((user.points || 0) < 10) {
          return res.status(400).json({ error: "পর্যাপ্ত পয়েন্ট নেই।" });
        }
        await db.collection("users").doc(userId).update({
          points: FieldValue.increment(-10)
        });
      } else {
        const lastReset = user.last_ai_reset_date?.toDate ? user.last_ai_reset_date.toDate() : user.last_ai_reset_date ? new Date(user.last_ai_reset_date) : new Date(0);
        const now = new Date();
        
        if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
          await db.collection("users").doc(userId).update({
            ai_questions_count: 1,
            last_ai_reset_date: FieldValue.serverTimestamp()
          });
        } else {
          await db.collection("users").doc(userId).update({
            ai_questions_count: FieldValue.increment(1)
          });
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Middleware
  app.use("/api/admin", authenticate, (req: any, res, next) => {
    const profile = req.profile;
    if (!profile) {
      return res.status(404).json({ error: "ইউজার প্রোফাইল পাওয়া যায়নি।" });
    }
    if (!['admin', 'super_admin', 'country_manager', 'bar_admin'].includes(profile.user_type)) {
      return res.status(403).json({ error: "অ্যাডমিন অ্যাক্সেস প্রয়োজন।" });
    }
    next();
  });

  // Superadmin Appointment Endpoint
  app.post("/api/admin/appoint-district-admin", async (req: any, res) => {
    try {
      const { targetUserId, district } = req.body;
      const adminProfile = req.profile;

      if (adminProfile.user_type !== 'super_admin') {
        return res.status(403).json({ error: "শুধুমাত্র সুপার অ্যাডমিন এই কাজটি করতে পারবেন।" });
      }

      const existingAdmins = await db.collection("users")
        .where("user_type", "==", "admin")
        .where("district", "==", district)
        .limit(1)
        .get();

      if (!existingAdmins.empty) {
        return res.status(400).json({ error: "এই জেলায় ইতিমধ্যে একজন অ্যাডমিন নিযুক্ত আছেন।" });
      }

      await db.collection("users").doc(targetUserId).update({
        user_type: 'admin',
        appointed_by: adminProfile.id,
        subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        ai_questions_count: 0,
        last_ai_reset_date: FieldValue.serverTimestamp()
      });

      res.json({ success: true, message: "অ্যাডমিন সফলভাবে নিযুক্ত করা হয়েছে।" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Affiliate Proofs API
  app.post("/api/affiliate/proof", authenticate, async (req: any, res) => {
    try {
      const { link_id, screenshot_url } = req.body;
      const user_id = req.profile?.id;

      if (!user_id || !link_id || !screenshot_url) {
        return res.status(400).json({ error: "তথ্য অসম্পূর্ণ।" });
      }

      const docRef = await db.collection("affiliate_proofs").add({
        user_id,
        link_id,
        screenshot_url,
        status: 'pending',
        created_at: FieldValue.serverTimestamp()
      });
      
      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      console.error("Error inserting proof:", error);
      res.status(500).json({ error: "প্রমাণ জমা দিতে ব্যর্থ হয়েছে। " + error.message });
    }
  });

  app.get("/api/admin/affiliate-proofs", async (req, res) => {
    try {
      const snapshot = await db.collection("affiliate_proofs")
        .orderBy("created_at", "desc")
        .get();
      
      const proofs = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const userDoc = await db.collection("users").doc(data.user_id).get();
        const userData = userDoc.data() as any;
        return {
          id: doc.id,
          ...data,
          user_name: userData?.name || 'Unknown',
          user_mobile: userData?.mobile || 'Unknown',
          created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at
        };
      }));

      res.json({ success: true, proofs });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "প্রমাণ আনতে ব্যর্থ হয়েছে।" });
    }
  });

  app.post("/api/admin/affiliate-proofs/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const proofDoc = await db.collection("affiliate_proofs").doc(id).get();
      const proof = proofDoc.data() as any;
      
      if (!proofDoc.exists || proof.status !== 'pending') {
        return res.status(400).json({ error: "Invalid proof or already processed" });
      }

      await db.runTransaction(async (transaction) => {
        const userRef = db.collection("users").doc(proof.user_id);
        const proofRef = db.collection("affiliate_proofs").doc(id);

        transaction.update(proofRef, { status: 'approved' });
        transaction.update(userRef, {
          points: FieldValue.increment(100)
        });
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to approve proof" });
    }
  });

  app.post("/api/admin/affiliate-proofs/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection("affiliate_proofs").doc(id).update({ status: 'rejected' });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to reject proof" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const userCountSnapshot = await db.collection("users").count().get();
      const caseCountSnapshot = await db.collection("cases").count().get();
      const rechargeCountSnapshot = await db.collection("recharge_orders").count().get();
      
      const lawyerCountSnapshot = await db.collection("users").where("user_type", "==", "lawyer").count().get();
      const adminCountSnapshot = await db.collection("users").where("user_type", "==", "admin").count().get();

      res.json({
        totalUsers: userCountSnapshot.data().count,
        totalCases: caseCountSnapshot.data().count,
        rechargeStats: { total: rechargeCountSnapshot.data().count },
        userBreakdown: [
          { user_type: 'lawyer', count: lawyerCountSnapshot.data().count },
          { user_type: 'admin', count: adminCountSnapshot.data().count }
        ]
      });
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.get("/api/admin/cases", async (req, res) => {
    try {
      const snapshot = await db.collection("cases")
        .orderBy("created_at", "desc")
        .limit(100)
        .get();
      
      const cases = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const userDoc = await db.collection("users").doc(data.user_id).get();
        return {
          id: doc.id,
          ...data,
          lawyer_name: userDoc.data()?.name || 'Unknown'
        };
      }));

      res.json(cases);
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

app.get('/api/admin/subscription-requests', async (req, res) => {
  try {
    const snapshot = await db.collection("subscription_requests")
      .where("status", "==", "pending")
      .orderBy("created_at", "desc")
      .get();
    
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(requests);
  } catch (err) {
    console.error('Error fetching subscription requests:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/admin/subscription-requests/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const requestDoc = await db.collection("subscription_requests").doc(id).get();
    if (!requestDoc.exists) return res.status(404).json({ error: 'Request not found' });
    const request = requestDoc.data() as any;

    const userQuery = await db.collection("users").where("mobile", "==", request.user_mobile).limit(1).get();
    if (userQuery.empty) return res.status(404).json({ error: 'User not found' });
    const userDoc = userQuery.docs[0];
    const user = userDoc.data() as any;

    const months = request.duration.includes('12') ? 12 : request.duration.includes('6') ? 6 : 1;
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const packageType = (request.plan_name || '').toLowerCase().includes('premium') ? 'premium' : 'classic';

    let targetUserId = userDoc.id;
    if (request.target_type === 'clerk') {
      const clerkQuery = await db.collection("users").where("appointed_by", "==", userDoc.id).limit(1).get();
      if (!clerkQuery.empty) {
        targetUserId = clerkQuery.docs[0].id;
      }
    }

    await db.collection("users").doc(targetUserId).update({
      subscription_package: packageType,
      subscription_end_date: endDate.toISOString()
    });

    await db.collection("subscription_requests").doc(id).update({ status: 'approved' });

    res.json({ success: true });
  } catch (err) {
    console.error('Error approving subscription:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/admin/subscription-requests/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection("subscription_requests").doc(id).update({ status: 'rejected' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error rejecting subscription:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

  app.get("/api/admin/recharge-requests", async (req, res) => {
    try {
      const snapshot = await db.collection("recharge_orders")
        .where("status", "==", "pending")
        .get();
      
      const requests = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const userDoc = await db.collection("users").doc(data.user_id).get();
        return {
          id: doc.id,
          ...data,
          user_name: userDoc.data()?.name || 'Unknown'
        };
      }));

      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const snapshot = await db.collection("users")
        .orderBy("created_at", "desc")
        .limit(200)
        .get();
      
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          mobile: data.mobile,
          user_type: data.user_type,
          created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
          subscription_package: data.subscription_package,
          subscription_end_date: data.subscription_end_date,
          wallet_balance: data.wallet_balance || 0
        };
      });
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.put("/api/admin/users/:id/subscription", async (req, res) => {
    try {
      const { id } = req.params;
      const { package: pkg, days } = req.body;
      
      const validPackages = ['free', 'classic', 'premium'];
      if (!validPackages.includes(pkg)) {
        return res.status(400).json({ error: "Invalid package" });
      }

      const now = new Date();
      const newEndDate = new Date(now.getTime() + (days || 30) * 24 * 60 * 60 * 1000);

      await db.collection("users").doc(id).update({
        subscription_package: pkg,
        subscription_end_date: newEndDate.toISOString()
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.put("/api/admin/users/:id/role", async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      const validRoles = ['admin', 'bar_admin', 'lawyer', 'clerk', 'client'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      await db.collection("users").doc(id).update({ user_type: role });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.post("/api/admin/recharge-approve", async (req, res) => {
    try {
      const { orderId, status } = req.body;
      
      const orderDoc = await db.collection("recharge_orders").doc(orderId).get();
      if (!orderDoc.exists) return res.status(404).json({ error: "অর্ডার পাওয়া যায়নি।" });
      const order = orderDoc.data() as any;
      
      if (status === 'approved') {
        if (order.status === 'completed' || order.status === 'approved') {
          return res.status(400).json({ error: "অর্ডারটি ইতিমধ্যে সম্পন্ন হয়েছে।" });
        }
        
        await db.collection("recharge_orders").doc(orderId).update({ status: 'approved' });
        
        if (order.operator === 'subscription' || (order.package_type || '').toLowerCase().includes('subscription')) {
          const userDoc = await db.collection("users").doc(order.user_id).get();
          const user = userDoc.data() as any;
          let newEndDate;
          const now = new Date();
          
          if (user && user.subscription_end_date) {
            const currentEnd = new Date(user.subscription_end_date);
            const baseDate = currentEnd > now ? currentEnd : now;
            newEndDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          } else {
            newEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          }
          
          await db.collection("users").doc(order.user_id).update({ subscription_end_date: newEndDate.toISOString() });
        } else {
          // Add to wallet balance
          await db.collection("users").doc(order.user_id).update({
            wallet_balance: FieldValue.increment(order.cashback || 0)
          });
        }
      } else {
        await db.collection("recharge_orders").doc(orderId).update({ status: 'rejected' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.post("/api/admin/reset-all", async (req, res) => {
    try {
      console.log("Resetting all data in Firestore...");
      const collections = ["recharge_orders", "affiliate_proofs", "subscription_requests", "cases", "users"];
      
      for (const coll of collections) {
        const snapshot = await db.collection(coll).get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
      
      res.json({ success: true, message: "সকল ডাটা সফলভাবে মুছে ফেলা হয়েছে।" });
    } catch (error: any) {
      console.error("Error resetting data:", error);
      res.status(500).json({ error: "ডাটা মুছতে ব্যর্থ: " + error.message });
    }
  });

  // SSLCommerz Payment Routes
  app.post("/api/payment/initiate", async (req, res) => {
    try {
      const { userId, amount, orderId, purpose } = req.body;
      
      const store_id = process.env.SSLCOMMERZ_STORE_ID || 'testbox';
      const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD || 'qwerty';
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
        cus_city: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
      };

      // Save payment record in Firestore
      await db.collection("payments").doc(tran_id).set({
        user_id: userId,
        tran_id: tran_id,
        amount: Number(amount),
        purpose: purpose,
        status: 'pending',
        created_at: FieldValue.serverTimestamp()
      });

      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      
      sslcz.init(data).then((apiResponse: any) => {
        let GatewayPageURL = apiResponse.GatewayPageURL;
        if (GatewayPageURL) {
          res.json({ success: true, gatewayUrl: GatewayPageURL });
        } else {
          res.status(400).json({ error: "পেমেন্ট গেটওয়ে এরর: " + (apiResponse.failedreason || 'Gateway initialization failed') });
        }
      }).catch((err: any) => {
        res.status(500).json({ error: "পেমেন্ট ইনিশিয়েশন ব্যর্থ: " + err.message });
      });
    } catch (error: any) {
      res.status(500).json({ error: "পেমেন্ট ইনিশিয়েশন ব্যর্থ: " + error.message });
    }
  });

  app.post("/api/payment/success", async (req, res) => {
    try {
      const { tran_id, amount, status } = req.body;

      if (status === 'VALID') {
        const paymentDoc = await db.collection("payments").doc(tran_id).get();
        const payment = paymentDoc.data() as any;
        
        if (paymentDoc.exists && payment.status === 'pending') {
          await db.collection("payments").doc(tran_id).update({ status: 'success' });

          if (payment.purpose && payment.purpose.toLowerCase().includes('subscription')) {
            const durationStr = payment.purpose.split('_')[1] || '1 month';
            const months = durationStr.includes('12') ? 12 : durationStr.includes('6') ? 6 : 1;
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + months);

            await db.collection("users").doc(payment.user_id).update({
              subscription_end_date: endDate.toISOString(),
              subscription_package: 'premium'
            });
          } else if (payment.purpose === 'Recharge') {
            await db.collection("users").doc(payment.user_id).update({
              wallet_balance: FieldValue.increment(payment.amount)
            });
          }
        }
      }
      res.redirect("/?payment=success");
    } catch (error) {
      console.error(error);
      res.redirect("/?payment=fail");
    }
  });

  app.post("/api/payment/fail", async (req, res) => {
    try {
      const { tran_id } = req.body;
      if (tran_id) {
        await db.collection("payments").doc(tran_id).update({ status: 'failed' });
      }
      res.redirect("/?payment=fail");
    } catch (error) {
      res.redirect("/?payment=fail");
    }
  });

  app.post("/api/payment/cancel", async (req, res) => {
    try {
      const { tran_id } = req.body;
      if (tran_id) {
        await db.collection("payments").doc(tran_id).update({ status: 'cancelled' });
      }
      res.redirect("/?payment=cancel");
    } catch (error) {
      res.redirect("/?payment=cancel");
    }
  });

  app.post("/api/payment/ipn", async (req, res) => {
    try {
      const { tran_id, status, amount } = req.body;
      if (status === 'VALID' && tran_id) {
        const paymentDoc = await db.collection("payments").doc(tran_id).get();
        const payment = paymentDoc.data() as any;
        
        if (paymentDoc.exists && payment.status === 'pending') {
          await db.collection("payments").doc(tran_id).update({ status: 'success' });
          
          if (payment.purpose && payment.purpose.toLowerCase().includes('subscription')) {
            const durationStr = payment.purpose.split('_')[1] || '1 month';
            const months = durationStr.includes('12') ? 12 : durationStr.includes('6') ? 6 : 1;
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + months);

            await db.collection("users").doc(payment.user_id).update({
              subscription_end_date: endDate.toISOString(),
              subscription_package: 'premium'
            });
          } else if (payment.purpose === 'Recharge') {
            await db.collection("users").doc(payment.user_id).update({
              wallet_balance: FieldValue.increment(payment.amount)
            });
          }
        }
      }
      res.status(200).send("IPN Received");
    } catch (error) {
      console.error("IPN Error:", error);
      res.status(500).send("IPN Error");
    }
  });

  app.post("/api/auth/firebase-sync", async (req, res) => {
    try {
      const { firebaseUid, email, mobile, fullName, profilePicture, userType, district, country } = req.body;
      if (!firebaseUid) return res.status(400).json({ error: "UID missing" });

      const usersRef = db.collection("users");
      const query = await usersRef.where("firebase_uid", "==", firebaseUid).limit(1).get();
      let userDoc = query.empty ? null : query.docs[0];
      
      // SUPER ADMIN BOOTSTRAP: mdcdairy.official@gmail.com
      const isSuperAdminEmail = email === 'mdcdairy.official@gmail.com';

      if (!userDoc) {
        // Find existing user by mobile or email
        if (mobile) {
          const mQuery = await usersRef.where("mobile", "==", mobile).limit(1).get();
          if (!mQuery.empty) userDoc = mQuery.docs[0];
        }
        if (!userDoc && email) {
          const eQuery = await usersRef.where("email", "==", email).limit(1).get();
          if (!eQuery.empty) userDoc = eQuery.docs[0];
        }

        if (userDoc) {
          // Link existing user to firebase_uid
          const updates: any = { firebase_uid: firebaseUid };
          if (userType) updates.user_type = userType;
          if (isSuperAdminEmail) {
            updates.user_type = 'super_admin';
            updates.subscription_end_date = new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000).toISOString();
          }
          await userDoc.ref.update(updates);
          const fresh = await userDoc.ref.get();
          userDoc = fresh;
        } else {
          // Auto-register
          const namePart = (fullName || 'USER').replace(/\s+/g, '').substring(0, 4).toUpperCase();
          const referralCode = namePart + Math.floor(Math.random() * 10000);
          let finalUserType = userType || 'client';
          let subscriptionDays = 1;

          if (isSuperAdminEmail) {
            finalUserType = 'super_admin';
            subscriptionDays = 36500;
          }

          const newUser = {
            firebase_uid: firebaseUid,
            name: fullName || 'ব্যবহারকারী',
            email: email || null,
            mobile: mobile || null,
            user_type: finalUserType,
            district: district || 'ঢাকা',
            country: country || 'Bangladesh',
            referral_code: referralCode,
            profile_picture: profilePicture || null,
            is_approved: 1,
            subscription_end_date: new Date(Date.now() + subscriptionDays * 24 * 60 * 60 * 1000).toISOString(),
            created_at: FieldValue.serverTimestamp(),
            points: 0,
            wallet_balance: 0
          };
          
          const docRef = await usersRef.add(newUser);
          userDoc = await docRef.get();
        }
      } else {
        // User exists by firebase_uid, check if promotion needed
        const data = userDoc.data() as any;
        const updates: any = {};
        if (isSuperAdminEmail && data.user_type !== 'super_admin') {
          updates.user_type = 'super_admin';
          updates.subscription_end_date = new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000).toISOString();
        } else if (userType && data.user_type !== userType) {
          updates.user_type = userType;
        }
        
        if (Object.keys(updates).length > 0) {
          await userDoc.ref.update(updates);
          userDoc = await userDoc.ref.get();
        }
      }

      const userData = userDoc.data() as any;
      res.json({ 
        success: true, 
        user: { 
          id: userDoc.id,
          ...userData,
          firebaseUid: userData.firebase_uid,
          fullName: userData.name,
          userType: userData.user_type,
          subscriptionEndDate: userData.subscription_end_date
        } 
      });
    } catch (error: any) {
      console.error("[Auth Sync Error]", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { firebaseUid, fullName, mobile, email, password, userType, district, thana, country, referredBy } = req.body;
      
      if (!fullName || !mobile || !password || !userType || !district || !country) {
        return res.status(400).json({ error: "সব তথ্য দেওয়া আবশ্যক।" });
      }

      const usersRef = db.collection("users");
      // Check if user exists by mobile, email or firebaseUid
      let existingQuery;
      if (mobile) existingQuery = await usersRef.where("mobile", "==", mobile).limit(1).get();
      if ((!existingQuery || existingQuery.empty) && email) existingQuery = await usersRef.where("email", "==", email).limit(1).get();
      if ((!existingQuery || existingQuery.empty) && firebaseUid) existingQuery = await usersRef.where("firebase_uid", "==", firebaseUid).limit(1).get();
      
      if (existingQuery && !existingQuery.empty) {
        const userDoc = existingQuery.docs[0];
        const userData = userDoc.data() as any;
        if (firebaseUid && !userData.firebase_uid) {
           await userDoc.ref.update({ firebase_uid: firebaseUid });
           return res.json({ success: true, user: { id: userDoc.id, ...userData, firebase_uid: firebaseUid, fullName: userData.name, userType: userData.user_type } });
        }
        return res.status(400).json({ error: "অ্যাকাউন্ট ইতিমধ্যে বিদ্যমান।" });
      }

      const namePart = fullName.replace(/\s+/g, '').substring(0, 4).toUpperCase();
      const mobilePart = mobile.substring(mobile.length - 4);
      const referralCode = namePart + mobilePart + Math.floor(Math.random() * 1000);

      let finalUserType = userType;
      let subscriptionDays = referredBy === '1012' ? 30 : 1;
      
      if (referredBy === 'SUPERADMIN2026' || email === 'mdcdairy.official@gmail.com') {
        finalUserType = 'super_admin';
        subscriptionDays = 36500;
      }

      const newUser = {
        firebase_uid: firebaseUid || null,
        name: fullName,
        mobile: mobile,
        email: email || null,
        password: password, // For legacy support
        user_type: finalUserType,
        district: district,
        thana: thana || null,
        country: country,
        referral_code: referralCode,
        referred_by: referredBy || null,
        is_approved: 1,
        subscription_end_date: new Date(Date.now() + subscriptionDays * 24 * 60 * 60 * 1000).toISOString(),
        created_at: FieldValue.serverTimestamp(),
        points: 0,
        wallet_balance: 0
      };

      const docRef = await usersRef.add(newUser);
      const userDoc = await docRef.get();
      const userData = userDoc.data() as any;

      res.json({ success: true, user: { id: userDoc.id, ...userData, fullName: userData.name, userType: userData.user_type } });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  // Hierarchy & Management APIs
  app.get("/api/admin/managed-users", async (req: any, res) => {
    try {
      const { role, district, country } = req.query;
      const usersRef = db.collection("users");
      let query: any = usersRef;

      if (role === 'admin') {
        query = query.where("district", "==", district)
                     .where("user_type", "in", ['lawyer', 'clerk', 'client', 'bar_association', 'advertiser']);
      } else if (role === 'country_manager') {
        query = query.where("country", "==", country).where("user_type", "==", "admin");
      } else if (role === 'super_admin') {
        query = query.where("user_type", "==", "country_manager");
      } else {
        return res.status(403).json({ error: "অনুমতি নেই।" });
      }

      const snapshot = await query.get();
      const users = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, users });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/affiliate-referrals", async (req, res) => {
    try {
      // Logic for affiliate signups can be added here if needed
      res.json({ success: true, referrals: [] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { mobile, rawMobile, password } = req.body;
      const usersRef = db.collection("users");
      
      let query = await usersRef.where("mobile", "==", mobile).where("password", "==", password).limit(1).get();
      
      if (query.empty && rawMobile) {
        query = await usersRef.where("mobile", "==", rawMobile).where("password", "==", password).limit(1).get();
      }

      if (query.empty && rawMobile && rawMobile.includes('@')) {
        query = await usersRef.where("email", "==", rawMobile).where("password", "==", password).limit(1).get();
      }
      
      if (query.empty) {
        return res.status(401).json({ error: "মোবাইল নম্বর অথবা পাসওয়ার্ড ভুল।" });
      }
      
      const userDoc = query.docs[0];
      const user = userDoc.data() as any;

      res.json({ 
        success: true, 
        user: { 
          id: userDoc.id, 
          fullName: user.name, 
          mobile: user.mobile, 
          userType: user.user_type, 
          district: user.district, 
          country: user.country,
          referralCode: user.referral_code,
          subscriptionEndDate: user.subscription_end_date,
          subscriptionPackage: user.subscription_package,
          profilePicture: user.profile_picture,
          points: user.points || 0
        } 
      });
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  app.get("/api/user-network", async (req, res) => {
    try {
      const { referralCode } = req.query;
      if (!referralCode) return res.status(400).json({ error: "Referral code required" });

      const snapshot = await db.collection("users").where("referred_by", "==", referralCode).get();
      const referredUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      res.json(referredUsers);
    } catch (error: any) {
      res.status(500).json({ error: "Database error: " + error.message });
    }
  });

  app.get("/api/users/search", async (req, res) => {
    try {
      const { mobile, type, district } = req.query;
      const usersRef = db.collection("users");
      let query: any = usersRef;

      if (mobile) {
        query = query.where("mobile", "==", mobile);
      }
      if (type) {
        query = query.where("user_type", "==", type);
      }
      if (district) {
        query = query.where("district", "==", district);
      }

      const snapshot = await query.limit(50).get();
      const users = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        name: doc.data().name,
        mobile: doc.data().mobile,
        user_type: doc.data().user_type,
        district: doc.data().district,
        profile_picture: doc.data().profile_picture
      }));

      res.json({ success: true, users });
    } catch (error: any) {
      res.status(500).json({ error: "সার্ভার এরর: " + error.message });
    }
  });

  // Cases Routes
  app.get("/api/cases", authenticate, async (req: any, res) => {
    try {
      const user = req.profile;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const userId = user.id;

      // Fetch cases created by this user
      const casesSnapshot = await db.collection("cases")
        .where("user_id", "==", userId)
        .orderBy("created_at", "desc")
        .get();

      let cases = casesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (user.user_type === 'client' && user.district) {
        const publicCasesSnapshot = await db.collection("cases")
          .where("visibility", "==", "public")
          .where("district", "==", user.district)
          .get();

        const publicCases = publicCasesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => !cases.find(existing => existing.id === c.id));

        cases = [...cases, ...publicCases];
      }

      res.json(cases);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Database error: " + error.message });
    }
  });

  app.post("/api/cases", authenticate, (req: any, res) => {
    try {
      const c = req.body;
      const userId = req.profile?.id;

      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      // Ensure user_id is the authenticated user
      c.user_id = userId;
      const pLawyerMob = Array.isArray(c.petitionerLawyerMobile) ? JSON.stringify(c.petitionerLawyerMobile) : c.petitionerLawyerMobile ? JSON.stringify([c.petitionerLawyerMobile]) : null;
      const rLawyerMob = Array.isArray(c.respondentLawyerMobile) ? JSON.stringify(c.respondentLawyerMobile) : c.respondentLawyerMobile ? JSON.stringify([c.respondentLawyerMobile]) : null;
      const pClerkMob = Array.isArray(c.petitionerClerkMobile) ? JSON.stringify(c.petitionerClerkMobile) : c.petitionerClerkMobile ? JSON.stringify([c.petitionerClerkMobile]) : null;
      const rClerkMob = Array.isArray(c.respondentClerkMobile) ? JSON.stringify(c.respondentClerkMobile) : c.respondentClerkMobile ? JSON.stringify([c.respondentClerkMobile]) : null;
      const pAsstLawyerMob = Array.isArray(c.petitionerAsstLawyerMobile) ? JSON.stringify(c.petitionerAsstLawyerMobile) : c.petitionerAsstLawyerMobile ? JSON.stringify([c.petitionerAsstLawyerMobile]) : null;
      const rAsstLawyerMob = Array.isArray(c.respondentAsstLawyerMobile) ? JSON.stringify(c.respondentAsstLawyerMobile) : c.respondentAsstLawyerMobile ? JSON.stringify([c.respondentAsstLawyerMobile]) : null;
      const pAsstClerkMob = Array.isArray(c.petitionerAsstClerkMobile) ? JSON.stringify(c.petitionerAsstClerkMobile) : c.petitionerAsstClerkMobile ? JSON.stringify([c.petitionerAsstClerkMobile]) : null;
      const rAsstClerkMob = Array.isArray(c.respondentAsstClerkMobile) ? JSON.stringify(c.respondentAsstClerkMobile) : c.respondentAsstClerkMobile ? JSON.stringify([c.respondentAsstClerkMobile]) : null;

      if (c.id) {
        await db.collection("cases").doc(c.id).set({
          ...c,
          updated_at: FieldValue.serverTimestamp()
        }, { merge: true });
        res.json({ success: true, id: c.id });
      } else {
        const docRef = await db.collection("cases").add({
          ...c,
          created_at: FieldValue.serverTimestamp()
        });
        res.json({ success: true, id: docRef.id });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Database error: " + error.message });
    }
  });

  // User Memories API
  app.get("/api/memories/:userId", authenticate, async (req: any, res) => {
    try {
      const targetUserId = req.params.userId;
      if (req.profile?.id !== targetUserId) {
        return res.status(403).json({ error: "অনুমতি নেই।" });
      }
      const snapshot = await db.collection("memories")
        .where("user_id", "==", targetUserId)
        .orderBy("created_at", "desc")
        .get();
      const memories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, memories });
    } catch (error: any) {
      res.status(500).json({ error: "মেমোরি আনতে ব্যর্থ হয়েছে।" });
    }
  });

  app.post("/api/memories", authenticate, async (req: any, res) => {
    try {
      const { content, category } = req.body;
      const userId = req.profile?.id;
      if (!userId || !content) return res.status(400).json({ error: "তথ্য অসম্পূর্ণ।" });
      
      const docRef = await db.collection("memories").add({
        user_id: userId,
        content,
        category: category || 'general',
        created_at: FieldValue.serverTimestamp()
      });
      
      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      res.status(500).json({ error: "তথ্য সংরক্ষণে ব্যর্থ হয়েছে।" });
    }
  });

  // Recharge API Routes
  app.post("/api/recharge/create", authenticate, async (req: any, res) => {
    try {
      const { mobile_number, operator, package_type, amount, payment_method, transaction_id } = req.body;
      const user_id = req.profile?.id;
      if (!user_id) return res.status(401).json({ error: "Unauthorized" });
      
      const commission = amount * 0.10; // 10% commission
      const cashback = commission * 0.30; // 30% of commission goes to user
      
      const docRef = await db.collection("recharge_orders").add({
        user_id,
        mobile_number,
        operator,
        package_type,
        amount: Number(amount),
        commission,
        cashback,
        payment_method,
        transaction_id: transaction_id || null,
        status: 'pending',
        created_at: FieldValue.serverTimestamp()
      });
      
      res.json({ success: true, order_id: docRef.id, amount, cashback });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to create recharge order" });
    }
  });

  app.post("/api/recharge/confirm", async (req, res) => {
    try {
      const { order_id } = req.body;
      
      const orderDoc = await db.collection("recharge_orders").doc(order_id).get();
      if (!orderDoc.exists) return res.status(404).json({ error: "Order not found" });
      const order = orderDoc.data() as any;
      
      if (order.status === 'completed') {
        return res.status(400).json({ error: "Order already completed" });
      }
      
      const batch = db.batch();
      // Update order status
      batch.update(db.collection("recharge_orders").doc(order_id), { status: 'completed' });
      
      // Add to history
      const historyRef = db.collection("recharge_history").doc();
      batch.set(historyRef, {
        user_id: order.user_id,
        mobile_number: order.mobile_number,
        operator: order.operator,
        package: order.package_type,
        amount: order.amount,
        status: 'success',
        created_at: FieldValue.serverTimestamp()
      });
      
      // Add cashback to wallet
      const userRef = db.collection("users").doc(order.user_id);
      batch.update(userRef, {
        wallet_balance: FieldValue.increment(order.cashback || 0)
      });
      
      await batch.commit();
      
      res.json({ success: true, message: "Recharge successful", cashback: order.cashback });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to confirm recharge" });
    }
  });



  app.get("/api/recharge/wallet/:userId", authenticate, async (req: any, res) => {
    try {
      const targetUserId = req.params.userId;
      if (req.profile?.id !== targetUserId) {
        return res.status(403).json({ error: "অনুমতি নেই।" });
      }
      const userDoc = await db.collection("users").doc(targetUserId).get();
      if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
      
      const userData = userDoc.data() as any;
      const wallet = {
        user_id: targetUserId,
        balance: userData.wallet_balance || 0,
        points: userData.points || 0
      };
      
      res.json({ success: true, wallet });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  });

  // Templates Routes
  app.get("/api/templates", async (req, res) => {
    try {
      const snapshot = await db.collection("templates").orderBy("created_at", "desc").get();
      const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, templates });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const { title, description, file_url, uploaded_by, uploader_name } = req.body;
      const docRef = await db.collection("templates").add({
        title,
        description,
        file_url,
        uploaded_by: uploaded_by || null,
        uploader_name: uploader_name || null,
        created_at: FieldValue.serverTimestamp()
      });
      res.json({ success: true, template_id: docRef.id });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to upload template" });
    }
  });

  app.post("/api/templates/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.body;
      if (!user_id) return res.status(400).json({ error: "User ID required" });

      const templateDoc = await db.collection("templates").doc(id).get();
      if (!templateDoc.exists) return res.status(404).json({ error: "Template not found" });
      const template = templateDoc.data() as any;

      if (template.uploaded_by !== user_id) {
        const userDoc = await db.collection("users").doc(user_id).get();
        const user = userDoc.data() as any;
        if (!user || (user.points || 0) < 10) {
          return res.status(400).json({ error: "পর্যাপ্ত পয়েন্ট নেই। বিজ্ঞাপন দেখে পয়েন্ট অর্জন করুন।" });
        }

        const batch = db.batch();
        batch.update(db.collection("users").doc(user_id), { points: FieldValue.increment(-10) });
        if (template.uploaded_by) {
          batch.update(db.collection("users").doc(template.uploaded_by), { points: FieldValue.increment(5) });
        }
        await batch.commit();
      }
      
      res.json({ success: true, file_url: template.file_url });
    } catch (error: any) {
      res.status(500).json({ error: "Download processing failed" });
    }
  });

  app.post("/api/ads/watch", async (req, res) => {
    try {
      const { user_id } = req.body;
      if (!user_id) return res.status(400).json({ error: "User ID required" });
      
      await db.collection("users").doc(user_id).update({
        points: FieldValue.increment(10)
      });
      
      const userDoc = await db.collection("users").doc(user_id).get();
      res.json({ success: true, points: (userDoc.data() as any).points });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update points" });
    }
  });

  app.get('/api/user/referrals', async (req, res) => {
    try {
      const { referralCode } = req.query;
      if (!referralCode) return res.status(400).json({ error: 'Referral code is required' });

      const snapshot = await db.collection("users").where("referred_by", "==", referralCode).get();
      const referrals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(referrals);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch referrals' });
    }
  });

  app.post("/api/users/:id/profile-picture", async (req, res) => {
    try {
      const { profilePicture } = req.body;
      const { id } = req.params;
      await db.collection("users").doc(id).update({ profile_picture: profilePicture });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update profile picture" });
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
