// Catalog-driven types for this foundation. Keep fail-closed on unsupported SQL types.
// Supabase CLI `gen types typescript` can replace this when the local Docker stack is available.
export function generateDatabaseTypes(sql) {
  const columns = JSON.parse(sql(`select coalesce(json_agg(c order by table_name, ordinal_position), '[]') from
    (select table_name, ordinal_position, column_name, is_nullable, column_default, udt_name
     from information_schema.columns where table_schema = 'public') c;`));
  const relations = JSON.parse(sql(`select coalesce(json_agg(r order by table_name, constraint_name), '[]') from (
    select t.relname table_name, c.conname constraint_name, rt.relname referenced_relation,
      array(select a.attname from unnest(c.conkey) with ordinality k(n,o)
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.n order by k.o) columns,
      array(select a.attname from unnest(c.confkey) with ordinality k(n,o)
        join pg_attribute a on a.attrelid = c.confrelid and a.attnum = k.n order by k.o) referenced_columns,
      exists(select 1 from pg_constraint uq where uq.conrelid = c.conrelid and uq.contype in ('p','u')
        and uq.conkey <@ c.conkey) is_one_to_one
    from pg_constraint c join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join pg_class rt on rt.oid = c.confrelid
    where c.contype = 'f' and n.nspname = 'public'
  ) r;`));
  function type(name) {
    if (name.startsWith('_')) return `${type(name.slice(1))}[]`;
    const result = ({ uuid: 'string', text: 'string', timestamptz: 'string', int4: 'number', int8: 'number', bool: 'boolean', jsonb: 'Json' })[name];
    if (!result) throw new Error(`Unsupported database type: ${name}`);
    return result;
  }
  const functions = JSON.parse(sql(`select coalesce(json_agg(f order by proname), '[]') from (
    select p.proname, p.pronargs, t.typname,
      coalesce((select json_agg(json_build_object('name',p.proargnames[a.n], 'type',at.typname, 'optional',a.n>p.pronargs-p.pronargdefaults) order by a.n)
      from generate_series(1,p.pronargs) a(n) join pg_type at on at.oid=p.proargtypes[a.n-1]),'[]') args
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    join pg_type t on t.oid=p.prorettype where n.nspname='public' and p.prokind='f'
  ) f;`));
  const lines = [
    '// Generated from migrated PostgreSQL by scripts/test-supabase-db.mjs --write-types.',
    '// Do not edit by hand. These types describe storage, not permission to write.',
    'export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];',
    '', 'export type Database = {', '  public: {', '    Tables: {',
  ];
  for (const table of [...new Set(columns.map(c => c.table_name))]) {
    lines.push(`      ${table}: {`);
    for (const mode of ['Row', 'Insert', 'Update']) {
      lines.push(`        ${mode}: {`);
      for (const col of columns.filter(c => c.table_name === table)) {
        const nullable = col.is_nullable === 'YES';
        const optional = mode === 'Update' || (mode === 'Insert' && (nullable || col.column_default !== null));
        lines.push(`          ${col.column_name}${optional ? '?' : ''}: ${type(col.udt_name)}${nullable ? ' | null' : ''};`);
      }
      lines.push('        };');
    }
    lines.push('        Relationships: [');
    for (const rel of relations.filter(r => r.table_name === table)) {
      lines.push(`          { foreignKeyName: ${JSON.stringify(rel.constraint_name)}; columns: ${JSON.stringify(rel.columns)}; isOneToOne: ${rel.is_one_to_one}; referencedRelation: ${JSON.stringify(rel.referenced_relation)}; referencedColumns: ${JSON.stringify(rel.referenced_columns)} },`);
    }
    lines.push('        ];', '      };');
  }
  lines.push('    };', '    Views: { [_ in never]: never };', '    Functions: {');
  for (const fn of functions) {
    const args=fn.args.length ? fn.args.map(a=>`${a.name}${a.optional?'?':''}: ${type(a.type)}${a.optional?' | null':''}`).join('; ') : '[_ in never]: never';
    lines.push(`      ${fn.proname}: { Args: { ${args} }; Returns: ${type(fn.typname)} };`);
  }
  lines.push('    };', '    Enums: { [_ in never]: never };', '    CompositeTypes: { [_ in never]: never };', '  };', '};', '');
  return lines.join('\n');
}
