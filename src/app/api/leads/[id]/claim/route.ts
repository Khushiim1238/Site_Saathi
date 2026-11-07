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
    const { caller_id } = body;

    if (!caller_id) {
      return NextResponse.json({ success: false, error: 'Caller ID is required' }, { status: 400 });
    }

    const db = getDb();
    const lead = db.prepare('SELECT id, status, claimed_by_id FROM leads WHERE id = ?').get(id) as any;

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    if (lead.status !== 'UNCLAIMED' && lead.claimed_by_id && lead.claimed_by_id !== caller_id) {
      return NextResponse.json(
        { success: false, error: 'This lead has already been claimed by another telecaller.' },
        { status: 409 }
      );
    }

    const caller = db.prepare('SELECT name FROM users WHERE id = ?').get(caller_id) as any;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE leads
      SET status = 'CLAIMED', claimed_by_id = ?, claimed_at = ?, updated_at = ?
      WHERE id = ?
    `).run(caller_id, now, now, id);

    const actId = 'act_' + randomUUID().substring(0, 8);
    db.prepare(`
      INSERT INTO activities (id, lead_id, user_id, action, description, created_at)
      VALUES (?, ?, ?, 'LEAD_CLAIMED', ?, ?)
    `).run(actId, id, caller_id, `${caller?.name || 'Telecaller'} claimed this lead from the pool.`, now);

    return NextResponse.json({ success: true, message: 'Lead claimed successfully' });
  } catch (error: any) {
    console.error('Claim lead error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to claim lead' }, { status: 500 });
  }
}

