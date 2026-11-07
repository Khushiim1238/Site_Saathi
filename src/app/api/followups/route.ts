import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const callerId = searchParams.get('caller_id');
    const status = searchParams.get('status') || 'PENDING';

    const db = getDb();
    let query = `
      SELECT 
        fu.*,
        l.project_name as lead_project_name,
        l.contact_name as lead_contact_name,
        l.contact_phone as lead_contact_phone,
        l.site_address as lead_site_address,
        u.name as caller_name
      FROM follow_ups fu
      JOIN leads l ON fu.lead_id = l.id
      JOIN users u ON fu.caller_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (callerId) {
      query += ` AND fu.caller_id = ?`;
      params.push(callerId);
    }

    if (status !== 'ALL') {
      query += ` AND fu.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY fu.scheduled_at ASC`;

    const followUps = db.prepare(query).all(...params);
    return NextResponse.json({ success: true, followUps });
  } catch (error) {
    if ((error as any)?.digest) throw error;
    console.error('Fetch followups error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch followups' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status = 'COMPLETED' } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Follow-up ID is required' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE follow_ups
      SET status = ?, completed_at = ?
      WHERE id = ?
    `).run(status, status === 'COMPLETED' ? now : null, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update followup error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update followup' }, { status: 500 });
  }
}
