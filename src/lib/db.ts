import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const localDbPath = path.join(process.cwd(), 'data', 'crm.sqlite');
const dbPath = isVercel ? path.join('/tmp', 'crm.sqlite') : localDbPath;

function ensureDbFile() {
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch (e) {
      // ignore if exists or in /tmp
    }
  }

  // On Vercel, copy bundled database to /tmp so all seed users and leads exist
  if (isVercel && !fs.existsSync(dbPath)) {
    if (fs.existsSync(localDbPath)) {
      try {
        fs.copyFileSync(localDbPath, dbPath);
      } catch (err) {
        console.warn('Could not copy bundled db to /tmp, will initialize fresh:', err);
      }
    }
  }
}

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    ensureDbFile();
    dbInstance = new DatabaseSync(dbPath);
    initTables(dbInstance);
  }
  return dbInstance;
}

function initTables(db: DatabaseSync) {
  const journalMode = isVercel ? 'DELETE' : 'WAL';
  db.exec(`
    PRAGMA journal_mode = ${journalMode};
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      role TEXT NOT NULL,
      pin TEXT NOT NULL DEFAULT '1234',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      project_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      contact_role TEXT NOT NULL DEFAULT 'CONTRACTOR',
      site_address TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      maps_url TEXT,
      construction_stage TEXT NOT NULL DEFAULT 'FOUNDATION',
      material_requirements TEXT,
      estimated_budget TEXT,
      notes TEXT,
      photo_url TEXT,
      status TEXT NOT NULL DEFAULT 'UNCLAIMED',
      lost_reason TEXT,
      captured_by_id TEXT NOT NULL,
      claimed_by_id TEXT,
      claimed_at TEXT,
      last_contacted_at TEXT,
      ihb_name TEXT,
      ihb_phone TEXT,
      contractor_name TEXT,
      contractor_phone TEXT,
      engineer_name TEXT,
      engineer_phone TEXT,
      site_area TEXT,
      cement_brand TEXT,
      cement_rate TEXT,
      tmt_brand TEXT,
      cover_block_sizes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (captured_by_id) REFERENCES users(id),
      FOREIGN KEY (claimed_by_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(contact_phone);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      caller_id TEXT NOT NULL,
      call_status TEXT NOT NULL,
      notes TEXT,
      duration_seconds INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (caller_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      caller_id TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      completed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (caller_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const extraCols = [
    'ihb_name TEXT',
    'ihb_phone TEXT',
    'contractor_name TEXT',
    'contractor_phone TEXT',
    'engineer_name TEXT',
    'engineer_phone TEXT',
    'site_area TEXT',
    'cement_brand TEXT',
    'cement_rate TEXT',
    'tmt_brand TEXT',
    'cover_block_sizes TEXT',
    'captured_by_name TEXT',
    'claimed_by_name TEXT',
  ];
  for (const col of extraCols) {
    try {
      db.exec(`ALTER TABLE leads ADD COLUMN ${col};`);
    } catch {
      // Column already exists
    }
  }

  seedInitialData(db);
}

function seedInitialData(db: DatabaseSync) {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const now = new Date().toISOString();

  // Insert default users (Required for PIN login & roles)
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, phone, role, pin, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `);

  const uAdmin = 'user_admin_1';
  const uAgent1 = 'user_agent_1';
  const uAgent2 = 'user_agent_2';
  const uCaller1 = 'user_caller_1';
  const uCaller2 = 'user_caller_2';

  insertUser.run(uAdmin, 'Mr. Sharma (Director/Manager)', 'sharma@business.com', '9876543210', 'MANAGER', '1234', now);
  insertUser.run(uAgent1, 'Vikram Singh (Field Agent)', 'vikram@business.com', '9811122233', 'FIELD_AGENT', '1234', now);
  insertUser.run(uAgent2, 'Amit Kumar (Field Agent)', 'amit@business.com', '9822233344', 'FIELD_AGENT', '1234', now);
  insertUser.run(uCaller1, 'Pooja Verma (Telecaller)', 'pooja@business.com', '9833344455', 'CALLER', '1234', now);
  insertUser.run(uCaller2, 'Rohan Mehra (Telecaller)', 'rohan@business.com', '9844455566', 'CALLER', '1234', now);

  // ZERO fake demo leads: The database starts 100% clean so only real entered data appears.
}
