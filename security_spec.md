# Security Specification for MDC LEGAL Ad Dashboard

## 1. Data Invariants
- A campaign must always have an `ownerId` matching the authenticated user's UID.
- A campaign's `status` must be one of: 'pending', 'active', 'paused', 'completed'.
- `totalPrice` must be a non-negative number.
- `createdAt` and `ownerId` are immutable after creation.
- Users can only read and write their own campaigns.

## 2. The "Dirty Dozen" Payloads (Campaigns)
1. **Identity Spoofing**: Attempt to create a campaign with `ownerId` of another user.
2. **Identity Escalation**: Attempt to update `ownerId` of an existing campaign.
3. **Price Poisoning**: Set `totalPrice` to a negative number.
4. **Status Injection**: Set `status` to 'active' without payment (logic handles this, but rules should restrict).
5. **Shadow Field**: Include `isVerified: true` in the payload.
6. **Large Payload**: Send a 1MB string in `adTitle`.
7. **Orphaned Campaign**: Create a campaign with a malicious document ID that is dangerously long.
8. **Immutability Breach**: Attempt to change `createdAt` timestamp.
9. **Unauthorized Read**: Attempt to 'get' or 'list' campaigns belonging to another user.
10. **Type Mismatch**: Send a boolean instead of a string for `adTitle`.
11. **Regex Bypass**: Use special characters in a document ID that aren't allowed.
12. **Mass Update**: Attempt to update `paymentStatus` directly (should only be updated via admin or specific action).

## 3. Test Runner
Refer to `firestore.rules.test.ts` for implementation details.
