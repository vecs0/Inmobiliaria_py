import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service role key to bypass RLS for checking counts, or fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
  console.log(`Connecting to Supabase at ${supabaseUrl}...`);
  const tablesToCheck = ['agents', 'properties', 'leads', 'seller_profiles', 'properties_with_agent'];
  
  let allSuccess = true;
  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.error(`[ERROR] Table/View '${table}':`, error.message);
        allSuccess = false;
      } else {
        console.log(`[SUCCESS] Table/View '${table}' exists. Row count: ${count}`);
      }
    } catch (e) {
      console.error(`[EXCEPTION] Table/View '${table}':`, e.message);
      allSuccess = false;
    }
  }
  
  if (allSuccess) {
    console.log("\nAll expected tables and views are connected and accessible!");
  } else {
    console.log("\nSome tables/views had errors. Check if migrations were applied successfully.");
  }
}

checkConnection();
