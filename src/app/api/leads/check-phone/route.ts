import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get('phone')?.trim();

    if (!phone || phone.length < 5) {
      return NextResponse.json({ exists: false });
    }

    const db = getDb();
    // Normalize phone (remove +91 or leading 0s or spaces)
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    const existingLead = db.prepare(`
      SELECT l.id, l.project_name, l.contact_name, l.status, l.created_at, u.name as captured_by_name
      FROM leads l
      LEFT JOIN users u ON l.captured_by_id = u.id
      WHERE l.contact_phone LIKE ?
      ORDER BY l.created_at DESC
      LIMIT 1
    `).get(`%${cleanPhone}%`) as any;

    if (existingLead) {
      return NextResponse.json({
        exists: true,
        lead: existingLead,
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    if ((error as any)?.digest) throw error;
    console.error('Check phone error:', error);
    return NextResponse.json({ exists: false, error: 'Database check failed' }, { status: 500 });
  }
}

