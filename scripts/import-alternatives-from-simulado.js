/**
 * Script de importação das questões e alternativas do simulado empresarial do HTML para o Supabase
 * Uso: node scripts/import-alternatives-from-simulado.js
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
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const DISCIPLINE_ID = '4pqclywopyYnzubymKe52w'; // ID de Direito Empresarial

if (!url || !key) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log('📂 Lendo simulado_empresarial.html...');
  const htmlPath = path.resolve(__dirname, '../simulado_empresarial.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('❌ simulado_empresarial.html não foi encontrado na raiz do projeto!');
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  // Extrai a seção const questions = [ ... ];
  const match = htmlContent.match(/const questions = (\[[\s\S]*?\]);\s*\/\/\s*─── STATE ───/);
  if (!match) {
    console.error('❌ Não foi possível extrair a lista de questões do simulado HTML!');
    process.exit(1);
  }

  // Avalia o JS extraído com segurança para ter o array em memória
  let questions = [];
  try {
    // Usamos eval com encapsulamento simples, já que o arquivo é controlado e confiável
    eval(`questions = ${match[1]}`);
  } catch (err) {
    console.error('❌ Erro ao processar o array de questões:', err.message);
    process.exit(1);
  }

  console.log(`🚀 Encontradas ${questions.length} questões com alternativas no simulado.`);
  console.log('📥 Importando questões e alternativas para o Supabase...');

  let questionsImported = 0;
  let optionsImported = 0;

  for (const q of questions) {
    const questionId = `empresarial-${q.id}`;
    
    // 1. Upsert na tabela de questões
    const remarkText = q.exp ? `${q.exp}\n\n📚 Base legal: ${q.law || ''}` : '';
    const { error: qError } = await supabase.from('questions').upsert({
      id: questionId,
      wording: q.q,
      type: 'ClosedQuestion',
      difficulty: 'Médio',
      remark: remarkText,
      sequential: 90000 + q.id, // Número sequencial único para o bloco de simulado
      discipline_id: DISCIPLINE_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (qError) {
      console.error(`  ❌ Erro ao importar questão ${q.id}:`, qError.message);
      continue;
    }
    questionsImported++;

    // Deleta alternativas antigas dessa questão para evitar duplicidade
    await supabase.from('question_options').delete().eq('question_id', questionId);

    // 2. Inserir alternativas
    const optionsToInsert = q.o.map((opt) => ({
      question_id: questionId,
      label: opt.l,
      text: opt.x,
      is_correct: opt.l === q.c
    }));

    const { error: optError } = await supabase.from('question_options').insert(optionsToInsert);

    if (optError) {
      console.error(`  ❌ Erro ao importar alternativas da questão ${q.id}:`, optError.message);
    } else {
      optionsImported += optionsToInsert.length;
    }

    process.stdout.write(`  ⏳ Progresso: ${questionsImported}/${questions.length} questões processadas...\r`);
  }

  console.log(`\n\n✅ Importação Concluída com sucesso!`);
  console.log(`   - Questões importadas: ${questionsImported}`);
  console.log(`   - Alternativas importadas: ${optionsImported}`);
}

main().catch(err => {
  console.error('\n💥 Erro fatal:', err.message);
  process.exit(1);
});
