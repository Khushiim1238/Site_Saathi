import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const lead = db.prepare(`
      SELECT 
        l.*,
        u_cap.name as captured_by_name,
        u_clm.name as claimed_by_name
      FROM leads l
      LEFT JOIN users u_cap ON l.captured_by_id = u_cap.id
      LEFT JOIN users u_clm ON l.claimed_by_id = u_clm.id
      WHERE l.id = ?
    `).get(id) as any;

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const callLogs = db.prepare(`
      SELECT cl.*, u.name as caller_name
      FROM call_logs cl
      LEFT JOIN users u ON cl.caller_id = u.id
      WHERE cl.lead_id = ?
      ORDER BY cl.created_at DESC
    `).all(id);

    const followUps = db.prepare(`
      SELECT fu.*, u.name as caller_name
      FROM follow_ups fu
      LEFT JOIN users u ON fu.caller_id = u.id
      WHERE fu.lead_id = ?
      ORDER BY fu.scheduled_at ASC
    `).all(id);

    const activities = db.prepare(`
      SELECT a.*, u.name as user_name
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.lead_id = ?
      ORDER BY a.created_at DESC
    `).all(id);

    return NextResponse.json({
      success: true,
      lead,
      callLogs,
      followUps,
      activities,
    });
  } catch (error) {
    console.error('Fetch lead details error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch lead details' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, lost_reason, user_id, notes } = body;
    const db = getDb();

    const now = new Date().toISOString();
    let updateQuery = `UPDATE leads SET updated_at = ?`;
    const updateParams: any[] = [now];

    if (status) {
      updateQuery += `, status = ?`;
      updateParams.push(status);
    }
    if (lost_reason !== undefined) {
      updateQuery += `, lost_reason = ?`;
      updateParams.push(lost_reason);
    }
    if (notes !== undefined) {
      updateQuery += `, notes = ?`;
      updateParams.push(notes);
    }

    updateQuery += ` WHERE id = ?`;
    updateParams.push(id);

    db.prepare(updateQuery).run(...updateParams);

    if (user_id && status) {
      const actId = 'act_' + Math.random().toString(36).substring(2, 9);
      db.prepare(`
        INSERT INTO activities (id, lead_id, user_id, action, description, created_at)
        VALUES (?, ?, ?, 'STATUS_CHANGED', ?, ?)
      `).run(actId, id, user_id, `Status updated to ${status}${lost_reason ? ` (Reason: ${lost_reason})` : ''}`, now);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update lead error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update lead' }, { status: 500 });
  }
}

