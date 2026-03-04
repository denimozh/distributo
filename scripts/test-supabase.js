// test-supabase.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function test() {
  console.log("Testing connection...");
  
  const { data, error } = await supabase
    .from("avatars")
    .select("*")
    .limit(3);
    
  if (error) {
    console.log("Error:", error);
  } else {
    console.log("Success! Found", data.length, "avatars");
    console.log(data);
  }
}

test();