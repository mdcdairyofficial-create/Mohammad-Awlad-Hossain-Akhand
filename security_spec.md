# Security Specification for MDC Casebook Firestore

## 1. Data Invariants
- Users can only read/write their own profile (`/users/{userId}`).
- Lawyers, Clerks, and Users can only access cases they are explicitly part of or authorized to view.
- Recharge orders are write-only for users once submitted.
- Chat messages can only be read by the session participants.

## 2. The "Dirty Dozen" Payloads (Examples to deny)
- Trying to write `{ "points": 999999 }` to a User document by a client.
- Trying to update `user_type` to "super_admin" by a regular user.
- Trying to read another user's profile.
- Trying to modify another user's case information.

## 3. Test Runner
We will generate `firestore.rules.test.ts` to verify these rules against the payload defined.
