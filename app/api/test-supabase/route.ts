import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Enhanced environment check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const envCheck = {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      url: supabaseUrl,
      urlValid: supabaseUrl?.startsWith('https://'),
      keyValid: serviceRoleKey?.startsWith('eyJ'),
      keyLength: serviceRoleKey?.length,
    };
    console.log('Supabase environment check:', envCheck);

    if (!envCheck.urlValid) {
      throw new Error('Invalid Supabase URL format');
    }

    if (!envCheck.keyValid) {
      throw new Error('Invalid Supabase key format');
    }

    // Test 1: Create client
    let supabase;
    try {
      supabase = createClient(
        supabaseUrl!,
        serviceRoleKey!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );
      console.log('Supabase client created successfully');
    } catch (e) {
      console.error('Failed to create Supabase client:', e);
      throw new Error('Failed to create Supabase client: ' + (e instanceof Error ? e.message : String(e)));
    }

    // Test 2: Simple query first
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Simple query error:', error);
        throw error;
      }
      console.log('Simple query successful:', { hasData: !!data });
    } catch (e) {
      console.error('Failed simple query:', e);
      throw new Error('Failed simple query: ' + (e instanceof Error ? e.message : JSON.stringify(e)));
    }

    // Test 3: Vector operation
    try {
      const { data: vectorData, error: vectorError } = await supabase
        .rpc('match_documents', {
          query_embedding: Array(1536).fill(0),
          match_threshold: 0.8,
          match_count: 1
        });
      
      if (vectorError) {
        console.error('Vector operation error:', vectorError);
        throw vectorError;
      }
      console.log('Vector operation result:', vectorData);
    } catch (e) {
      console.error('Failed vector operation:', e);
      throw new Error('Failed vector operation: ' + (e instanceof Error ? e.message : JSON.stringify(e)));
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: 'All tests passed successfully'
    });
  } catch (error) {
    console.error('Supabase test error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      fullError: error
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : JSON.stringify(error),
      errorDetails: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      environment: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        urlValid: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://'),
        keyValid: process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ'),
        keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length
      }
    }, { status: 500 });
  }
} 