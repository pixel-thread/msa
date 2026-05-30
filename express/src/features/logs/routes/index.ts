// External libs
import { Router } from 'express';

// ---- Route handlers

import { postLog, postLogBatch } from './logs.route';

// ---------------------------------------------------------------------------
// Logs ingestion router
//
// Aggregates all log-ingestion route handlers under a single Express Router
// so it can be mounted at /api/logs.
// ---------------------------------------------------------------------------

const router: Router = Router();

// ---- POST /api/logs       — Ingest a single log entry

router.post('/', postLog);

// ---- POST /api/logs/batch — Ingest multiple log entries

router.post('/batch', postLogBatch);

export default router;
