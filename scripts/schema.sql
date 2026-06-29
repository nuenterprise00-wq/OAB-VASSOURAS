-- ============================================
-- SCHEMA OAB VASSOURAS — Supabase (PostgreSQL)
-- Execute no SQL Editor do Supabase
-- ============================================

-- Disciplinas (57 registros)
CREATE TABLE IF NOT EXISTS disciplines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT,
  old_id TEXT,
  sequential INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Objetivos / Exames (142 registros)
CREATE TABLE IF NOT EXISTS objectives (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sequential INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Assuntos (3.775 registros)
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sequential INTEGER,
  discipline_id TEXT REFERENCES disciplines(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Questões (61.490 registros)
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  wording TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ClosedQuestion', 'OpenQuestion', 'PracticalCase')),
  difficulty TEXT,
  remark TEXT,
  old_id TEXT,
  sequential INTEGER,
  author_id TEXT,
  discipline_id TEXT REFERENCES disciplines(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Alternativas das questões fechadas
CREATE TABLE IF NOT EXISTS question_options (
  id BIGSERIAL PRIMARY KEY,
  question_id TEXT REFERENCES questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,       -- A, B, C, D, E
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false
);

-- Progresso do usuário (para quando houver auth)
CREATE TABLE IF NOT EXISTS user_answers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,              -- ref auth.users do Supabase
  question_id TEXT REFERENCES questions(id),
  chosen_option TEXT,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_questions_discipline ON questions(discipline_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_subjects_discipline ON subjects(discipline_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_sequential ON questions(sequential);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Permitir leitura pública para dados de conteúdo
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de disciplinas" ON disciplines FOR SELECT USING (true);
CREATE POLICY "Leitura pública de objetivos" ON objectives FOR SELECT USING (true);
CREATE POLICY "Leitura pública de assuntos" ON subjects FOR SELECT USING (true);
CREATE POLICY "Leitura pública de questões" ON questions FOR SELECT USING (true);
CREATE POLICY "Leitura pública de alternativas" ON question_options FOR SELECT USING (true);

-- Usuário só vê as próprias respostas
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuário vê próprias respostas" ON user_answers
  FOR ALL USING (auth.uid() = user_id);
