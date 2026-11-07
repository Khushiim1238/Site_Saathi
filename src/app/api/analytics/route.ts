import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    // 1. Total leads by status
    const statusCountsRaw = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM leads
      GROUP BY status
    `).all() as { status: string; count: number }[];

    const statusCounts: Record<string, number> = {
      UNCLAIMED: 0,
      CLAIMED: 0,
      CONTACTED: 0,
      INTERESTED: 0,
      QUOTE_SENT: 0,
      WON: 0,
      LOST: 0,
      INVALID: 0,
    };
    let totalLeads = 0;
    statusCountsRaw.forEach((row) => {
      statusCounts[row.status] = Number(row.count);
      totalLeads += Number(row.count);
    });

    const wonCount = statusCounts['WON'] || 0;
    const conversionRate = totalLeads > 0 ? ((wonCount / totalLeads) * 100).toFixed(1) : '0';

    // 2. Field Agent Performance
    const agentStats = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.phone,
        COUNT(l.id) as leads_captured,
        MAX(l.created_at) as last_submission_at
      FROM users u
      LEFT JOIN leads l ON u.id = l.captured_by_id
      WHERE u.role = 'FIELD_AGENT'
      GROUP BY u.id
      ORDER BY leads_captured DESC
    `).all();

    // 3. Telecaller Performance
    const callerStats = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.phone,
        COUNT(DISTINCT l.id) as leads_claimed,
        SUM(CASE WHEN l.status = 'WON' THEN 1 ELSE 0 END) as deals_won,
        (SELECT COUNT(*) FROM call_logs cl WHERE cl.caller_id = u.id) as total_calls_made
      FROM users u
      LEFT JOIN leads l ON u.id = l.claimed_by_id
      WHERE u.role = 'CALLER'
      GROUP BY u.id
      ORDER BY deals_won DESC, total_calls_made DESC
    `).all();

    // 4. Follow-up status
    const nowIso = new Date().toISOString();
    const pendingFollowUps = db.prepare(`
      SELECT COUNT(*) as count FROM follow_ups WHERE status = 'PENDING'
    `).get() as { count: number };

    const overdueFollowUps = db.prepare(`
      SELECT COUNT(*) as count FROM follow_ups WHERE status = 'PENDING' AND scheduled_at < ?
    `).get(nowIso) as { count: number };

    // 5. Recent Activity Audit Trail (latest 20 events)
    const recentActivities = db.prepare(`
      SELECT 
        a.*,
        u.name as user_name,
        u.role as user_role,
        l.project_name as lead_project_name,
        l.contact_phone as lead_contact_phone
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN leads l ON a.lead_id = l.id
      ORDER BY a.created_at DESC
      LIMIT 20
    `).all();

    return NextResponse.json({
      success: true,
      analytics: {
        totalLeads,
        wonCount,
        conversionRate,
        statusCounts,
        agentStats,
        callerStats,
        pendingFollowUps: pendingFollowUps.count,
        overdueFollowUps: overdueFollowUps.count,
        recentActivities,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load analytics' }, { status: 500 });
  }
}
