import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'node:crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const db = getDb();

    if (action === 'CLEAR_ALL_LEADS') {
      // Wipes all leads, calls, reminders, and activities (clean production slate)
      db.exec(`
        DELETE FROM activities;
        DELETE FROM call_logs;
        DELETE FROM follow_ups;
        DELETE FROM leads;
      `);

      return NextResponse.json({
        success: true,
        message: 'All leads and call records have been wiped clean. Database is ready for real site entries.',
      });
    }

    if (action === 'CREATE_USER') {
      const { name, phone, role } = body;
      if (!name || !role) {
        return NextResponse.json({ success: false, error: 'Name and role are required' }, { status: 400 });
      }

      const id = 'user_' + randomUUID().substring(0, 8);
      const email = `${name.toLowerCase().replace(/\s+/g, '')}@business.local`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO users (id, name, email, phone, role, pin, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, '1234', 1, ?)
      `).run(id, name.trim(), email, phone ? phone.trim() : null, role, now);

      return NextResponse.json({ success: true, message: 'User created successfully', id });
    }

    if (action === 'DELETE_USER') {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
      }

      // Check if user has captured leads
      const leadCount = db.prepare('SELECT COUNT(*) as count FROM leads WHERE captured_by_id = ? OR claimed_by_id = ?').get(userId, userId) as { count: number };
      if (leadCount.count > 0) {
        // Just mark inactive
        db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(userId);
      } else {
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);
      }

      return NextResponse.json({ success: true, message: 'User removed' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('System reset error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Operation failed' }, { status: 500 });
  }
}

