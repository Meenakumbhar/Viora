// Applies the performance indexes and seed content from neon_schema.sql to the
// database in DATABASE_URL. `drizzle-kit push` builds the tables but not these:
// the indexes are not declared in db/schema.ts, and the content rows aren't
// schema at all. Every statement is idempotent (IF NOT EXISTS / ON CONFLICT),
// so re-running this is safe.
//
//   node --env-file=.env db/seed.mjs
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const src = readFileSync(new URL('../neon_schema.sql', import.meta.url), 'utf8');
const start = src.indexOf('-- ─── Indexes for Performance');
if (start < 0) throw new Error('index section marker not found in neon_schema.sql');

// Split on semicolons outside string literals and line comments. The seeded
// blog content contains both, so a naive split on ';' would tear it apart.
const stmts = [];
let buf = '', inStr = false, inComment = false;
const body = src.slice(start);
for (let i = 0; i < body.length; i++) {
  const c = body[i], n = body[i + 1];
  if (inComment) { if (c === '\n') { inComment = false; buf += c; } continue; }
  if (inStr) {
    buf += c;
    if (c === "'") { if (n === "'") { buf += n; i++; } else inStr = false; }
    continue;
  }
  if (c === '-' && n === '-') { inComment = true; i++; continue; }
  if (c === "'") { inStr = true; buf += c; continue; }
  if (c === ';') { stmts.push(buf.trim()); buf = ''; continue; }
  buf += c;
}
if (buf.trim()) stmts.push(buf.trim());

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
const sql = neon(process.env.DATABASE_URL);
console.log('seeding ' + new URL(process.env.DATABASE_URL).hostname);

let failed = 0;
for (const s of stmts.filter(Boolean)) {
  const label = s.replace(/\s+/g, ' ').slice(0, 70);
  try { await sql.query(s); console.log('ok   ' + label); }
  catch (e) { failed++; console.log('FAIL ' + label + '\n     ' + e.message); }
}
console.log(failed ? `\n${failed} statement(s) failed` : '\nseed complete');
process.exit(failed ? 1 : 0);
