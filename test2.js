const { createClient } = require('@supabase/supabase-js');
const url = 'https://iveqtlhyedzrqjfoekrd.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZXF0bGh5ZWR6cnFqZm9la3JkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE3OTY0OSwiZXhwIjoyMDkzNzU1NjQ5fQ.UiCd6ZIAfW6a7t1nQrp5_RYfaGO5kxHaxhBmfVGUrPU';
const supabase = createClient(url, serviceKey);
supabase.from('dados_estacao').select('*').then(res => console.log('Service:', res.data, res.error));
