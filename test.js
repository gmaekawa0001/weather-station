const { createClient } = require('@supabase/supabase-js');
const url = 'https://iveqtlhyedzrqjfoekrd.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZXF0bGh5ZWR6cnFqZm9la3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzk2NDksImV4cCI6MjA5Mzc1NTY0OX0.-9e6dtf8krxquKdbe4c0Uqq_0uYfxOWdO7fd1BOmY8I';
const supabase = createClient(url, anonKey);
supabase.from('dados_estacao').select('*').then(res => console.log('Anon:', res.data, res.error));
