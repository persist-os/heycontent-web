const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

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
      
      // Create test user using our function
      const { data: userId, error: userError } = await supabase
        .rpc('create_test_user', {
          test_email: testEmail,
          test_password: 'test123'
        });

      if (userError) {
        console.error('Failed to create test user:', userError);
        return;
      }

      console.log('Created test user with ID:', userId);

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

  console.log('Environment Check:');
  console.log('----------------');
  console.log('URL:', supabaseUrl);
  console.log('Key Type:', keyType);
  console.log('Key:', key ? `${key.substring(0, 10)}...${key.substring(key.length - 10)}` : 'Not found');
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
  console.log('Starting local Supabase setup verification...\n');

  // Test with service role key first (more permissions)
  const serviceResult = await testSupabaseConnection('Service Role Key', supabaseServiceKey);

  // Then test with anon key
  const anonResult = await testSupabaseConnection('Anon Key', supabaseAnonKey);

  console.log('\nTest Results:');
  console.log('------------');
  console.log('Service Role Key Test:', serviceResult ? 'Success' : 'Failed');
  console.log('Anon Key Test:', anonResult ? 'Success' : 'Failed');
}

// Run the tests
runTests(); 