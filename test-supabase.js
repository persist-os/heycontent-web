const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env file
require('dotenv').config();

async function testSupabaseSetup(supabase) {
  console.log('\nChecking database setup...');
  try {
    // Test basic connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('documents')
      .select('count');

    if (healthError) {
      console.log('Database setup check failed:', healthError);
      return;
    }
    console.log('Database connection successful');

    // Test vector function
    console.log('\nTesting vector similarity function...');
    const testEmbedding = Array(1536).fill(0);
    const { data: vecTest, error: vecError } = await supabase
      .rpc('match_documents', {
        query_embedding: testEmbedding,
        match_threshold: 0.5,
        match_count: 1
      });

    if (vecError) {
      console.error('Vector function test failed:', vecError);
    } else {
      console.log('Vector function test successful:', vecTest);
    }

    // Test basic queries
    console.log('\nTesting basic queries...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profileError) {
      console.error('Profiles Query Error:', profileError);
    } else {
      console.log('Profiles query successful!');
      console.log('Data:', profileData);
    }

    const { data: docData, error: docError } = await supabase
      .from('documents')
      .select('id')
      .limit(1);

    if (docError) {
      console.error('Documents Query Error:', docError);
    } else {
      console.log('Documents query successful!');
      console.log('Data:', docData);
    }

    // Test document insertion with test user
    console.log('\nTesting document insertion...');
    try {
      // Create a test user directly
      const testEmail = `test${Date.now()}@example.com`;
      console.log(`Creating test user with email: ${testEmail}`);
      
      // First create the user in auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'test123',
        email_confirm: true
      });

      if (authError) {
        console.error('Failed to create auth user:', authError);
        return;
      }

      if (!authUser?.user?.id) {
        console.error('No user ID returned from auth user creation');
        return;
      }

      const userId = authUser.user.id;
      console.log('Created auth user with ID:', userId);

      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Failed to check existing profile:', checkError);
        return;
      }

      if (!existingProfile) {
        // Create profile for the user
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              full_name: 'Test User'
            }
          ])
          .select();

        if (profileError) {
          console.error('Failed to create profile:', profileError);
          return;
        }

        console.log('Created new profile:', profileData);
      } else {
        console.log('Using existing profile with ID:', userId);
      }

      // Insert a test document
      console.log('Attempting to insert test document with user_id:', userId);
      const { data: insertData, error: insertError } = await supabase
        .from('documents')
        .insert([
          {
            content: 'Test document',
            metadata: { test: true },
            embedding: Array(1536).fill(0),
            user_id: userId
          }
        ])
        .select();

      if (insertError) {
        console.error('Document insertion failed:', insertError);
        console.error('Error details:', insertError.details);
        console.error('Error hint:', insertError.hint);
      } else {
        console.log('Document insertion successful:', insertData);

        // Test vector search with the inserted document
        console.log('Testing vector search...');
        const { data: searchData, error: searchError } = await supabase
          .rpc('match_documents', {
            query_embedding: Array(1536).fill(0),
            match_threshold: 0.5,
            match_count: 1
          });

        if (searchError) {
          console.error('Vector search failed:', searchError);
          console.error('Error details:', searchError.details);
          console.error('Error hint:', searchError.hint);
        } else {
          console.log('Vector search successful:', searchData);
        }
      }
    } catch (error) {
      console.error('Test document insertion failed:', error);
      if (error.details) console.error('Error details:', error.details);
      if (error.hint) console.error('Error hint:', error.hint);
    }
  } catch (error) {
    console.error('Database setup test failed:', error);
  }
}

async function testSupabaseConnection(keyType, key) {
  console.log(`\nTesting Supabase connection with ${keyType}...\n`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  console.log('Environment Check:');
  console.log('----------------');
  console.log('URL:', supabaseUrl);
  console.log('Key Type:', keyType);
  console.log('Key:', key ? `${key.substring(0, 10)}...${key.substring(key.length - 10)}` : 'Not found');
  console.log('URL valid:', supabaseUrl?.startsWith('https://'));
  console.log('Key valid:', key?.startsWith('eyJ'));
  console.log('Key length:', key?.length);
  console.log('----------------\n');

  try {
    console.log('Creating Supabase client...');
    const supabase = createClient(supabaseUrl, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    await testSupabaseSetup(supabase);
    return true;
  } catch (error) {
    console.error('\nTest failed with error:');
    console.error('------------------');
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    return false;
  }
}

async function runTests() {
  console.log('Starting Supabase setup verification...\n');

  // Test with service role key first (more permissions)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceResult = await testSupabaseConnection('Service Role Key', serviceKey);

  // Then test with anon key
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anonResult = await testSupabaseConnection('Anon Key', anonKey);

  console.log('\nTest Results:');
  console.log('------------');
  console.log('Service Role Key Test:', serviceResult ? 'Success' : 'Failed');
  console.log('Anon Key Test:', anonResult ? 'Success' : 'Failed');
}

// Run the tests
runTests(); 