"use client";

import { useEffect, useState, useCallback } from "react";
import { getDisciplines, getQuestions, type Discipline, type Question } from "@/lib/api/questions";

type SimuladoState = "config" | "running" | "result";

interface Answer {
  questionId: string;
  selected: string | null;
}

export default function SimuladoPage() {
  const [state, setState] = useState<SimuladoState>("config");
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Load disciplines
  useEffect(() => {
    getDisciplines()
      .then(setDisciplines)
      .catch(console.error);
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, []);

  async function startSimulado() {
    setLoading(true);
    try {
      // Get random questions
      const offset = Math.floor(Math.random() * 1000);
      const params: Parameters<typeof getQuestions>[0] = {
        limit: questionCount,
        offset: offset,
        type: "ClosedQuestion",
      };
      if (selectedDiscipline) {
        params.disciplineId = selectedDiscipline;
      }

      const { data } = await getQuestions(params);

      if (data.length === 0) {
        alert("Nenhuma questão encontrada para os filtros selecionados.");
        setLoading(false);
        return;
      }

      setQuestions(data);
      setAnswers(data.map((q) => ({ questionId: q.id, selected: null })));
      setCurrentIndex(0);
      setTimer(0);
      setTimerActive(true);
      setShowExplanation(false);
      setState("running");
    } catch (err) {
      console.error("Erro ao carregar questões:", err);
      alert("Erro ao carregar questões. Verifique a conexão com o Supabase.");
    } finally {
      setLoading(false);
    }
  }

  function handleAnswer(option: string) {
    setAnswers((prev) =>
      prev.map((a, i) =>
        i === currentIndex ? { ...a, selected: option } : a
      )
    );
  }

  function nextQuestion() {
    setShowExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Finish
      setTimerActive(false);
      setState("result");
    }
  }

  function prevQuestion() {
    setShowExplanation(false);
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  function restartSimulado() {
    setState("config");
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setTimer(0);
    setTimerActive(false);
    setShowExplanation(false);
  }

  function truncateHtml(text: string) {
    return text.replace(/<[^>]*>/g, "");
  }

  const progress = questions.length > 0
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;

  const answeredCount = answers.filter((a) => a.selected !== null).length;

  return (
    <div className="page-content">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <a href="/">Início</a>
          <span className="breadcrumb-sep">›</span>
          <span>Simulado</span>
        </div>

        {/* CONFIG STATE */}
        {state === "config" && (
          <div className="simulado-config animate-in">
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎯</div>
            <h2>Simulado OAB</h2>
            <p>Configure seu simulado e teste seus conhecimentos</p>

            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-lg)",
                padding: "2rem",
                textAlign: "left",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "0.5rem",
                }}
              >
                Disciplina (opcional)
              </label>
              <select
                className="simulado-select"
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value)}
                id="select-discipline"
              >
                <option value="">Todas as disciplinas</option>
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "0.5rem",
                }}
              >
                Número de questões
              </label>
              <select
                className="simulado-select"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                id="select-count"
              >
                <option value={5}>5 questões (rápido)</option>
                <option value={10}>10 questões</option>
                <option value={20}>20 questões</option>
                <option value={40}>40 questões</option>
                <option value={80}>80 questões (prova completa)</option>
              </select>

              <button
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginTop: "0.5rem" }}
                onClick={startSimulado}
                disabled={loading}
                id="btn-start-simulado"
              >
                {loading ? "Carregando questões..." : "🚀 Iniciar Simulado"}
              </button>
            </div>
          </div>
        )}

        {/* RUNNING STATE */}
        {state === "running" && questions.length > 0 && (
          <div className="animate-in">
            {/* Progress bar */}
            <div className="simulado-progress">
              <span className="progress-text">
                {currentIndex + 1}/{questions.length}
              </span>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="progress-text">⏱ {formatTime(timer)}</span>
            </div>

            {/* Question */}
            <div className="question-card" key={questions[currentIndex].id}>
              <div className="question-header">
                <span className="question-number">
                  Questão {currentIndex + 1} de {questions.length}
                </span>
                {questions[currentIndex].disciplines && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {(questions[currentIndex].disciplines as { name: string })?.name}
                  </span>
                )}
              </div>

              <div
                className="question-wording"
                style={{ marginBottom: "1.5rem", lineHeight: 1.8 }}
              >
                {truncateHtml(questions[currentIndex].wording)}
              </div>

              {/* Placeholder options — since we don't have options data */}
              <div
                style={{
                  background: "var(--bg-surface-hover)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.25rem",
                  marginBottom: "1rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-tertiary)",
                    textAlign: "center",
                  }}
                >
                  ⚠️ As alternativas serão exibidas quando os dados de opções forem importados.
                  <br />
                  Por enquanto, use os botões abaixo para navegar pelas questões.
                </p>
              </div>

              {/* Show explanation toggle */}
              {questions[currentIndex].remark && (
                <div style={{ marginTop: "1rem" }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: "0.85rem" }}
                    onClick={() => setShowExplanation(!showExplanation)}
                  >
                    {showExplanation ? "🔽 Ocultar comentário" : "📝 Ver comentário"}
                  </button>
                  {showExplanation && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        background: "var(--info-bg)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.9rem",
                        lineHeight: 1.7,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {truncateHtml(questions[currentIndex].remark || "")}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={prevQuestion}
                disabled={currentIndex === 0}
              >
                ← Anterior
              </button>

              <button className="btn btn-primary" onClick={nextQuestion}>
                {currentIndex === questions.length - 1
                  ? "✅ Finalizar"
                  : "Próxima →"}
              </button>
            </div>

            {/* Question dots */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.35rem",
                justifyContent: "center",
                marginTop: "2rem",
              }}
            >
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentIndex(i);
                    setShowExplanation(false);
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "var(--radius-sm)",
                    border:
                      i === currentIndex
                        ? "2px solid var(--accent-primary)"
                        : "1px solid var(--border-primary)",
                    background:
                      i === currentIndex
                        ? "var(--accent-primary)"
                        : answers[i]?.selected
                        ? "var(--bg-surface-hover)"
                        : "var(--bg-surface)",
                    color:
                      i === currentIndex
                        ? "white"
                        : "var(--text-tertiary)",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RESULT STATE */}
        {state === "result" && (
          <div className="animate-in">
            <div className="simulado-result">
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🏆</div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "2rem",
                }}
              >
                Simulado Concluído!
              </h2>

              <div className="stats-grid" style={{ maxWidth: 600, margin: "0 auto 2rem" }}>
                <div className="stat-card">
                  <div className="stat-number">{questions.length}</div>
                  <div className="stat-label">Questões</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{answeredCount}</div>
                  <div className="stat-label">Respondidas</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{formatTime(timer)}</div>
                  <div className="stat-label">Tempo Total</div>
                </div>
              </div>

              <p
                style={{
                  color: "var(--text-secondary)",
                  marginBottom: "2rem",
                  maxWidth: 500,
                  margin: "0 auto 2rem",
                }}
              >
                As alternativas e pontuação estarão disponíveis quando os dados de
                opções forem importados para o Supabase.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="btn btn-primary btn-lg"
                  onClick={restartSimulado}
                >
                  🔄 Novo Simulado
                </button>
                <a href="/" className="btn btn-secondary btn-lg">
                  🏠 Voltar ao Início
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
