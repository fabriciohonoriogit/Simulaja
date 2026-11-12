import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve('.env');
  const env = { ...process.env };
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[trimmed.slice(0, eqIdx).trim()] = val;
      }
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

async function checkTables() {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': 'Bearer ' + supabaseKey
  };

  const tables = ['leads', 'clientes', 'propostas', 'inadimplentes', 'vendas', 'consorcio_cotas', 'carteira_clientes', 'whatsapp_chats', 'whatsapp_contacts'];

  for (const t of tables) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${t}?select=*&limit=15`, { headers });
      if (res.ok) {
        const data = await res.json();
        console.log(`Tabela [${t}]: ${data.length} registros`);
        if (data.length > 0) {
          console.log(`Exemplo de [${t}]:`, Object.keys(data[0]));
          console.log(JSON.stringify(data.slice(0, 3), null, 2));
        }
      } else {
        console.log(`Tabela [${t}]: status ${res.status}`);
      }
    } catch (e) {
      console.log(`Tabela [${t}]: erro ${e.message}`);
    }
  }
}

checkTables();
