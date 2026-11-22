import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'node:crypto';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const claimedById = searchParams.get('claimed_by_id');
    const capturedById = searchParams.get('captured_by_id');
    const search = searchParams.get('search')?.trim();

    let query = `
      SELECT 
        l.*,
        u_cap.name as captured_by_name,
        u_clm.name as claimed_by_name
      FROM leads l
      LEFT JOIN users u_cap ON l.captured_by_id = u_cap.id
      LEFT JOIN users u_clm ON l.claimed_by_id = u_clm.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND l.status = ?`;
      params.push(status);
    }

    if (claimedById) {
      query += ` AND l.claimed_by_id = ?`;
      params.push(claimedById);
    }

    if (capturedById) {
      query += ` AND l.captured_by_id = ?`;
      params.push(capturedById);
    }

    if (search) {
      query += ` AND (l.project_name LIKE ? OR l.contact_name LIKE ? OR l.contact_phone LIKE ? OR l.site_address LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ` ORDER BY l.created_at DESC`;

    const leads = db.prepare(query).all(...params);
    return NextResponse.json({ success: true, leads });
  } catch (error) {
    if ((error as any)?.digest) throw error;
    console.error('Fetch leads error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      project_name,
      contact_name,
      contact_phone,
      contact_role = 'CONTRACTOR',
      site_address,
      latitude,
      longitude,
      maps_url,
      construction_stage = 'FOUNDATION',
      material_requirements,
      estimated_budget,
      notes,
      photo_url,
      captured_by_id,
      // Vardhman Site Visit Slip Fields
      ihb_name,
      ihb_phone,
      contractor_name,
      contractor_phone,
      engineer_name,
      engineer_phone,
      site_area,
      cement_brand,
      cement_rate,
      tmt_brand,
      cover_block_sizes,
    } = body;

    // Resolve primary contact name and phone from IHB / Contractor / Direct fields
    const resolvedContactName =
      contact_name?.trim() ||
      ihb_name?.trim() ||
      contractor_name?.trim() ||
      engineer_name?.trim() ||
      'Site Contact';

    const rawPhone =
      contact_phone ||
      ihb_phone ||
      contractor_phone ||
      engineer_phone ||
      '';

    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);

    const resolvedProjectName =
      project_name?.trim() ||
      (ihb_name?.trim() ? `${ihb_name.trim()} Site` : null) ||
      (contractor_name?.trim() ? `${contractor_name.trim()} Site` : null) ||
      (site_address?.trim() ? `${site_address.trim().split(',')[0]} Site` : 'Site Visit');

    if (!site_address?.trim() || !captured_by_id) {
      return NextResponse.json(
        { success: false, error: 'Site address/location and Agent ID are required.' },
        { status: 400 }
      );
    }

    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Please enter at least one valid 10-digit mobile number (IHB, Contractor, or Engineer).' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check duplicate
    const existing = db.prepare('SELECT id, project_name, contact_name, status FROM leads WHERE contact_phone = ?').get(cleanPhone) as any;
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Duplicate: Lead with phone ${cleanPhone} already exists as "${existing.project_name}" (Status: ${existing.status}).`,
          existingLead: existing,
        },
        { status: 409 }
      );
    }

    const leadId = 'lead_' + randomUUID().substring(0, 8);
    const now = new Date().toISOString();

    const calculatedMapsUrl =
      maps_url || (latitude && longitude ? `https://maps.google.com/?q=${latitude},${longitude}` : null);

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
      contact_role,
      site_address.trim(),
      latitude ? Number(latitude) : null,
      longitude ? Number(longitude) : null,
      calculatedMapsUrl,
      construction_stage,
      material_requirements ? material_requirements.trim() : null,
      estimated_budget ? estimated_budget.trim() : null,
      notes ? notes.trim() : null,
      photo_url || null,
      ihb_name ? ihb_name.trim() : null,
      ihb_phone ? ihb_phone.replace(/\D/g, '').slice(-10) : null,
      contractor_name ? contractor_name.trim() : null,
      contractor_phone ? contractor_phone.replace(/\D/g, '').slice(-10) : null,
      engineer_name ? engineer_name.trim() : null,
      engineer_phone ? engineer_phone.replace(/\D/g, '').slice(-10) : null,
      site_area ? site_area.trim() : null,
      cement_brand ? cement_brand.trim() : null,
      cement_rate ? cement_rate.trim() : null,
      tmt_brand ? tmt_brand.trim() : null,
      cover_block_sizes ? cover_block_sizes.trim() : null,
      captured_by_id,
      now,
      now
    );

    // Record activity
    const activityId = 'act_' + randomUUID().substring(0, 8);
    db.prepare(`
      INSERT INTO activities (id, lead_id, user_id, action, description, created_at)
      VALUES (?, ?, ?, 'LEAD_CREATED', 'Field agent logged new site lead.', ?)
    `).run(activityId, leadId, captured_by_id, now);

    return NextResponse.json({ success: true, leadId });
  } catch (error: any) {
    console.error('Create lead error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create lead' }, { status: 500 });
  }
}
