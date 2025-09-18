import { supabase } from '@/integrations/supabase/client';

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Basic connection test
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Connection test failed:', error.message);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
    
    console.log('Connection test successful!');
    return {
      success: true,
      message: 'Successfully connected to Supabase',
      data
    };
  } catch (err) {
    console.error('Unexpected error:', err);
    return {
      success: false,
      error: 'Unexpected error occurred',
      details: err
    };
  }
}

export async function testSupabaseAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth session:', session);
    return session;
  } catch (error) {
    console.error('Auth test failed:', error);
    return null;
  }
}

export async function listTables() {
  try {
    // This will show us what tables actually exist
    const { data, error } = await supabase
      .rpc('get_current_user_role')
      .limit(1);
    
    if (error) {
      console.log('RPC call failed, but connection might still work:', error.message);
    }
    
    // Let's try to check each expected table
    const tables = ['users', 'products', 'categories', 'operators', 'orders', 'credit_requests'];
    const tableStatus = {};
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        tableStatus[table] = tableError ? `Error: ${tableError.message}` : 'Exists';
      } catch (err) {
        tableStatus[table] = `Error: ${err.message}`;
      }
    }
    
    return tableStatus;
  } catch (error) {
    console.error('Table listing failed:', error);
    return { error: error.message };
  }
}