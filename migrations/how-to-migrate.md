# Job Application Tracker — Migrations

All migration scripts are run from the **project root** (not the `migrations/` directory).
Load `.env.local` automatically via `dotenv`.

---

## Migration 1 — Education to Array + Skills to Structured Format

**File:** `migrations/migrate-education-to-array.js`  
**When to run:** If any user profiles were created before the education array refactor.

```bash
node migrations/migrate-education-to-array.js
```

Converts:

- `users.education` from a single object → `array`
- `users.skills.relevant` / `users.skills.other` from comma-separated strings → structured `{ name, proficiency }` arrays

---

## Migration 2 — Documents to Separate Collection

**File:** `migrations/migrate-documents-to-collection.js`  
**When to run:** After deploying the document collection architecture (multi-page editor,
`/document/[id]` routes). Must be run before removing the deprecated
`resume`, `coverLetter`, and `supportingStatement` fields from the `jobs` collection.

### Steps

**Step 1 — Dry run (preview, no writes)**

```bash
node migrations/migrate-documents-to-collection.js --dry-run
```

**Step 2 — Run the migration**

```bash
node migrations/migrate-documents-to-collection.js
```

This will:

- Create a new `documents` MongoDB collection
- For each job that has non-empty `resume`, `coverLetter`, or `supportingStatement` data,
  insert a corresponding document record with `jobId` reference
- Preserve the original markdown in `legacyContent` / `legacyRefinedContent` fields
  so the frontend can auto-migrate to block format on first open
- Create indexes: `id`, `userId`, `jobId`, `userId+type`, `jobId+type`
- Is **idempotent** — safe to re-run; already-migrated documents are skipped

**Step 3 — Deploy and verify**

- Deploy the application with the new `/document/[id]` pages
- Open a few documents via the UI and confirm they load from the `documents` collection
- Check that auto-migration from `legacyContent` → blocks works correctly

**Step 4 — Cleanup deprecated fields (after full verification)**

```bash
node migrations/migrate-documents-to-collection.js --cleanup
```

This removes the `resume`, `coverLetter`, and `supportingStatement` embedded fields
from jobs that have successfully had their documents migrated. Only fields that
have a corresponding document record are removed.

### Rollback

If anything goes wrong before cleanup, restore the original embedded fields:

```bash
node migrations/migrate-documents-to-collection.js --rollback
```

This copies `legacyContent` / `legacyRefinedContent` back into the
`jobs.resume` / `jobs.coverLetter` / `jobs.supportingStatement` fields and
deletes the corresponding `documents` collection records.

> **Note:** Rollback is only available before `--cleanup` is run, as cleanup
> removes the `legacyContent` fields from the `documents` collection records.
