import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'node:crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      caller_id,
      call_status, // INTERESTED, CALLBACK_REQUESTED, QUOTE_SENT, WON, NOT_INTERESTED, UNREACHABLE, INVALID_NUMBER
      notes,
      duration_seconds = 0,
      follow_up_date,
      follow_up_reason,
      lost_reason,
    } = body;

    if (!caller_id || !call_status) {
      return NextResponse.json(
        { success: false, error: 'Caller ID and Call Status are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date().toISOString();
    const caller = db.prepare('SELECT name FROM users WHERE id = ?').get(caller_id) as any;

    // 1. Map call_status to lead status
    let newLeadStatus = 'CONTACTED';
    if (call_status === 'INTERESTED') newLeadStatus = 'INTERESTED';
    else if (call_status === 'QUOTE_SENT') newLeadStatus = 'QUOTE_SENT';
    else if (call_status === 'WON') newLeadStatus = 'WON';
    else if (call_status === 'NOT_INTERESTED') newLeadStatus = 'LOST';
    else if (call_status === 'INVALID_NUMBER') newLeadStatus = 'INVALID';
    else if (call_status === 'CALLBACK_REQUESTED' || call_status === 'UNREACHABLE') newLeadStatus = 'CLAIMED';

    // 2. Insert call log
    const callLogId = 'call_' + randomUUID().substring(0, 8);
    db.prepare(`
      INSERT INTO call_logs (id, lead_id, caller_id, call_status, notes, duration_seconds, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(callLogId, id, caller_id, call_status, notes || null, Number(duration_seconds) || 0, now);

    // 3. Update lead
    db.prepare(`
      UPDATE leads
      SET 
        status = ?,
        last_contacted_at = ?,
        lost_reason = ?,
        updated_at = ?
      WHERE id = ?
    `).run(newLeadStatus, now, lost_reason || (call_status === 'NOT_INTERESTED' ? notes : null), now, id);

    // 4. Record follow-up if requested
    let followUpId: string | null = null;
    if (follow_up_date) {
      followUpId = 'fu_' + randomUUID().substring(0, 8);
      db.prepare(`
        INSERT INTO follow_ups (id, lead_id, caller_id, scheduled_at, reason, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
      `).run(followUpId, id, caller_id, follow_up_date, follow_up_reason || notes || 'Scheduled follow-up call', now);
    }

    // 5. Record activity
    const actId = 'act_' + randomUUID().substring(0, 8);
    let desc = `${caller?.name || 'Telecaller'} called customer. Status: ${call_status}.`;
    if (notes) desc += ` Notes: "${notes}"`;
    if (follow_up_date) desc += ` Follow-up scheduled for ${new Date(follow_up_date).toLocaleString()}.`;

    db.prepare(`
      INSERT INTO activities (id, lead_id, user_id, action, description, created_at)
      VALUES (?, ?, ?, 'CALL_LOGGED', ?, ?)
    `).run(actId, id, caller_id, desc, now);

    return NextResponse.json({
      success: true,
      callLogId,
      followUpId,
      newLeadStatus,
    });
  } catch (error: any) {
    console.error('Log call error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to log call' }, { status: 500 });
  }
}

