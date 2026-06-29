/**
 * Teste de conexão com o Supabase
 * Uso: node scripts/test-connection.js
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carrega .env.local
try {
  const envPath = path.resolve(__dirname, '../oab-app/.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...vals] = line.split('=');
      if (key && !key.startsWith('#')) {
        process.env[key.trim()] = vals.join('=').trim();
      }
    });
  }
} catch (e) { /* ignore */ }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('   Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('   no arquivo oab-app/.env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  console.log('🔍 Testando conexão com Supabase...');
  console.log(`   URL: ${url}\n`);

  const checks = [
    { table: 'disciplines', expected: 57 },
    { table: 'objectives', expected: 142 },
    { table: 'subjects', expected: 3775 },
    { table: 'questions', expected: 61490 },
  ];

  let allOk = true;

  for (const check of checks) {
    try {
      const { count, error } = await supabase
        .from(check.table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ❌ ${check.table}: ERRO — ${error.message}`);
        allOk = false;
      } else {
        const ok = count >= check.expected * 0.95; // 5% de tolerância
        const icon = ok ? '✅' : '⚠️';
        console.log(`  ${icon} ${check.table}: ${count} registros (esperado ~${check.expected})`);
        if (!ok) allOk = false;
      }
    } catch (err) {
      console.log(`  ❌ ${check.table}: EXCEÇÃO — ${err.message}`);
      allOk = false;
    }
  }

  console.log('');
  if (allOk) {
    console.log('✅ Todos os testes passaram! O Supabase está conectado e com dados.');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique os erros acima.');
  }
}

test().catch(err => {
  console.error('💥 Erro fatal:', err.message);
  process.exit(1);
});
