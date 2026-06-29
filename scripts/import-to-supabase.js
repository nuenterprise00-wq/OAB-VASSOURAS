/**
 * Script de importação dos dados JSON para o Supabase
 * Uso: node scripts/import-to-supabase.js
 * 
 * Requer variáveis de ambiente:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carrega .env.local se existir
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('   Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  console.error('   no arquivo oab-app/.env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function importInBatches(tableName, data, batchSize = 500) {
  console.log(`\n📥 Importando ${data.length} registros para "${tableName}"...`);
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase.from(tableName).upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Erro no batch ${i}–${i + batchSize}: ${error.message}`);
      errors++;
    } else {
      imported += batch.length;
    }

    const pct = Math.round((Math.min(i + batchSize, data.length) / data.length) * 100);
    process.stdout.write(`  ⏳ ${pct}% (${imported}/${data.length})${errors > 0 ? ` [${errors} erros]` : ''}\r`);

    // Pausa para não throttlar a API
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n  ✅ ${imported}/${data.length} registros importados para "${tableName}"${errors > 0 ? ` (${errors} batches com erro)` : ''}`);
  return { imported, errors };
}

async function main() {
  console.log('🚀 Iniciando importação para o Supabase...');
  console.log(`   URL: ${SUPABASE_URL}\n`);

  const dataDir = path.resolve(__dirname, '..');
  const stats = {};

  // 1. Disciplinas
  console.log('📂 Carregando banco_discipline.json...');
  const disciplines = JSON.parse(fs.readFileSync(path.join(dataDir, 'banco_discipline.json'), 'utf-8'));
  const disciplinesMapped = disciplines.map(d => ({
    id: d.id,
    name: d.name,
    abbreviation: d.abbreviation,
    old_id: d.oldId,
    sequential: d.sequential,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
    deleted_at: d.deletedAt
  }));
  stats.disciplines = await importInBatches('disciplines', disciplinesMapped);

  // 2. Objetivos
  console.log('\n📂 Carregando banco_objective.json...');
  const objectives = JSON.parse(fs.readFileSync(path.join(dataDir, 'banco_objective.json'), 'utf-8'));
  const objectivesMapped = objectives.map(o => ({
    id: o.id,
    name: o.name,
    sequential: o.sequential,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
    deleted_at: o.deletedAt
  }));
  stats.objectives = await importInBatches('objectives', objectivesMapped);

  // 3. Assuntos
  console.log('\n📂 Carregando banco_subject.json...');
  const subjects = JSON.parse(fs.readFileSync(path.join(dataDir, 'banco_subject.json'), 'utf-8'));
  const subjectsMapped = subjects.map(s => ({
    id: s.id,
    name: s.name,
    sequential: s.sequential,
    discipline_id: s.DisciplineId,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    deleted_at: s.deletedAt
  }));
  stats.subjects = await importInBatches('subjects', subjectsMapped);

  // 4. Questões (arquivo grande — batch de 300)
  console.log('\n📂 Carregando banco_question.json (71MB — pode demorar)...');
  const questions = JSON.parse(fs.readFileSync(path.join(dataDir, 'banco_question.json'), 'utf-8'));
  const questionsMapped = questions
    .filter(q => !q.deletedAt) // só questões ativas
    .map(q => ({
      id: q.id,
      wording: q.wording,
      type: q.type,
      difficulty: q.difficulty || null,
      remark: q.remark || null,
      old_id: q.oldId,
      sequential: q.sequential,
      author_id: q.AuthorId,
      discipline_id: q.DisciplineId,
      created_at: q.createdAt,
      updated_at: q.updatedAt,
      deleted_at: q.deletedAt
    }));
  stats.questions = await importInBatches('questions', questionsMapped, 300);

  // Resumo
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DA IMPORTAÇÃO');
  console.log('='.repeat(50));
  Object.entries(stats).forEach(([table, { imported, errors }]) => {
    const icon = errors === 0 ? '✅' : '⚠️';
    console.log(`  ${icon} ${table}: ${imported} registros${errors > 0 ? ` (${errors} erros)` : ''}`);
  });
  console.log('\n🎉 Importação completa!');
}

main().catch(err => {
  console.error('\n💥 Erro fatal:', err.message);
  process.exit(1);
});
