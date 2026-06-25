import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis do Supabase não configuradas. Crie um arquivo .env.local na raiz do projeto com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY. Veja .env.example.'
  );
}

// Client para uso geral (Frontend / Backend público)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client com permissões admin (para a API que vai inserir os dados ignorando RLS se houver)
export const getServiceSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(supabaseUrl, serviceKey);
};
