const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const dbPath = path.join(__dirname, 'data', 'crm.sqlite');
const db = new DatabaseSync(dbPath);

const body = {
  ihb_name: 'Sameer Bhai',
  ihb_phone: '8529509394',
  contractor_name: 'Saif',
  contractor_phone: '',
  engineer_name: '',
  engineer_phone: '',
  site_address: 'Sec-C Reliance Petrol Pump',
  construction_stage: 'Slab / Chhat Casting',
  site_area: '1500',
  cement_brand: 'JK PRO+',
  cement_rate: '360',
  tmt_brand: 'Rathi',
  cover_block_sizes: 'Slab 20mm',
  notes: '12200 x 11.5 = 140300',
  latitude: 28.5355,
  longitude: 77.3910,
  captured_by_id: 'user_agent_1',
};

const resolvedContactName =
  body.ihb_name?.trim() ||
  body.contractor_name?.trim() ||
  'Site Contact';

const rawPhone = body.ihb_phone || body.contractor_phone || body.engineer_phone || '';
const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);

const resolvedProjectName =
  (body.ihb_name?.trim() ? `${body.ihb_name.trim()} Site` : null) ||
  (body.site_address?.trim() ? `${body.site_address.trim().split(',')[0]} Site` : 'Site Visit');

const leadId = 'lead_' + randomUUID().substring(0, 8);
const now = new Date().toISOString();

console.log('Testing insert into leads...');
try {
  db.prepare(`
    INSERT INTO leads (
      id, project_name, contact_name, contact_phone, contact_role,
      site_address, latitude, longitude, maps_url, construction_stage,
      material_requirements, estimated_budget, notes, photo_url,
      ihb_name, ihb_phone, contractor_name, contractor_phone,
      engineer_name, engineer_phone, site_area, cement_brand,
      cement_rate, tmt_brand, cover_block_sizes,
      status, captured_by_id, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      'UNCLAIMED', ?, ?, ?
    )
  `).run(
    leadId,
    resolvedProjectName,
    resolvedContactName,
    cleanPhone,
    'CONTRACTOR',
    body.site_address.trim(),
    body.latitude ? Number(body.latitude) : null,
    body.longitude ? Number(body.longitude) : null,
    `https://maps.google.com/?q=${body.latitude},${body.longitude}`,
    body.construction_stage,
    null,
    null,
    body.notes ? body.notes.trim() : null,
    null,
    body.ihb_name ? body.ihb_name.trim() : null,
    body.ihb_phone ? body.ihb_phone.replace(/\D/g, '').slice(-10) : null,
    body.contractor_name ? body.contractor_name.trim() : null,
    body.contractor_phone ? body.contractor_phone.replace(/\D/g, '').slice(-10) : null,
    body.engineer_name ? body.engineer_name.trim() : null,
    body.engineer_phone ? body.engineer_phone.replace(/\D/g, '').slice(-10) : null,
    body.site_area ? body.site_area.trim() : null,
    body.cement_brand ? body.cement_brand.trim() : null,
    body.cement_rate ? body.cement_rate.trim() : null,
    body.tmt_brand ? body.tmt_brand.trim() : null,
    body.cover_block_sizes ? body.cover_block_sizes.trim() : null,
    body.captured_by_id,
    now,
    now
  );
  console.log('Insert SUCCESS! Lead ID:', leadId);
} catch (err) {
  console.error('Insert FAILED:', err);
}
