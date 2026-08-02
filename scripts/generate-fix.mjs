import fs from 'fs';

// Read the file. PowerShell might have encoded it as UTF-16LE.
let rawData;
try {
  rawData = fs.readFileSync('policies.json', 'utf16le');
} catch (e) {
  rawData = fs.readFileSync('policies.json', 'utf8');
}

// Find the JSON block between { and }
const start = rawData.indexOf('{');
const end = rawData.lastIndexOf('}');

if (start === -1 || end === -1) {
  console.error('Could not find JSON in policies.json');
  process.exit(1);
}

const jsonStr = rawData.substring(start, end + 1);
const data = JSON.parse(jsonStr);

const policies = data.rows;
let sql = '';

// Add the security definer fix
sql += `-- Fix Security Definer executable by public\n`;
sql += `REVOKE EXECUTE ON FUNCTION public.reset_api_key_daily_counters() FROM anon, authenticated;\n\n`;

sql += `-- Fix auth_rls_initplan (replace auth.uid() with (select auth.uid()))\n`;

for (const policy of policies) {
  let needsFix = false;
  let newQual = policy.qual;
  let newWithCheck = policy.with_check;
  
  // Look for auth.uid() or auth.role() NOT preceded by 'select '
  // This regex looks for auth.uid() or auth.role() and ensures it's not already (select auth.uid())
  const fixRegex = /(?<!select\s+)(auth\.uid\(\)|auth\.role\(\))/gi;
  
  if (newQual && fixRegex.test(newQual)) {
    newQual = newQual.replace(fixRegex, '(select $1)');
    needsFix = true;
  }
  
  if (newWithCheck && fixRegex.test(newWithCheck)) {
    newWithCheck = newWithCheck.replace(fixRegex, '(select $1)');
    needsFix = true;
  }
  
  if (needsFix) {
    // Generate DROP and CREATE since ALTER POLICY has many nuances
    let roles = policy.roles.replace('{', '').replace('}', '');
    let roleStr = roles ? `TO ${roles}` : '';
    
    sql += `DROP POLICY IF EXISTS "${policy.policyname}" ON ${policy.schemaname}.${policy.tablename};\n`;
    
    let createSql = `CREATE POLICY "${policy.policyname}" ON ${policy.schemaname}.${policy.tablename} FOR ${policy.cmd} ${roleStr}`;
    
    if (newQual) {
      createSql += `\nUSING (${newQual})`;
    }
    
    if (newWithCheck) {
      createSql += `\nWITH CHECK (${newWithCheck})`;
    }
    
    sql += createSql + `;\n\n`;
  }
}

fs.writeFileSync('supabase/fix_initplan.sql', sql, 'utf8');
console.log('Successfully generated supabase/fix_initplan.sql');
