import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const base = process.env.TXLINE_BASE_URL ?? 'https://txline.txodds.com';
const headers = {
  Authorization: `Bearer ${process.env.TXLINE_JWT}`,
  'X-Api-Token': process.env.TXLINE_API_KEY ?? '',
};

async function tryGet(label: string, path: string, params: Record<string, unknown>) {
  try {
    const res = await axios.get(`${base}${path}`, { headers, params, timeout: 15000 });
    const data = res.data;
    const count = Array.isArray(data) ? data.length : Array.isArray(data?.fixtures) ? data.fixtures.length : Array.isArray(data?.data) ? data.data.length : '?';
    console.log(`OK ${label}: status=${res.status} count=${count}`);
    if (typeof count === 'number' && count > 0 && count <= 3) {
      console.log(JSON.stringify(data, null, 2).slice(0, 800));
    }
    return count;
  } catch (e: any) {
    console.log(`FAIL ${label}: ${e.response?.status ?? e.message}`);
    return 0;
  }
}

async function probeBase(label: string, baseUrl: string) {
  console.log(`\n=== ${label} (${baseUrl}) ===`);
  const from = '2026-07-04T00:00:00Z';
  const to = '2026-07-05T23:59:59Z';
  const cid = 72;
  const h = { ...headers };

  async function get(path: string, params: Record<string, unknown>) {
    try {
      const res = await axios.get(`${baseUrl}${path}`, { headers: h, params, timeout: 15000 });
      const data = res.data;
      const count = Array.isArray(data) ? data.length : Array.isArray(data?.fixtures) ? data.fixtures.length : Array.isArray(data?.data) ? data.data.length : '?';
      console.log(`OK ${path}: count=${count}`);
      return count;
    } catch (e: any) {
      console.log(`FAIL ${path}: ${e.response?.status ?? e.message}`);
      return 0;
    }
  }

  await get('/api/fixtures/snapshot', { competitionId: cid });
  await get('/api/fixtures', { competitionId: cid, from, to, statusId: 2 });
}

async function main() {
  await probeBase('configured', base);
  await probeBase('mainnet', 'https://txline.txodds.com');
  await probeBase('devnet', 'https://txline-dev.txodds.com');
}

main();
