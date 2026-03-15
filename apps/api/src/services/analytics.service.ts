import { query } from '../config/database';

/**
 * Dashboard overview stats: today, this week, this month totals.
 */
export async function getDashboardStats() {
  const result = await query(`
    SELECT
      -- Today
      COALESCE(SUM(CASE WHEN b.start_time::date = CURRENT_DATE THEN 1 ELSE 0 END), 0)::int AS today_bookings,
      COALESCE(SUM(CASE WHEN b.start_time::date = CURRENT_DATE THEN b.price - b.discount ELSE 0 END), 0)::numeric AS today_revenue,
      -- This week
      COALESCE(SUM(CASE WHEN b.start_time >= date_trunc('week', NOW()) THEN 1 ELSE 0 END), 0)::int AS week_bookings,
      COALESCE(SUM(CASE WHEN b.start_time >= date_trunc('week', NOW()) THEN b.price - b.discount ELSE 0 END), 0)::numeric AS week_revenue,
      -- This month
      COALESCE(SUM(CASE WHEN b.start_time >= date_trunc('month', NOW()) THEN 1 ELSE 0 END), 0)::int AS month_bookings,
      COALESCE(SUM(CASE WHEN b.start_time >= date_trunc('month', NOW()) THEN b.price - b.discount ELSE 0 END), 0)::numeric AS month_revenue
    FROM bookings b
    WHERE b.status NOT IN ('cancelled')
  `);

  const conversationsResult = await query(`
    SELECT
      COALESCE(COUNT(*) FILTER (WHERE status = 'active'), 0)::int AS active_conversations
    FROM conversations
  `);

  const customersResult = await query(`
    SELECT COUNT(*)::int AS total_customers FROM customers
  `);

  const row = result.rows[0];
  const convRow = conversationsResult.rows[0];
  const custRow = customersResult.rows[0];

  return {
    today_bookings: row.today_bookings,
    today_revenue: parseFloat(row.today_revenue),
    week_bookings: row.week_bookings,
    week_revenue: parseFloat(row.week_revenue),
    month_bookings: row.month_bookings,
    month_revenue: parseFloat(row.month_revenue),
    active_conversations: convRow.active_conversations,
    total_customers: custRow.total_customers,
  };
}

/**
 * Revenue analytics grouped by period, plus per-court breakdown.
 */
export async function getRevenueAnalytics(period: 'week' | 'month' | 'year') {
  let dateFilter: string;
  let groupBy: string;
  let dateFormat: string;

  switch (period) {
    case 'week':
      dateFilter = `b.start_time >= NOW() - INTERVAL '7 days'`;
      groupBy = `date_trunc('day', b.start_time)`;
      dateFormat = `to_char(date_trunc('day', b.start_time), 'YYYY-MM-DD')`;
      break;
    case 'month':
      dateFilter = `b.start_time >= NOW() - INTERVAL '30 days'`;
      groupBy = `date_trunc('day', b.start_time)`;
      dateFormat = `to_char(date_trunc('day', b.start_time), 'YYYY-MM-DD')`;
      break;
    case 'year':
      dateFilter = `b.start_time >= NOW() - INTERVAL '12 months'`;
      groupBy = `date_trunc('month', b.start_time)`;
      dateFormat = `to_char(date_trunc('month', b.start_time), 'YYYY-MM')`;
      break;
  }

  const timelineResult = await query(`
    SELECT
      ${dateFormat} AS date,
      COALESCE(SUM(b.price - b.discount), 0)::numeric AS revenue,
      COUNT(*)::int AS bookings_count
    FROM bookings b
    WHERE b.status NOT IN ('cancelled') AND ${dateFilter}
    GROUP BY ${groupBy}
    ORDER BY ${groupBy}
  `);

  const perCourtResult = await query(`
    SELECT
      c.name AS court_name,
      COALESCE(SUM(b.price - b.discount), 0)::numeric AS revenue,
      COUNT(*)::int AS bookings
    FROM bookings b
    JOIN courts c ON c.id = b.court_id
    WHERE b.status NOT IN ('cancelled') AND ${dateFilter}
    GROUP BY c.id, c.name
    ORDER BY revenue DESC
  `);

  return {
    timeline: timelineResult.rows.map((r) => ({
      date: r.date,
      revenue: parseFloat(r.revenue),
      bookings_count: r.bookings_count,
    })),
    per_court: perCourtResult.rows.map((r) => ({
      court_name: r.court_name,
      revenue: parseFloat(r.revenue),
      bookings: r.bookings,
    })),
  };
}

/**
 * Booking analytics: daily distribution, peak hours, popular courts, sources, statuses.
 */
export async function getBookingAnalytics(period: 'week' | 'month' | 'year') {
  let dateFilter: string;

  switch (period) {
    case 'week':
      dateFilter = `b.start_time >= NOW() - INTERVAL '7 days'`;
      break;
    case 'month':
      dateFilter = `b.start_time >= NOW() - INTERVAL '30 days'`;
      break;
    case 'year':
      dateFilter = `b.start_time >= NOW() - INTERVAL '12 months'`;
      break;
  }

  // Bookings per day of week
  const perDayResult = await query(`
    SELECT
      EXTRACT(DOW FROM b.start_time)::int AS day_of_week,
      COUNT(*)::int AS bookings
    FROM bookings b
    WHERE b.status NOT IN ('cancelled') AND ${dateFilter}
    GROUP BY day_of_week
    ORDER BY day_of_week
  `);

  // Peak hours distribution
  const peakHoursResult = await query(`
    SELECT
      EXTRACT(HOUR FROM b.start_time)::int AS hour,
      COUNT(*)::int AS bookings
    FROM bookings b
    WHERE b.status NOT IN ('cancelled') AND ${dateFilter}
    GROUP BY hour
    ORDER BY hour
  `);

  // Popular courts
  const popularCourtsResult = await query(`
    SELECT
      c.name AS court_name,
      COUNT(*)::int AS bookings
    FROM bookings b
    JOIN courts c ON c.id = b.court_id
    WHERE b.status NOT IN ('cancelled') AND ${dateFilter}
    GROUP BY c.id, c.name
    ORDER BY bookings DESC
  `);

  // Booking source distribution
  const sourceResult = await query(`
    SELECT
      COALESCE(b.source, 'manual') AS source,
      COUNT(*)::int AS bookings
    FROM bookings b
    WHERE b.status NOT IN ('cancelled') AND ${dateFilter}
    GROUP BY b.source
    ORDER BY bookings DESC
  `);

  // Status distribution
  const statusResult = await query(`
    SELECT
      b.status,
      COUNT(*)::int AS count
    FROM bookings b
    WHERE ${dateFilter}
    GROUP BY b.status
    ORDER BY count DESC
  `);

  return {
    per_day: perDayResult.rows,
    peak_hours: peakHoursResult.rows,
    popular_courts: popularCourtsResult.rows,
    sources: sourceResult.rows,
    statuses: statusResult.rows,
  };
}

/**
 * Customer analytics: new per month, segment distribution, top spenders, retention.
 */
export async function getCustomerAnalytics() {
  // New customers per month (last 6 months)
  const newPerMonthResult = await query(`
    SELECT
      to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
      COUNT(*)::int AS new_customers
    FROM customers
    WHERE created_at >= NOW() - INTERVAL '6 months'
    GROUP BY date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at)
  `);

  // Segment distribution
  const segmentResult = await query(`
    SELECT
      segment,
      COUNT(*)::int AS count
    FROM customers
    GROUP BY segment
    ORDER BY count DESC
  `);

  // Top customers by spending
  const topCustomersResult = await query(`
    SELECT
      c.id,
      COALESCE(c.name, c.phone) AS name,
      c.total_bookings,
      c.total_spent
    FROM customers c
    ORDER BY c.total_spent DESC
    LIMIT 5
  `);

  // Retention: customers with more than one booking / total
  const retentionResult = await query(`
    SELECT
      COALESCE(COUNT(*) FILTER (WHERE total_bookings > 1), 0)::int AS returning_customers,
      COALESCE(COUNT(*), 0)::int AS total_customers
    FROM customers
    WHERE total_bookings > 0
  `);

  const ret = retentionResult.rows[0];
  const retentionRate =
    ret.total_customers > 0
      ? parseFloat(((ret.returning_customers / ret.total_customers) * 100).toFixed(1))
      : 0;

  return {
    new_per_month: newPerMonthResult.rows,
    segments: segmentResult.rows,
    top_customers: topCustomersResult.rows.map((r) => ({
      id: r.id,
      name: r.name,
      total_bookings: r.total_bookings,
      total_spent: parseFloat(r.total_spent),
    })),
    retention: {
      returning_customers: ret.returning_customers,
      total_customers: ret.total_customers,
      retention_rate: retentionRate,
    },
  };
}

/**
 * AI / conversation analytics.
 */
export async function getAIAnalytics() {
  const statsResult = await query(`
    SELECT
      COALESCE(COUNT(*), 0)::int AS total_conversations,
      COALESCE(COUNT(*) FILTER (WHERE resolved = true), 0)::int AS resolved,
      COALESCE(COUNT(*) FILTER (WHERE status = 'abandoned'), 0)::int AS abandoned
    FROM conversations
  `);

  const stats = statsResult.rows[0];
  const successRate =
    stats.total_conversations > 0
      ? parseFloat(((stats.resolved / stats.total_conversations) * 100).toFixed(1))
      : 0;

  // Average messages per conversation
  const avgMsgResult = await query(`
    SELECT
      COALESCE(AVG(jsonb_array_length(messages)), 0)::numeric AS avg_messages
    FROM conversations
    WHERE messages IS NOT NULL
  `);

  // Intent distribution
  const intentResult = await query(`
    SELECT
      COALESCE(intent, 'unknown') AS intent,
      COUNT(*)::int AS count
    FROM conversations
    GROUP BY intent
    ORDER BY count DESC
  `);

  // Most common tool calls (parse from messages JSONB)
  const toolsResult = await query(`
    SELECT
      msg->>'tool' AS tool_name,
      COUNT(*)::int AS call_count
    FROM conversations,
      jsonb_array_elements(messages) AS msg
    WHERE msg->>'role' = 'system' AND msg->>'tool' IS NOT NULL
    GROUP BY msg->>'tool'
    ORDER BY call_count DESC
    LIMIT 10
  `);

  return {
    total_conversations: stats.total_conversations,
    resolved: stats.resolved,
    abandoned: stats.abandoned,
    success_rate: successRate,
    avg_messages: parseFloat(parseFloat(avgMsgResult.rows[0].avg_messages).toFixed(1)),
    intents: intentResult.rows,
    top_tools: toolsResult.rows,
  };
}
