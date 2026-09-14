import fs from 'fs';
import path from 'path';

export interface DailyFirebaseUsage {
  date: string; // YYYY-MM-DD
  reads: number;
  writes: number;
  deletes: number;
  categories: {
    cases: { reads: number; writes: number; deletes: number };
    users: { reads: number; writes: number; deletes: number };
    notifications: { reads: number; writes: number; deletes: number };
    tasks: { reads: number; writes: number; deletes: number };
    auth: { reads: number; writes: number; deletes: number };
    other: { reads: number; writes: number; deletes: number };
  };
  hourly: { [hour: string]: { reads: number; writes: number; deletes: number } };
  lastUpdated: number;
}

export interface FirebaseHistoryRecord {
  date: string;
  reads: number;
  writes: number;
  deletes: number;
}

export interface FirebaseQuotaStats {
  today: {
    date: string;
    reads: number;
    writes: number;
    deletes: number;
    limits: {
      reads: number;
      writes: number;
      deletes: number;
    };
    remaining: {
      reads: number;
      writes: number;
      deletes: number;
    };
    percentages: {
      reads: number;
      writes: number;
      deletes: number;
    };
    status: 'safe' | 'moderate' | 'warning' | 'critical';
    statusMessage: string;
    categories: DailyFirebaseUsage['categories'];
    hourly: { hour: number; reads: number; writes: number; deletes: number }[];
  };
  history: FirebaseHistoryRecord[];
  sparkPlan: {
    planName: string;
    readsLimit: number;
    writesLimit: number;
    deletesLimit: number;
    storageLimitMb: number;
    resetSchedule: string;
    nextResetIso: string;
    projectId: string;
    databaseId: string;
    consoleUsageUrl: string;
  };
}

const USAGE_FILE_PATH = path.join(process.cwd(), 'firebase-daily-usage.json');
const SPARK_READS_LIMIT = 50000;
const SPARK_WRITES_LIMIT = 20000;
const SPARK_DELETES_LIMIT = 20000;

function getTodayUtcString(): string {
  const d = new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNextResetUtc(): Date {
  const now = new Date();
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return reset;
}

function createEmptyDaily(date: string): DailyFirebaseUsage {
  return {
    date,
    reads: 0,
    writes: 0,
    deletes: 0,
    categories: {
      cases: { reads: 0, writes: 0, deletes: 0 },
      users: { reads: 0, writes: 0, deletes: 0 },
      notifications: { reads: 0, writes: 0, deletes: 0 },
      tasks: { reads: 0, writes: 0, deletes: 0 },
      auth: { reads: 0, writes: 0, deletes: 0 },
      other: { reads: 0, writes: 0, deletes: 0 },
    },
    hourly: {},
    lastUpdated: Date.now(),
  };
}

class FirebaseUsageTrackerService {
  private currentDaily: DailyFirebaseUsage;
  private history: FirebaseHistoryRecord[] = [];
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.currentDaily = createEmptyDaily(getTodayUtcString());
    this.loadFromFile();
    this.ensureToday();
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(USAGE_FILE_PATH)) {
        const raw = fs.readFileSync(USAGE_FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (data && data.currentDaily && data.currentDaily.date) {
          this.currentDaily = data.currentDaily;
        }
        if (Array.isArray(data.history)) {
          this.history = data.history;
        }
      }
    } catch (e) {
      console.warn('[FirebaseUsageTracker] Failed to load usage file, initializing clean stats:', e);
    }
  }

  private scheduleSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      try {
        const payload = {
          currentDaily: this.currentDaily,
          history: this.history.slice(-30), // keep last 30 days
        };
        fs.writeFileSync(USAGE_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
      } catch (err) {
        console.warn('[FirebaseUsageTracker] Save error:', err);
      }
    }, 2000);
  }

  private ensureToday() {
    const today = getTodayUtcString();
    if (this.currentDaily.date !== today) {
      // Archive previous day if it has operations
      if (this.currentDaily.reads > 0 || this.currentDaily.writes > 0 || this.currentDaily.deletes > 0) {
        this.history.push({
          date: this.currentDaily.date,
          reads: this.currentDaily.reads,
          writes: this.currentDaily.writes,
          deletes: this.currentDaily.deletes,
        });
      }
      this.currentDaily = createEmptyDaily(today);
      this.scheduleSave();
    }
  }

  public recordRead(count = 1, category: keyof DailyFirebaseUsage['categories'] = 'other') {
    if (count <= 0) return;
    this.ensureToday();
    this.currentDaily.reads += count;
    if (this.currentDaily.categories[category]) {
      this.currentDaily.categories[category].reads += count;
    } else {
      this.currentDaily.categories.other.reads += count;
    }
    const currentHour = new Date().getUTCHours();
    if (!this.currentDaily.hourly[currentHour]) {
      this.currentDaily.hourly[currentHour] = { reads: 0, writes: 0, deletes: 0 };
    }
    this.currentDaily.hourly[currentHour].reads += count;
    this.currentDaily.lastUpdated = Date.now();
    this.scheduleSave();
  }

  public recordWrite(count = 1, category: keyof DailyFirebaseUsage['categories'] = 'other') {
    if (count <= 0) return;
    this.ensureToday();
    this.currentDaily.writes += count;
    if (this.currentDaily.categories[category]) {
      this.currentDaily.categories[category].writes += count;
    } else {
      this.currentDaily.categories.other.writes += count;
    }
    const currentHour = new Date().getUTCHours();
    if (!this.currentDaily.hourly[currentHour]) {
      this.currentDaily.hourly[currentHour] = { reads: 0, writes: 0, deletes: 0 };
    }
    this.currentDaily.hourly[currentHour].writes += count;
    this.currentDaily.lastUpdated = Date.now();
    this.scheduleSave();
  }

  public recordDelete(count = 1, category: keyof DailyFirebaseUsage['categories'] = 'other') {
    if (count <= 0) return;
    this.ensureToday();
    this.currentDaily.deletes += count;
    if (this.currentDaily.categories[category]) {
      this.currentDaily.categories[category].deletes += count;
    } else {
      this.currentDaily.categories.other.deletes += count;
    }
    const currentHour = new Date().getUTCHours();
    if (!this.currentDaily.hourly[currentHour]) {
      this.currentDaily.hourly[currentHour] = { reads: 0, writes: 0, deletes: 0 };
    }
    this.currentDaily.hourly[currentHour].deletes += count;
    this.currentDaily.lastUpdated = Date.now();
    this.scheduleSave();
  }

  public recordBatch(data: {
    reads?: number;
    writes?: number;
    deletes?: number;
    category?: keyof DailyFirebaseUsage['categories'];
  }) {
    const cat = data.category || 'other';
    if (data.reads && data.reads > 0) this.recordRead(data.reads, cat);
    if (data.writes && data.writes > 0) this.recordWrite(data.writes, cat);
    if (data.deletes && data.deletes > 0) this.recordDelete(data.deletes, cat);
  }

  public getStats(projectId: string = 'gen-lang-client-0215506885', databaseId: string = 'ai-studio-b68ab48d-678f-40d2-8599-d689643a1dea'): FirebaseQuotaStats {
    this.ensureToday();
    const reads = this.currentDaily.reads;
    const writes = this.currentDaily.writes;
    const deletes = this.currentDaily.deletes;

    const readsPct = Number(((reads / SPARK_READS_LIMIT) * 100).toFixed(2));
    const writesPct = Number(((writes / SPARK_WRITES_LIMIT) * 100).toFixed(2));
    const deletesPct = Number(((deletes / SPARK_DELETES_LIMIT) * 100).toFixed(2));

    const maxPct = Math.max(readsPct, writesPct, deletesPct);
    let status: 'safe' | 'moderate' | 'warning' | 'critical' = 'safe';
    let statusMessage = 'কোটা নিরাপদ অবস্থায় আছে। যথেষ্ট ফ্রি কোটা অবশিষ্ট আছে।';

    if (maxPct >= 90) {
      status = 'critical';
      statusMessage = 'সতর্কতা: কোটা সীমা অতিক্রম করার খুব কাছাকাছি! অতিরিক্ত রিড/রাইট সীমিত করুন।';
    } else if (maxPct >= 70) {
      status = 'warning';
      statusMessage = 'সতর্কতা: আজকের কোটার ৭০% এর বেশি ব্যবহৃত হয়েছে। অপ্টিমাইজেশন ক্যাশ সক্রিয় রাখুন।';
    } else if (maxPct >= 40) {
      status = 'moderate';
      statusMessage = 'কোটার স্বাভাবিক ব্যবহার হচ্ছে। সিস্টেম সন্তোষজনক চলছে।';
    }

    const hourlyArr = [];
    for (let h = 0; h < 24; h++) {
      const hData = this.currentDaily.hourly[h] || { reads: 0, writes: 0, deletes: 0 };
      hourlyArr.push({
        hour: h,
        reads: hData.reads,
        writes: hData.writes,
        deletes: hData.deletes,
      });
    }

    return {
      today: {
        date: this.currentDaily.date,
        reads,
        writes,
        deletes,
        limits: {
          reads: SPARK_READS_LIMIT,
          writes: SPARK_WRITES_LIMIT,
          deletes: SPARK_DELETES_LIMIT,
        },
        remaining: {
          reads: Math.max(0, SPARK_READS_LIMIT - reads),
          writes: Math.max(0, SPARK_WRITES_LIMIT - writes),
          deletes: Math.max(0, SPARK_DELETES_LIMIT - deletes),
        },
        percentages: {
          reads: readsPct,
          writes: writesPct,
          deletes: deletesPct,
        },
        status,
        statusMessage,
        categories: this.currentDaily.categories,
        hourly: hourlyArr,
      },
      history: this.history.slice(-14),
      sparkPlan: {
        planName: 'Firebase Spark Plan (Free Tier)',
        readsLimit: SPARK_READS_LIMIT,
        writesLimit: SPARK_WRITES_LIMIT,
        deletesLimit: SPARK_DELETES_LIMIT,
        storageLimitMb: 1024,
        resetSchedule: 'প্রতিদিন রাত ১২:০০ UTC (বাংলাদেশ সময় সকাল ০৬:০০ টা)',
        nextResetIso: getNextResetUtc().toISOString(),
        projectId,
        databaseId,
        consoleUsageUrl: `https://console.firebase.google.com/project/${projectId}/firestore/databases/${databaseId}/usage`,
      },
    };
  }
}

export const firebaseUsageTracker = new FirebaseUsageTrackerService();
