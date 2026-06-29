import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OAB Vassouras — Plataforma de Estudos para o Exame da OAB",
  description:
    "Plataforma completa de estudos para o Exame da OAB com mais de 61.000 questões, 57 disciplinas e simulados inteligentes. Prepare-se para a aprovação com OAB Vassouras.",
  keywords: "OAB, exame da ordem, questões OAB, simulado OAB, Vassouras, direito, prova OAB",
  openGraph: {
    title: "OAB Vassouras — Plataforma de Estudos",
    description: "Mais de 61.000 questões para sua aprovação no Exame da OAB",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="header">
          <div className="header-inner">
            <a href="/" className="header-logo">
              <div className="header-logo-icon">⚖️</div>
              OAB Vassouras
            </a>
            <nav className="header-nav">
              <a href="/">Início</a>
              <a href="/disciplinas">Disciplinas</a>
              <a href="/simulado">Simulado</a>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="footer">
          <div className="container">
            <p>
              © {new Date().getFullYear()} OAB Vassouras — Plataforma de Estudos
              para o Exame da OAB
            </p>
            <p style={{ marginTop: "0.25rem", fontSize: "0.75rem" }}>
              Vassouras/RJ • 61.490 questões • 57 disciplinas
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
