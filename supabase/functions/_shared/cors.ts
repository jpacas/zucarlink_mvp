// Cabeceras CORS compartidas para Edge Functions invocadas desde el navegador
// (supabase.functions.invoke). El preflight OPTIONS debe responderse con estas cabeceras.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
