# Developer Action Plan: Application Stabilization and Production Readiness

This document outlines the critical issues and tasks required to stabilize the application and prepare it for production use.

## 1. Critical Firebase & Backend Infrastructure
The application is currently experiencing authentication and database access issues stemming from the interaction between the Firebase Admin SDK and the Client SDK in `server.ts`.

### Tasks:
- **Refactor Firebase Initialization:** Resolve the hybrid SDK usage in `server.ts`. The current implementation conflicts with IAM permissions. Standardize the initialization to use a single, robust approach (preferably Admin SDK for server-side operations, ensuring Service Account configuration in Cloud Run is correct).
- **Enable Cloud APIs:** Ensure the Cloud Firestore API and Firebase Authentication API are officially enabled in the Google Cloud Console for the project.
- **Environment Management:** Verify all required keys (Stripe, Firebase Admin Service Account, etc.) are properly defined in the environment and do not rely on local hardcoding.

## 2. Firestore Security Overhaul (Critical Security Risk)
The current Firestore security rules (`firestore.rules`) are insecure and essentially allow blanket access. 

### Tasks:
- **Implement Robust Security Rules:** Completely rewrite `firestore.rules` based on the "Eight Pillars" methodology (Identity Integrity, Atomicity, Strict Type Validation, etc.) to enforce zero-trust access control.
- **Audit:** Run `eslint` with `@firebase/eslint-plugin-security-rules` after every rules change.
- **Automated Testing:** Implement `firestore.rules.test.ts` to verify that all access patterns are correctly permitted or denied.

## 3. Affiliate Zone & External Integrations
The hardcoded integration with `martnix.com` requires architectural review.

### Tasks:
- **Hardcoded Link Cleanup:** The links in `src/user/dashboard/Dashboard.tsx` and `src/user/resources/AffiliateZone.tsx` are hardcoded PHP-generated URLs. Investigate if this integration is meant to be dynamic. If it's a legacy component, ensure it is removed or properly integrated into the secure backend.
- **Authentication consistency:** Ensure affiliate referral tracking is handled securely and consistently across the backend APIs.

## 4. Database Data Needs
Stabilizing the backend might require data migration or cleanup based on the revised Firestore rules.

### Tasks:
- **Schema Audit:** Perform a full audit of all existing Firestore collections to ensure they match the required schema for the new security rules.
- **Data Cleanup:** Identify and purge any orphaned or inconsistent records that might violate future integrity checks.
- **Migration Strategy:** If the database structure changes, prepare a migration script in `server.ts` (run as a one-off) to update existing documents to the new structure.

---
**Note:** Please provide this document to the developer immediately. Addressing the Firebase initialization and Firestore security rules is the highest priority to make the application usable and secure.
