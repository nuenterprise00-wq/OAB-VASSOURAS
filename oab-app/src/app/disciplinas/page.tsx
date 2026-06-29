"use client";

import { useEffect, useState } from "react";
import { getDisciplines, type Discipline } from "@/lib/api/questions";

export default function DisciplinasPage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getDisciplines();
        setDisciplines(data);
      } catch (err) {
        console.error("Erro ao carregar disciplinas:", err);
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
    <div className="page-content">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <a href="/">Início</a>
          <span className="breadcrumb-sep">›</span>
          <span>Disciplinas</span>
        </div>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            📚 Disciplinas
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {disciplines.length} disciplinas disponíveis — Selecione uma para ver as questões
          </p>
        </div>

        {/* Search */}
        <div className="search-bar">
          <span className="search-bar-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar disciplina..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-all-disciplines"
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
                ? "Configure o Supabase para carregar os dados."
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
                style={{ animationDelay: `${Math.min(i * 0.025, 0.6)}s` }}
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
    </div>
  );
}
