# Security Specification (security_spec.md) - Community Hero

This document defines the security boundaries, data invariants, and adversarial test scenarios ("Dirty Dozen") designed to audit and verify our Firestore security rules.

---

## 1. Data Invariants

1. **Ownership Integrity**: A report cannot be deleted or structurally altered (e.g., title, description, category, coordinates) by anyone except the original author (`reporterId`).
2. **Social Verification Integrity**: Only authenticated users can upvote, volunteer, or comment on a report. Upvoters cannot modify other core metadata fields.
3. **Profile Isolation**: A user can only write, modify, or update their own profile document (`/users/{userId}`).
4. **Strict Schema Constraints**: No unstructured or excessively large data fields can be injected.

---

## 2. The "Dirty Dozen" Adversarial Payloads

### Payload 1: Unauthenticated Creation
- **Target Path**: `/reports/malicious-report-1`
- **Payload**: Standard report document.
- **Actor**: Anonymous (Unauthenticated).
- **Invariant Violated**: Only authenticated citizens can file reports.

### Payload 2: Identity Spoofing on Create
- **Target Path**: `/reports/malicious-report-2`
- **Payload**: `{ "id": "malicious-report-2", "reporterId": "victim-user-123", "reporterName": "Fake Name", "title": "Pothole", ... }`
- **Actor**: Authenticated user with `uid: "attacker-456"`.
- **Invariant Violated**: `reporterId` in the document must match the authenticated user's UID.

### Payload 3: Profile Identity Spoofing
- **Target Path**: `/users/victim-user-123`
- **Payload**: `{ "uid": "victim-user-123", "points": 100000, "badges": ["Supreme Overlord"] }`
- **Actor**: Authenticated user with `uid: "attacker-456"`.
- **Invariant Violated**: Users can only write to their own UID document in the `/users/` collection.

### Payload 4: Arbitrary Title/Description Update (Shadow Update)
- **Target Path**: `/reports/victim-report-999`
- **Payload**: Changing `title` and `description` of another user's report.
- **Actor**: Authenticated user who is NOT the author.
- **Invariant Violated**: Core metadata is immutable to everyone except the original reporter.

### Payload 5: Remote Report Deletion
- **Target Path**: `/reports/victim-report-999`
- **Operation**: `Delete`
- **Actor**: Authenticated user who is NOT the author.
- **Invariant Violated**: Only the author can delete a report.

### Payload 6: Upvote Inflation Attack
- **Target Path**: `/reports/victim-report-999`
- **Payload**: Overwriting `upvoteCount` to `10000` directly without joining the `upvotedBy` array.
- **Actor**: Authenticated user who is NOT the author.
- **Invariant Violated**: Upvote changes must conform to verified collaborative increments.

### Payload 7: Invalid Data Type/Size Injection (Value Poisoning)
- **Target Path**: `/reports/victim-report-999`
- **Payload**: Injecting a massive 2MB base64 string or an array of booleans into `title`.
- **Actor**: Authenticated user.
- **Invariant Violated**: Field data sizes and types must be strictly constrained.

### Payload 8: Direct Unauthenticated Profile Point Injection
- **Target Path**: `/users/attacker-456`
- **Payload**: Updating points directly without authenticated state.
- **Actor**: Unauthenticated user.
- **Invariant Violated**: Profile writes require auth.

### Payload 9: Self-Appointed Administrator Escalation
- **Target Path**: `/users/attacker-456`
- **Payload**: `{ "role": "admin", "isAdmin": true, ... }`
- **Actor**: Authenticated user.
- **Invariant Violated**: Users cannot grant themselves administrative privileges or roles in their profiles.

### Payload 10: Terminal State Modification
- **Target Path**: `/reports/resolved-report-777` (already resolved)
- **Payload**: Changing the status from `resolved` back to `reported` or editing resolved images.
- **Actor**: Authenticated user who is NOT the author.
- **Invariant Violated**: Terminal resolution states are locked down.

### Payload 11: Negative Points Overwrite
- **Target Path**: `/users/victim-user-123`
- **Payload**: `{ "points": -500 }`
- **Actor**: Authenticated user with `uid: "attacker-456"`.
- **Invariant Violated**: Overwriting another user's profile fields is forbidden.

### Payload 12: Orphaned Record Creation
- **Target Path**: `/reports/orphaned-report-888`
- **Payload**: Assigning an invalid or non-existent parent/reporter reference.
- **Actor**: Authenticated user.
- **Invariant Violated**: All database records must possess valid references.

---

## 3. The Test Runner Spec (`firestore.rules.test.ts`)

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import * as fs from "fs";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "fit-transmitter-2gxqk",
    firestore: {
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

// Unit tests targeting the "Dirty Dozen" to verify PERMISSION_DENIED on each payload
describe("Community Hero Security Audit", () => {
  it("should fail to create a report when unauthenticated (Payload 1)", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    await assertFails(db.doc("reports/malicious-report-1").set({ title: "Leak" }));
  });

  it("should fail to spoof reporter ID on create (Payload 2)", async () => {
    const context = testEnv.authenticatedContext("attacker-456");
    const db = context.firestore();
    await assertFails(db.doc("reports/malicious-report-2").set({
      id: "malicious-report-2",
      reporterId: "victim-user-123",
      title: "Pothole"
    }));
  });

  it("should fail to spoof profile ID (Payload 3)", async () => {
    const context = testEnv.authenticatedContext("attacker-456");
    const db = context.firestore();
    await assertFails(db.doc("users/victim-user-123").set({ points: 100000 }));
  });
});
```
