import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { User } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    const users = db.prepare('SELECT id, name, email, phone, role, pin, is_active, created_at FROM users WHERE is_active = 1').all() as unknown as User[];
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

