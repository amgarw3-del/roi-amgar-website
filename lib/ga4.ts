import { BetaAnalyticsDataClient } from "@google-analytics/data";

/** trim מסיר \n \r \t רווחים מכל צד — מונע באגים מ-env vars שנשמרו עם שורה חדשה */
function env(key: string) {
  return process.env[key]?.trim() ?? "";
}

function getClient() {
  const email = env("GA4_SA_CLIENT_EMAIL");
  const key = env("GA4_SA_PRIVATE_KEY").replace(/\\n/g, "\n");
  if (!email || !key) return null;
  return new BetaAnalyticsDataClient({
    credentials: { client_email: email, private_key: key },
  });
}

function getPropertyId() {
  const id = env("GA4_PROPERTY_ID");
  return id || null;
}

export function isGa4Configured() {
  return !!(env("GA4_SA_CLIENT_EMAIL") && env("GA4_SA_PRIVATE_KEY") && env("GA4_PROPERTY_ID"));
}

export interface TrafficKpis {
  users: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  avgEngagementTimeSec: number;
  bounceRate: number;
}

export interface DayPoint {
  date: string; // "DD/MM"
  users: number;
  sessions: number;
}

export interface PageRow {
  path: string;
  pageViews: number;
  avgTimeSec: number;
}

export interface DeviceRow {
  device: string;
  sessions: number;
}

export interface SourceRow {
  channel: string;
  sessions: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function metricVal(row: any, idx: number): number {
  return parseFloat(row?.metricValues?.[idx]?.value ?? "0") || 0;
}

export async function getTrafficKpis(days = 30): Promise<TrafficKpis | null> {
  try {
    const client = getClient();
    const propertyId = getPropertyId();
    if (!client || !propertyId) return null;

    const [res] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      metrics: [
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
      ],
    });

    const row = res.rows?.[0];
    return {
      users: metricVal(row, 0),
      newUsers: metricVal(row, 1),
      sessions: metricVal(row, 2),
      pageViews: metricVal(row, 3),
      avgEngagementTimeSec: metricVal(row, 4),
      bounceRate: metricVal(row, 5),
    };
  } catch {
    return null;
  }
}

export async function getTrafficByDay(days = 30): Promise<DayPoint[]> {
  try {
    const client = getClient();
    const propertyId = getPropertyId();
    if (!client || !propertyId) return [];

    const [res] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "totalUsers" }, { name: "sessions" }],
      orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
    });

    return (res.rows ?? []).map((row) => {
      const raw = row.dimensionValues?.[0]?.value ?? ""; // "20250101"
      const date = raw.length === 8 ? `${raw.slice(6)}/${raw.slice(4, 6)}` : raw;
      return {
        date,
        users: metricVal(row, 0),
        sessions: metricVal(row, 1),
      };
    });
  } catch {
    return [];
  }
}

export async function getTopPages(days = 30, limit = 10): Promise<PageRow[]> {
  try {
    const client = getClient();
    const propertyId = getPropertyId();
    if (!client || !propertyId) return [];

    const [res] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "averageSessionDuration" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit,
    });

    return (res.rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? "/",
      pageViews: metricVal(row, 0),
      avgTimeSec: metricVal(row, 1),
    }));
  } catch {
    return [];
  }
}

export async function getDeviceBreakdown(days = 30): Promise<DeviceRow[]> {
  try {
    const client = getClient();
    const propertyId = getPropertyId();
    if (!client || !propertyId) return [];

    const [res] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });

    const DEVICE_LABELS: Record<string, string> = {
      mobile: "מובייל",
      desktop: "מחשב",
      tablet: "טאבלט",
    };

    return (res.rows ?? []).map((row) => {
      const raw = row.dimensionValues?.[0]?.value ?? "";
      return {
        device: DEVICE_LABELS[raw] ?? raw,
        sessions: metricVal(row, 0),
      };
    });
  } catch {
    return [];
  }
}

export async function getTrafficSources(days = 30): Promise<SourceRow[]> {
  try {
    const client = getClient();
    const propertyId = getPropertyId();
    if (!client || !propertyId) return [];

    const [res] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 6,
    });

    const CHANNEL_LABELS: Record<string, string> = {
      "Organic Search": "חיפוש",
      Direct: "ישיר",
      "Organic Social": "רשתות חברתיות",
      Referral: "הפניות",
      Email: "אימייל",
      "(other)": "אחר",
    };

    return (res.rows ?? []).map((row) => {
      const raw = row.dimensionValues?.[0]?.value ?? "";
      return {
        channel: CHANNEL_LABELS[raw] ?? raw,
        sessions: metricVal(row, 0),
      };
    });
  } catch {
    return [];
  }
}
