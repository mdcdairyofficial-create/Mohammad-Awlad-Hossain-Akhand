# PRODUCTION_READY_CHECKLIST.md

## High-Priority Roadmap for Massive Scalability (3.7M+ Users)

### 1. Backend & Firebase Infrastructure Error
- [ ] **Fix Firebase SDK Conflicts:** The `server.ts` currently has conflicts between Firebase Admin SDK and Client SDK initialization. This causes IAM errors. Needs to be unified (Preferably Admin SDK on the backend, using correct credentials).
- [ ] **Cloud API Activation:** Verify Firestore, Auth, and Cloud Run APIs are active in Google Cloud Console.
- [ ] **Environment Secrets:** Move all service accounts and API keys to environment secrets. Do not store secrets in source control.

### 2. Firestore Scalability & Optimization
- [ ] **Data Read Optimization for Scale:** For 3.7 million users, every read counts. Implement Query Pagination across all collection list operations (`limit`, `startAfter`).
- [ ] **Caching Layer:** Must implement caching (e.g., Redis) to cache frequent data to reduce high Firebase readout costs.
- [ ] **Indexing:** Ensure all queries have composite indexes defined to avoid slow queries.

### 3. Critical Security Risk (Zero-Trust)
- [ ] **Write Secure Rules:** The current `firestore.rules` is `allow read, write: if true;` which is a huge security risk. Must rewrite based on strict Attribute-Based Access Control (Zero-Trust).
- [ ] **ESLint & Testing:** Run ESLint for Firebase rules and implement `firestore.rules.test.ts` to perform continuous integration tests.

### 4. Billing & Data Usage Logic (New Feature)
- [ ] **Usage-Based Limit Setup:** Implement backend logic to track user data usage (`usage_mb` or similar).
- [ ] **500MB Threshold Logic:** Define threshold at 500MB. If `current_usage > 500MB` AND the user is NOT subscribed (`!isSubscribed`), block usage and initiate a billing/recharge trigger.
- [ ] **Subscription Bypass:** If the user has an active premium package, completely bypass the billing usage limit (`if (isSubscribed) { bypassBilling(); }`).

### 5. Third-Party Integrations & Legacy Code
- [ ] **Affiliate Cleanup (`martnix.com`):** The dashboard contains hardcoded links to a PHP script (`https://martnix.com/customer/register?ref=1012`). Decide if this should be integrated properly via API to avoid cross-domain/architectural issues or removed.

### 6. Stability & Observability
- [ ] **Error Handling:** Centralize all Firestore errors using a standardized wrapper to catch API limits early.
- [ ] **Monitoring:** Enable Google Cloud Trace and Error Reporting for real-time traffic analysis.

### 7. Advertising & Monetization Logic
- [ ] **Ad Placement System (30 slots):** Implement a dynamic ad delivery system for the 30 available ad slots across the application dashboard.
- [ ] **Ad Display Limits (UX Protection):** Restrict ad display to a maximum of **2 ads per screen/slot at a single time** so users don't get annoyed. Subsequent visits or refreshes can show new ads.
- [ ] **Advertiser Booking & Queue System:** Implement a queuing system for ad slots. If multiple advertisers book the exact same slot, queue them sequentially. During the ad ordering/checkout process, the system MUST show the advertiser their exact "serial/queue position" so they know beforehand when their ad will be displayed (preventing future claims/complaints).
- [ ] **Advertiser vs. Ad Network Fallback:** For each ad slot, first check if there is an active direct campaign uploaded by local advertisers (based on queue position). If YES, display the local ad.
- [ ] **Google AdSense/AdMob Fallback:** If NO local ad is available for a specific slot, the system MUST automatically fallback to and serve a Google AdSense or AdMob ad. This guarantees a 100% fill rate for ad viewability.
- [ ] **Premium Subscription Bypass:** If the user has a Premium Subscription (`isPremium === true`), suppress ALL ads (both local and AdSense/AdMob).