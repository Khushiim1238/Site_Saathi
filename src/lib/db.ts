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

  seedInitialData(db);
}

function seedInitialData(db: DatabaseSync) {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const now = new Date().toISOString();

  // Insert default users
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

  // If SEED_DEMO_DATA=false is set in .env, stop here and leave database 100% clean with zero fake leads
  if (process.env.SEED_DEMO_DATA === 'false') {
    return;
  }

  // Insert sample starter leads to test every state
  const insertLead = db.prepare(`
    INSERT INTO leads (
      id, project_name, contact_name, contact_phone, contact_role,
      site_address, latitude, longitude, maps_url, construction_stage,
      material_requirements, estimated_budget, notes, status,
      captured_by_id, claimed_by_id, claimed_at, last_contacted_at,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?
    )
  `);

  const insertActivity = db.prepare(`
    INSERT INTO activities (id, lead_id, user_id, action, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertCallLog = db.prepare(`
    INSERT INTO call_logs (id, lead_id, caller_id, call_status, notes, duration_seconds, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFollowUp = db.prepare(`
    INSERT INTO follow_ups (id, lead_id, caller_id, scheduled_at, reason, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Sample Lead 1: Fresh Unclaimed Lead in Pool
  const lead1Id = 'lead_demo_1';
  insertLead.run(
    lead1Id,
    'Skyline Heights Tower C',
    'Ramesh Patel',
    '9820011223',
    'BUILDER',
    'Plot 42, Sector 18, Commercial Zone',
    19.0760,
    72.8777,
    'https://maps.google.com/?q=19.0760,72.8777',
    'FOUNDATION',
    'TMT Steel (40 Tons), Grade 53 Cement (1200 Bags)',
    '₹28,00,000',
    'Visited site at 11 AM. In-charge contractor asked to call between 2-4 PM.',
    'UNCLAIMED',
    uAgent1,
    null,
    null,
    null,
    now,
    now
  );
  insertActivity.run('act_1', lead1Id, uAgent1, 'LEAD_CREATED', 'Field agent Vikram Singh logged this lead on-site.', now);

  // Sample Lead 2: Fresh Unclaimed Lead in Pool
  const lead2Id = 'lead_demo_2';
  insertLead.run(
    lead2Id,
    'Green Villa Luxury Residency',
    'Sunil Gujral',
    '9871122334',
    'OWNER',
    'Road No. 4, Palm Meadows Estate',
    28.4595,
    77.0266,
    'https://maps.google.com/?q=28.4595,77.0266',
    'BRICKWORK',
    'AAC Blocks, Ready Mix Plaster, Red Bricks',
    '₹12,50,000',
    'Owner building personal bungalow. Looking for high quality materials with fast delivery.',
    'UNCLAIMED',
    uAgent2,
    null,
    null,
    null,
    now,
    now
  );
  insertActivity.run('act_2', lead2Id, uAgent2, 'LEAD_CREATED', 'Field agent Amit Kumar logged this lead on-site.', now);

  // Sample Lead 3: Claimed & Follow-up Scheduled
  const lead3Id = 'lead_demo_3';
  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  insertLead.run(
    lead3Id,
    'Apex Horizon Warehouses',
    'Devendra Singh',
    '9819988776',
    'CONTRACTOR',
    'Industrial Area Phase 2, Highway Bypass',
    12.9716,
    77.5946,
    'https://maps.google.com/?q=12.9716,77.5946',
    'EXCAVATION',
    'Ready Mix Concrete (RMC), Structural Steel',
    '₹45,00,000',
    'Contractor handles 3 other sites in this zone.',
    'CLAIMED',
    uAgent1,
    uCaller1,
    now,
    now,
    now,
    now
  );
  insertActivity.run('act_3', lead3Id, uAgent1, 'LEAD_CREATED', 'Lead logged by Vikram Singh.', now);
  insertActivity.run('act_4', lead3Id, uCaller1, 'LEAD_CLAIMED', 'Pooja Verma claimed lead from pool.', now);
  insertCallLog.run('call_1', lead3Id, uCaller1, 'CALLBACK_REQUESTED', 'Spoke to site contractor Devendra. Requested rate sheet sent to WhatsApp, call tomorrow 11 AM.', 145, now);
  insertFollowUp.run('fu_1', lead3Id, uCaller1, tomorrow, 'Send revised TMT rate card and verify concrete dispatch schedule', 'PENDING', now);

  // Sample Lead 4: Converted / Deal Won
  const lead4Id = 'lead_demo_4';
  insertLead.run(
    lead4Id,
    'Shree Krishna Complex',
    'Anil Kulkarni',
    '9899001122',
    'CONTRACTOR',
    'Near Metro Station Gate 3',
    18.5204,
    73.8567,
    null,
    'PLASTERING',
    'Putty, Primer, Exterior Emulsion, Tiles',
    '₹18,00,000',
    'Advance payment received. First truck dispatched.',
    'WON',
    uAgent2,
    uCaller2,
    now,
    now,
    now,
    now
  );
  insertActivity.run('act_5', lead4Id, uAgent2, 'LEAD_CREATED', 'Lead logged by Amit Kumar.', now);
  insertActivity.run('act_6', lead4Id, uCaller2, 'LEAD_CLAIMED', 'Rohan Mehra claimed lead.', now);
  insertCallLog.run('call_2', lead4Id, uCaller2, 'WON', 'Agreed on ₹18L package price. Advance token collected.', 320, now);
}
