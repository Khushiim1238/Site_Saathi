import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { User } from '@/lib/types';
import { randomUUID } from 'node:crypto';

export async function GET() {
  try {
    const db = getDb();
    const users = db.prepare('SELECT id, name, email, phone, role, pin, is_active, created_at FROM users WHERE is_active = 1 ORDER BY role DESC, name ASC').all() as unknown as User[];
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, role = 'FIELD_AGENT', phone } = body;
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const db = getDb();
    const id = 'user_' + randomUUID().substring(0, 8);
    const cleanName = name.trim();
    const email = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}@veer.local`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, name, email, phone, role, pin, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, '1234', 1, ?)
    `).run(id, cleanName, email, phone ? phone.trim() : null, role, now);

    const newUser: User = {
      id,
      name: cleanName,
      email,
      phone: phone ? phone.trim() : '',
      role: role as any,
      pin: '1234',
      is_active: 1,
      created_at: now,
    };

    return NextResponse.json({ success: true, user: newUser });
  } catch (err: any) {
    console.error('Error creating user:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to create user' }, { status: 500 });
  }
}

