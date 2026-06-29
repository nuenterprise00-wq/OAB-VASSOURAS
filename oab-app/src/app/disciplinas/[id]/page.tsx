"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getDisciplineById,
  getQuestions,
  getSubjectsByDiscipline,
  type Discipline,
  type Question,
  type Subject,
} from "@/lib/api/questions";

const TYPE_LABELS: Record<string, { label: string; className: string }> = {
  ClosedQuestion: { label: "Objetiva", className: "closed" },
  OpenQuestion: { label: "Discursiva", className: "open" },
  PracticalCase: { label: "Caso Prático", className: "practical" },
};

export default function DisciplinaDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 15;

  useEffect(() => {
    async function load() {
      try {
        const [d, s] = await Promise.all([
          getDisciplineById(id),
          getSubjectsByDiscipline(id),
        ]);
        setDiscipline(d);
        setSubjects(s);
      } catch (err) {
        console.error("Erro:", err);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      try {
        const { data, count } = await getQuestions({
          disciplineId: id,
          limit: LIMIT,
          offset: (page - 1) * LIMIT,
        });
        setQuestions(data);
        setTotal(count);
      } catch (err) {
        console.error("Erro ao carregar questões:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [id, page]);

  const totalPages = Math.ceil(total / LIMIT);

  function truncateWording(text: string, maxLen: number = 400) {
    // Strip HTML tags
    const clean = text.replace(/<[^>]*>/g, "");
    if (clean.length <= maxLen) return clean;
    return clean.substring(0, maxLen).trim() + "…";
  }

  return (
    <div className="page-content">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <a href="/">Início</a>
          <span className="breadcrumb-sep">›</span>
          <a href="/disciplinas">Disciplinas</a>
          <span className="breadcrumb-sep">›</span>
          <span>{discipline?.name || "Carregando..."}</span>
        </div>

        {discipline && (
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.25rem" }}>
              {discipline.name}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              {total.toLocaleString("pt-BR")} questões encontradas
              {discipline.abbreviation && ` • ${discipline.abbreviation}`}
            </p>
          </div>
        )}

        <div className="content-layout">
          {/* Sidebar — Assuntos */}
          {subjects.length > 0 && (
            <aside className="sidebar">
              <h3>Assuntos ({subjects.length})</h3>
              {subjects.slice(0, 50).map((s) => (
                <div key={s.id} className="sidebar-item" title={s.name}>
                  {s.name.length > 45 ? s.name.substring(0, 45) + "…" : s.name}
                </div>
              ))}
              {subjects.length > 50 && (
                <div
                  style={{
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  + {subjects.length - 50} outros assuntos
                </div>
              )}
            </aside>
          )}

          {/* Questions */}
          <div>
            {loading ? (
              <div className="loading">
                <div className="loading-spinner" />
              </div>
            ) : questions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>Nenhuma questão encontrada</h3>
                <p>Configure o Supabase para carregar os dados.</p>
              </div>
            ) : (
              <>
                {questions.map((q, i) => {
                  const typeInfo = TYPE_LABELS[q.type] || {
                    label: q.type,
                    className: "closed",
                  };
                  return (
                    <div
                      key={q.id}
                      className="question-card animate-in"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="question-header">
                        <span className="question-number">
                          #{q.sequential || (page - 1) * LIMIT + i + 1}
                        </span>
                        <span className={`question-type ${typeInfo.className}`}>
                          {typeInfo.label}
                        </span>
                      </div>
                      <div className="question-wording">
                        {truncateWording(q.wording)}
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      ← Anterior
                    </button>

                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (page <= 4) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = page - 3 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={page === pageNum ? "active" : ""}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Próxima →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
