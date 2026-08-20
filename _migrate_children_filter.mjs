import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// Items where "children" was typed as a free-text value inside `passion`
// instead of using the dedicated `children` filter field. Move it: add a
// proper `children` tag, strip the redundant string out of `passion`.
const rows = await sql`
  SELECT id, title, filters FROM portfolio_items
  WHERE filters -> 'passion' ? 'children'
`;

console.log(`Found ${rows.length} item(s) with "children" mis-tagged under passion:\n`);

for (const row of rows) {
  const filters = row.filters || {};
  const passion = (filters.passion || []).filter((v) => v !== 'children');
  const children = Array.from(new Set([...(filters.children || []), 'Children']));

  const nextFilters = { ...filters, passion, children };
  if (passion.length === 0) delete nextFilters.passion;

  await sql`UPDATE portfolio_items SET filters = ${JSON.stringify(nextFilters)}::jsonb WHERE id = ${row.id}`;
  console.log(`✅ ${row.title}`);
  console.log(`   passion: ${JSON.stringify(filters.passion)} -> ${JSON.stringify(passion)}`);
  console.log(`   children: ${JSON.stringify(filters.children ?? [])} -> ${JSON.stringify(children)}\n`);
}

console.log('Done.');
