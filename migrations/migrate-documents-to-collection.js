/**
 * Migration: Extract embedded documents from jobs into a separate collection
 *
 * Before: Documents (resume, coverLetter, supportingStatement) are embedded
 *         sub-objects inside each job document:
 *         jobs.resume            = { content: string, refinedContent: string }
 *         jobs.coverLetter       = { content: string, refinedContent: string }
 *         jobs.supportingStatement = { content: string, refinedContent: string }
 *
 * After:  Each non-empty document is extracted into a new `documents` collection
 *         with a `jobId` foreign key reference and a `userId` field.
 *         The deprecated fields are retained on the jobs document during the
 *         migration window and can be cleaned up via the --cleanup flag once the
 *         application is fully deployed with the new document-centric architecture.
 *
 * Usage:
 *   node migrations/migrate-documents-to-collection.js
 *   node migrations/migrate-documents-to-collection.js --dry-run     (preview only, no writes)
 *   node migrations/migrate-documents-to-collection.js --cleanup     (remove deprecated fields after migration)
 *   node migrations/migrate-documents-to-collection.js --rollback    (restore embedded fields, delete documents collection rows)
 *
 * Safety:
 *   - Idempotent: re-running skips already-migrated documents (checks for existing doc with same jobId+type)
 *   - Dry-run mode prints what would happen without writing
 *   - Rollback mode restores the original embedded fields from legacyContent / legacyRefinedContent
 */

const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const isDryRun = process.argv.includes('--dry-run');
const isCleanup = process.argv.includes('--cleanup');
const isRollback = process.argv.includes('--rollback');

// Document types to migrate from jobs
const DOCUMENT_TYPES = [
  { field: 'resume', type: 'resume', defaultTemplate: 'ats' },
  { field: 'coverLetter', type: 'coverLetter', defaultTemplate: 'formal' },
  { field: 'supportingStatement', type: 'supportingStatement', defaultTemplate: 'formal' },
];

/**
 * Build a human-readable title for a document given the job and type
 */
function buildDocumentTitle(job, docType) {
  const typeLabels = {
    resume: 'Resume',
    coverLetter: 'Cover Letter',
    supportingStatement: 'Supporting Statement',
  };
  const label = typeLabels[docType] || docType;
  const company = job.company ? ` — ${job.company}` : '';
  const title = job.title ? ` (${job.title})` : '';
  return `${label}${company}${title}`;
}

/**
 * Check whether embedded document field has any actual content
 */
function hasContent(embeddedDoc) {
  if (!embeddedDoc) return false;
  return !!(
    (embeddedDoc.content && embeddedDoc.content.trim()) ||
    (embeddedDoc.refinedContent && embeddedDoc.refinedContent.trim())
  );
}

async function runMigration() {
  let client;

  try {
    client = new MongoClient(process.env.MONGO_URL);
    await client.connect();

    const db = client.db(process.env.DB_NAME || 'job_tracker');
    const jobsCollection = db.collection('jobs');
    const documentsCollection = db.collection('documents');

    console.log(`\n${'='.repeat(60)}`);
    console.log('Job Application Tracker — Document Collection Migration');
    console.log(`${'='.repeat(60)}`);
    if (isDryRun) console.log('MODE: DRY RUN — no changes will be written\n');
    if (isCleanup) console.log('MODE: CLEANUP — removing deprecated embedded fields\n');
    if (isRollback) console.log('MODE: ROLLBACK — restoring embedded fields from legacy content\n');

    // ----------------------------------------------------------------
    // ROLLBACK MODE
    // ----------------------------------------------------------------
    if (isRollback) {
      console.log('Starting rollback...');
      const migratedDocs = await documentsCollection
        .find({
          jobId: { $ne: null },
          $or: [
            { legacyContent: { $exists: true, $ne: '' } },
            { legacyRefinedContent: { $exists: true, $ne: '' } },
          ],
        })
        .toArray();

      console.log(`Found ${migratedDocs.length} document records with legacy content to restore`);

      let restored = 0;
      const jobUpdates = {}; // jobId -> { resume, coverLetter, supportingStatement }

      for (const doc of migratedDocs) {
        if (!jobUpdates[doc.jobId]) {
          jobUpdates[doc.jobId] = {};
        }
        jobUpdates[doc.jobId][doc.type] = {
          content: doc.legacyContent || '',
          refinedContent: doc.legacyRefinedContent || '',
        };
      }

      for (const [jobId, fields] of Object.entries(jobUpdates)) {
        console.log(`  Restoring job ${jobId}: ${Object.keys(fields).join(', ')}`);
        if (!isDryRun) {
          await jobsCollection.updateOne(
            { id: jobId },
            { $set: { ...fields, updatedAt: new Date() } }
          );
          restored++;
        }
      }

      if (!isDryRun) {
        // Delete migrated documents (those with jobId and legacyContent)
        const deleteResult = await documentsCollection.deleteMany({
          jobId: { $ne: null },
          legacyContent: { $exists: true },
        });
        console.log(`\nDeleted ${deleteResult.deletedCount} documents from documents collection`);
        console.log(`Restored embedded fields on ${restored} jobs`);
      } else {
        console.log(`\n[DRY RUN] Would restore ${Object.keys(jobUpdates).length} jobs`);
      }

      console.log('\nRollback complete.');
      return;
    }

    // ----------------------------------------------------------------
    // CLEANUP MODE — remove deprecated embedded fields after migration
    // ----------------------------------------------------------------
    if (isCleanup) {
      console.log('Starting cleanup of deprecated embedded fields on jobs...');

      // Only clean up jobs that have had their documents successfully migrated
      const migratedJobIds = await documentsCollection.distinct('jobId', {
        jobId: { $ne: null },
      });

      console.log(`Found ${migratedJobIds.length} jobs with migrated documents`);

      const unsetPayload = { resume: '', coverLetter: '', supportingStatement: '' };

      // Verify each job has all 3 document types successfully migrated before cleanup
      let cleanedUp = 0;
      for (const jobId of migratedJobIds) {
        const job = await jobsCollection.findOne({ id: jobId });
        if (!job) continue;

        // Only remove fields that had content and are now in documents collection
        const fieldsToUnset = {};
        for (const { field, type } of DOCUMENT_TYPES) {
          if (hasContent(job[field])) {
            const docExists = await documentsCollection.findOne({ jobId, type });
            if (docExists) {
              fieldsToUnset[field] = '';
            } else {
              console.warn(
                `  [SKIP] Job ${jobId} has ${field} content but no matching document record — skipping cleanup of this field`
              );
            }
          } else {
            fieldsToUnset[field] = '';
          }
        }

        if (Object.keys(fieldsToUnset).length > 0) {
          console.log(
            `  Cleaning up job ${jobId}: removing ${Object.keys(fieldsToUnset).join(', ')}`
          );
          if (!isDryRun) {
            await jobsCollection.updateOne(
              { id: jobId },
              { $unset: fieldsToUnset, $set: { updatedAt: new Date() } }
            );
            cleanedUp++;
          }
        }
      }

      if (isDryRun) {
        console.log(`\n[DRY RUN] Would clean up ${migratedJobIds.length} jobs`);
      } else {
        console.log(`\nCleanup complete — deprecated fields removed from ${cleanedUp} jobs`);
      }
      return;
    }

    // ----------------------------------------------------------------
    // MAIN MIGRATION — extract documents from jobs
    // ----------------------------------------------------------------
    console.log('Fetching all jobs with document content...');

    const jobs = await jobsCollection
      .find({
        $or: DOCUMENT_TYPES.map(({ field }) => ({
          [`${field}.content`]: { $exists: true },
        })),
      })
      .toArray();

    console.log(`Found ${jobs.length} jobs to process\n`);

    let created = 0;
    let skipped = 0;
    let empty = 0;
    let errors = 0;

    for (const job of jobs) {
      for (const { field, type, defaultTemplate } of DOCUMENT_TYPES) {
        const embedded = job[field];

        // Skip if no embedded document data at all
        if (!embedded) {
          empty++;
          continue;
        }

        // Skip if no actual content
        if (!hasContent(embedded)) {
          empty++;
          continue;
        }

        // Check idempotency — skip if document already migrated
        const existingDoc = await documentsCollection.findOne({
          jobId: job.id,
          type,
        });

        if (existingDoc) {
          console.log(
            `  [SKIP] ${type} for job ${job.id} already migrated (doc ${existingDoc.id})`
          );
          skipped++;
          continue;
        }

        const docTitle = buildDocumentTitle(job, type);

        const newDocument = {
          id: uuidv4(),
          userId: job.userId,
          jobId: job.id,
          type,
          title: docTitle,
          template: defaultTemplate,

          // New block-based content — empty until the user opens and saves in the new editor
          // The frontend will auto-migrate legacyContent → blocks on first open
          blocks: [],
          schemaVersion: 1,

          // Preserve original markdown content for migration window
          legacyContent: embedded.content || '',
          legacyRefinedContent: embedded.refinedContent || '',

          // Empty version history — localStorage versions cannot be migrated
          versions: [],

          createdAt: job.createdAt || new Date(),
          updatedAt: new Date(),
        };

        console.log(
          `  [CREATE] ${type} for job "${job.title}" at ${job.company} → doc ${newDocument.id}`
        );

        if (!isDryRun) {
          try {
            await documentsCollection.insertOne(newDocument);
            created++;
          } catch (err) {
            console.error(`  [ERROR] Failed to insert ${type} for job ${job.id}: ${err.message}`);
            errors++;
          }
        } else {
          created++; // Count as "would create" in dry-run
        }
      }
    }

    // ----------------------------------------------------------------
    // Summary
    // ----------------------------------------------------------------
    console.log(`\n${'='.repeat(60)}`);
    console.log('Migration Summary');
    console.log(`${'='.repeat(60)}`);
    console.log(`Jobs processed:          ${jobs.length}`);
    console.log(`Documents created:       ${created}${isDryRun ? ' (dry run)' : ''}`);
    console.log(`Already migrated (skip): ${skipped}`);
    console.log(`Empty (no content):      ${empty}`);
    console.log(`Errors:                  ${errors}`);

    if (isDryRun) {
      console.log('\nDry run complete. Run without --dry-run to apply changes.');
    } else {
      console.log('\nMigration complete.');
      console.log('\nNext steps:');
      console.log('  1. Deploy the application with the new document collection support');
      console.log('  2. Verify documents are accessible via /document/[id]');
      console.log('  3. Run with --cleanup flag to remove deprecated embedded fields from jobs');
      console.log('     node migrations/migrate-documents-to-collection.js --cleanup');
    }

    // ----------------------------------------------------------------
    // Create indexes for the new documents collection
    // ----------------------------------------------------------------
    if (!isDryRun) {
      console.log('\nCreating indexes on documents collection...');
      await documentsCollection.createIndex({ id: 1 }, { unique: true, name: 'idx_documents_id' });
      await documentsCollection.createIndex({ userId: 1 }, { name: 'idx_documents_userId' });
      await documentsCollection.createIndex(
        { jobId: 1 },
        { name: 'idx_documents_jobId', sparse: true }
      );
      await documentsCollection.createIndex(
        { userId: 1, type: 1 },
        { name: 'idx_documents_userId_type' }
      );
      await documentsCollection.createIndex(
        { jobId: 1, type: 1 },
        { name: 'idx_documents_jobId_type', sparse: true }
      );
      console.log('Indexes created successfully.');
    }
  } catch (err) {
    console.error('\nFatal migration error:', err);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

runMigration();
