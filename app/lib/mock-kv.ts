import fs from 'fs';
import path from 'path';

// Path to persist local mock data across dev server restarts
const DB_FILE = path.join(process.cwd(), '.kv-data.json');

// In-memory key-value cache
let memoryStore: Record<string, any> = {};
let isLoaded = false;

function loadStore() {
  if (isLoaded) return;
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      memoryStore = JSON.parse(data);
    }
  } catch (err) {
    console.warn('[MockKV] Failed to read .kv-data.json, starting with empty store:', err);
    memoryStore = {};
  }
  isLoaded = true;
}

let saveTimeout: NodeJS.Timeout | null = null;
function scheduleSave() {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
    } catch (err) {
      console.error('[MockKV] Failed to persist data to .kv-data.json:', err);
    }
  }, 100);
}

export class MockVercelKV {
  constructor() {
    loadStore();
  }

  async get<T = any>(key: string): Promise<T | null> {
    loadStore();
    const val = memoryStore[key];
    if (val === undefined) return null;
    return typeof val === 'object' ? JSON.parse(JSON.stringify(val)) : val;
  }

  async set(key: string, value: any, options?: any): Promise<'OK'> {
    loadStore();
    memoryStore[key] = value;
    scheduleSave();
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    loadStore();
    let count = 0;
    for (const k of keys) {
      if (k in memoryStore) {
        delete memoryStore[k];
        count++;
      }
    }
    if (count > 0) scheduleSave();
    return count;
  }

  async exists(...keys: string[]): Promise<number> {
    loadStore();
    let count = 0;
    for (const k of keys) {
      if (k in memoryStore) count++;
    }
    return count;
  }

  async keys(pattern: string = '*'): Promise<string[]> {
    loadStore();
    const all = Object.keys(memoryStore);
    if (!pattern || pattern === '*') return all;
    // Simple glob matching
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return all.filter((k) => regex.test(k));
  }

  async mget(...keys: string[]): Promise<(any | null)[]> {
    loadStore();
    return keys.map((k) => (memoryStore[k] !== undefined ? memoryStore[k] : null));
  }

  async incr(key: string): Promise<number> {
    return this.incrby(key, 1);
  }

  async incrby(key: string, amount: number): Promise<number> {
    loadStore();
    const current = Number(memoryStore[key] ?? 0);
    const updated = current + amount;
    memoryStore[key] = updated;
    scheduleSave();
    return updated;
  }

  async decr(key: string): Promise<number> {
    return this.incrby(key, -1);
  }

  async decrby(key: string, amount: number): Promise<number> {
    return this.incrby(key, -amount);
  }

  async hget<T = any>(key: string, field: string): Promise<T | null> {
    loadStore();
    const hash = memoryStore[key];
    if (!hash || typeof hash !== 'object') return null;
    return hash[field] ?? null;
  }

  async hset(key: string, objOrField: any, val?: any): Promise<number> {
    loadStore();
    if (!memoryStore[key] || typeof memoryStore[key] !== 'object') {
      memoryStore[key] = {};
    }
    let count = 0;
    if (typeof objOrField === 'object' && objOrField !== null) {
      for (const [k, v] of Object.entries(objOrField)) {
        memoryStore[key][k] = v;
        count++;
      }
    } else {
      memoryStore[key][objOrField] = val;
      count = 1;
    }
    scheduleSave();
    return count;
  }

  async hgetall<T = Record<string, any>>(key: string): Promise<T | null> {
    loadStore();
    const hash = memoryStore[key];
    if (!hash || typeof hash !== 'object') return null;
    return JSON.parse(JSON.stringify(hash));
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    loadStore();
    const hash = memoryStore[key];
    if (!hash || typeof hash !== 'object') return 0;
    let count = 0;
    for (const f of fields) {
      if (f in hash) {
        delete hash[f];
        count++;
      }
    }
    if (count > 0) scheduleSave();
    return count;
  }

  async hexists(key: string, field: string): Promise<number> {
    loadStore();
    const hash = memoryStore[key];
    if (!hash || typeof hash !== 'object') return 0;
    return field in hash ? 1 : 0;
  }

  async lpush(key: string, ...elements: any[]): Promise<number> {
    loadStore();
    if (!Array.isArray(memoryStore[key])) {
      memoryStore[key] = [];
    }
    memoryStore[key].unshift(...elements);
    scheduleSave();
    return memoryStore[key].length;
  }

  async rpush(key: string, ...elements: any[]): Promise<number> {
    loadStore();
    if (!Array.isArray(memoryStore[key])) {
      memoryStore[key] = [];
    }
    memoryStore[key].push(...elements);
    scheduleSave();
    return memoryStore[key].length;
  }

  async lrange<T = any>(key: string, start: number, stop: number): Promise<T[]> {
    loadStore();
    const list = memoryStore[key];
    if (!Array.isArray(list)) return [];
    const end = stop === -1 ? undefined : stop + 1;
    return list.slice(start, end);
  }

  async llen(key: string): Promise<number> {
    loadStore();
    const list = memoryStore[key];
    return Array.isArray(list) ? list.length : 0;
  }

  async sadd(key: string, ...members: any[]): Promise<number> {
    loadStore();
    if (!Array.isArray(memoryStore[key])) {
      memoryStore[key] = [];
    }
    let count = 0;
    for (const m of members) {
      if (!memoryStore[key].includes(m)) {
        memoryStore[key].push(m);
        count++;
      }
    }
    if (count > 0) scheduleSave();
    return count;
  }

  async srem(key: string, ...members: any[]): Promise<number> {
    loadStore();
    if (!Array.isArray(memoryStore[key])) return 0;
    const initialLen = memoryStore[key].length;
    memoryStore[key] = memoryStore[key].filter((m: any) => !members.includes(m));
    const removed = initialLen - memoryStore[key].length;
    if (removed > 0) scheduleSave();
    return removed;
  }

  async smembers<T = any>(key: string): Promise<T[]> {
    loadStore();
    const set = memoryStore[key];
    return Array.isArray(set) ? [...set] : [];
  }

  async sismember(key: string, member: any): Promise<number> {
    loadStore();
    const set = memoryStore[key];
    return Array.isArray(set) && set.includes(member) ? 1 : 0;
  }

  async expire(_key: string, _seconds: number): Promise<number> {
    return 1;
  }

  async expireat(_key: string, _timestamp: number): Promise<number> {
    return 1;
  }

  async ttl(_key: string): Promise<number> {
    return -1;
  }

  pipeline() {
    const queue: Array<() => Promise<any>> = [];
    const p: any = {
      get: (k: string) => { queue.push(() => this.get(k)); return p; },
      set: (k: string, v: any) => { queue.push(() => this.set(k, v)); return p; },
      del: (...k: string[]) => { queue.push(() => this.del(...k)); return p; },
      incr: (k: string) => { queue.push(() => this.incr(k)); return p; },
      decr: (k: string) => { queue.push(() => this.decr(k)); return p; },
      exec: async () => {
        const results = [];
        for (const fn of queue) {
          results.push(await fn());
        }
        return results;
      }
    };
    return p;
  }

  multi() {
    return this.pipeline();
  }

  async *scanIterator(options?: any): AsyncIterable<string> {
    const all = await this.keys(options?.match || '*');
    for (const key of all) {
      yield key;
    }
  }
}

export const kv = new MockVercelKV();
export const VercelKV = MockVercelKV;
export function createClient() {
  return kv;
}
export default kv;
