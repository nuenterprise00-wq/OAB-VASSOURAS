"use client";

import { useEffect, useState } from "react";
import { getDisciplines, getStats, type Discipline } from "@/lib/api/questions";

export default function HomePage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [stats, setStats] = useState({ questions: 0, disciplines: 0, subjects: 0, objectives: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [d, s] = await Promise.all([getDisciplines(), getStats()]);
        setDisciplines(d);
        setStats(s);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        // Use fallback stats if Supabase is not configured
        setStats({ questions: 61490, disciplines: 57, subjects: 3775, objectives: 142 });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = disciplines.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.abbreviation && d.abbreviation.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">🎓 Plataforma de Estudos para o Exame da OAB</div>
          <h1>
            Domine o Exame da OAB
            <br />
            com <span>OAB Vassouras</span>
          </h1>
          <p className="hero-subtitle">
            Mais de 61.000 questões organizadas por disciplina, com simulados inteligentes
            para acelerar sua preparação e garantir sua aprovação.
          </p>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">
                {stats.questions > 0 ? stats.questions.toLocaleString("pt-BR") : "61.490"}
              </div>
              <div className="stat-label">Questões</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {stats.disciplines > 0 ? stats.disciplines : "57"}
              </div>
              <div className="stat-label">Disciplinas</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {stats.subjects > 0 ? stats.subjects.toLocaleString("pt-BR") : "3.775"}
              </div>
              <div className="stat-label">Assuntos</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {stats.objectives > 0 ? stats.objectives : "142"}
              </div>
              <div className="stat-label">Simulados</div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/simulado" className="btn btn-primary btn-lg">
              🚀 Iniciar Simulado
            </a>
            <a href="/disciplinas" className="btn btn-secondary btn-lg">
              📚 Ver Disciplinas
            </a>
          </div>
        </div>
      </section>

      {/* DISCIPLINES SECTION */}
      <section className="page-content">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Disciplinas</h2>
            <a href="/disciplinas" className="section-link">
              Ver todas →
            </a>
          </div>

          {/* Search */}
          <div className="search-bar">
            <span className="search-bar-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar disciplina..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="search-disciplines"
            />
          </div>

          {loading ? (
            <div className="loading">
              <div className="loading-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>Nenhuma disciplina encontrada</h3>
              <p>
                {disciplines.length === 0
                  ? "Configure as credenciais do Supabase no arquivo .env.local para carregar os dados."
                  : "Tente outro termo de busca."}
              </p>
            </div>
          ) : (
            <div className="discipline-grid">
              {filtered.map((d, i) => (
                <a
                  key={d.id}
                  href={`/disciplinas/${d.id}`}
                  className="discipline-card animate-in"
                  style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s` }}
                >
                  <div className="discipline-icon">
                    {d.abbreviation || d.name.substring(0, 3)}
                  </div>
                  <div className="discipline-info">
                    <h3>{d.name}</h3>
                    {d.abbreviation && <p>{d.abbreviation}</p>}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
