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
    const { user_id, reason = 'Released back to central pool' } = body;

    const db = getDb();
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(user_id) as any;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE leads
      SET status = 'UNCLAIMED', claimed_by_id = NULL, claimed_at = NULL, updated_at = ?
      WHERE id = ?
    `).run(now, id);

    const actId = 'act_' + randomUUID().substring(0, 8);
    db.prepare(`
      INSERT INTO activities (id, lead_id, user_id, action, description, created_at)
      VALUES (?, ?, ?, 'LEAD_REASSIGNED', ?, ?)
    `).run(actId, id, user_id, `${user?.name || 'User'} released lead back to pool: ${reason}`, now);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Release lead error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to release lead' }, { status: 500 });
  }
}

