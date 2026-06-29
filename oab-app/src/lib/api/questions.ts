import { supabase } from '../supabase';

// ============ TYPES ============

export interface Discipline {
  id: string;
  name: string;
  abbreviation: string | null;
  sequential: number;
  question_count?: number;
}

export interface Subject {
  id: string;
  name: string;
  sequential: number;
  discipline_id?: string;
}

export interface Question {
  id: string;
  wording: string;
  type: 'ClosedQuestion' | 'OpenQuestion' | 'PracticalCase';
  difficulty: string | null;
  remark?: string | null;
  sequential: number;
  discipline_id: string;
  disciplines?: { id: string; name: string; abbreviation: string };
  question_options?: QuestionOption[];
}

export interface QuestionOption {
  id: number;
  question_id: string;
  label: string;
  text: string;
  is_correct: boolean;
}

export interface Objective {
  id: string;
  name: string;
  sequential: number;
}

// ============ DISCIPLINAS ============

export async function getDisciplines(): Promise<Discipline[]> {
  const { data, error } = await supabase
    .from('disciplines')
    .select('id, name, abbreviation, sequential')
    .is('deleted_at', null)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getDisciplineById(id: string): Promise<Discipline | null> {
  const { data, error } = await supabase
    .from('disciplines')
    .select('id, name, abbreviation, sequential')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) return null;
  return data;
}

// ============ QUESTÕES ============

interface GetQuestionsParams {
  disciplineId?: string;
  type?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export async function getQuestions({
  disciplineId,
  type,
  limit = 20,
  offset = 0,
  search,
}: GetQuestionsParams = {}) {
  let query = supabase
    .from('questions')
    .select(
      `id, wording, type, difficulty, sequential, discipline_id,
       disciplines (id, name, abbreviation),
       question_options (id, label, text, is_correct)`,
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('sequential', { ascending: true })
    .range(offset, offset + limit - 1);

  if (disciplineId) query = query.eq('discipline_id', disciplineId);
  if (type) query = query.eq('type', type);
  if (search) query = query.ilike('wording', `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data || []) as unknown as Question[], count: count || 0 };
}

export async function getQuestionById(id: string): Promise<Question | null> {
  const { data, error } = await supabase
    .from('questions')
    .select(
      `id, wording, type, difficulty, remark, sequential, discipline_id,
       disciplines (id, name, abbreviation),
       question_options (id, label, text, is_correct)`
    )
    .eq('id', id)
    .single();

  if (error) return null;
  return data as unknown as Question;
}

export async function getRandomQuestions(
  disciplineId?: string,
  count: number = 10
): Promise<Question[]> {
  // Supabase doesn't support ORDER BY RANDOM directly,
  // so we fetch a larger pool and randomize client-side
  let query = supabase
    .from('questions')
    .select(
      `id, wording, type, difficulty, sequential, discipline_id,
       disciplines (id, name, abbreviation),
       question_options (id, label, text, is_correct)`
    )
    .is('deleted_at', null)
    .eq('type', 'ClosedQuestion');

  if (disciplineId) query = query.eq('discipline_id', disciplineId);

  // Get total count first
  const { count: total } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('type', 'ClosedQuestion')
    .eq('discipline_id', disciplineId || '');

  // Generate random offset
  const maxOffset = Math.max(0, (total || 1000) - count);
  const randomOffset = Math.floor(Math.random() * maxOffset);

  const { data, error } = await query
    .range(randomOffset, randomOffset + count - 1);

  if (error) throw error;
  return (data || []) as unknown as Question[];
}

// ============ ASSUNTOS ============

export async function getSubjectsByDiscipline(disciplineId: string): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name, sequential')
    .eq('discipline_id', disciplineId)
    .is('deleted_at', null)
    .order('name');

  if (error) throw error;
  return (data || []) as unknown as Subject[];
}

// ============ OBJETIVOS ============

export async function getObjectives(): Promise<Objective[]> {
  const { data, error } = await supabase
    .from('objectives')
    .select('id, name, sequential')
    .is('deleted_at', null)
    .order('name');

  if (error) throw error;
  return data || [];
}

// ============ ESTATÍSTICAS ============

export async function getStats() {
  const [questions, disciplines, subjects, objectives] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('disciplines').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('subjects').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('objectives').select('*', { count: 'exact', head: true }).is('deleted_at', null),
  ]);

  return {
    questions: questions.count || 0,
    disciplines: disciplines.count || 0,
    subjects: subjects.count || 0,
    objectives: objectives.count || 0,
  };
}
