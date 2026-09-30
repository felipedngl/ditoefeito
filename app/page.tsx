"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  User,
  Heart,
  Users,
  Trophy,
  Star,
  Loader2,
  Film,
  X,
  BookOpen,
  ArrowLeft,
  MessageSquare,
  Crown,
  QrCode,
  KeyRound,
} from "lucide-react";

const TMDB_API_KEY = "f387a8d39e74287934d786c1f2c2fe57";

type ModeType = "solo" | "duo" | "grupo" | null;
type ViewType = "busca" | "biblioteca" | "podio";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
}

interface Review {
  author: string;
  text: string;
}

interface EvaluatedMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  ratings: { [author: string]: number };
  averageRating: number;
  reviews: Review[];
}

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<ModeType>(null);
  const [activeView, setActiveView] = useState<ViewType>("busca");

  // Estado de Controle da Conexão
  const [roomCode, setRoomCode] = useState("");
  const [isRoomJoined, setIsRoomJoined] = useState(false);

  // Busca e Listas
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal do Filme Selecionado
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [rating, setRating] = useState<number>(8);
  const [reviewText, setReviewText] = useState("");
  const [userName] = useState("Felipe");
  const [partnerName] = useState("Kelly");
  const [partnerRating, setPartnerRating] = useState<number>(7.5);
  const [partnerReviewText, setPartnerReviewText] = useState("");

  const [activeReviewModal, setActiveReviewModal] = useState<{ author: string; text: string } | null>(null);

  // Lista de Filmes Avaliados
  const [evaluatedList, setEvaluatedList] = useState<EvaluatedMovie[]>([
    {
      id: 550,
      title: "Clube da Luta",
      poster_path: "/pB8BM72569u398492.jpg",
      release_date: "1999-10-15",
      ratings: { Felipe: 9.5, Kelly: 9.0 },
      averageRating: 9.25,
      reviews: [
        { author: "Felipe", text: "Excelente ritmo, atuação impecável e direção magistral do Fincher." },
        { author: "Kelly", text: "Muito bom! O plot twist do final é surreal." },
      ],
    },
  ]);

  // Carregar Populares
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=pt-BR`
        );
        const data = await res.json();
        if (data.results) {
          setTrendingMovies(data.results.slice(0, 16));
        }
      } catch (e) {
        console.error("Erro ao carregar populares:", e);
      }
    };
    fetchTrending();
  }, []);

  // Busca TMDB
  useEffect(() => {
    const fetchSearch = async () => {
      if (searchQuery.trim().length < 3) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(
            searchQuery
          )}`
        );
        const data = await res.json();
        if (data.results) {
          setSearchResults(data.results);
        }
      } catch (err) {
        console.error("Erro na busca:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Clique na Estrela (1 a 10 e .5)
  const handleStarClick = (starIndex: number, currentVal: number, setValFunc: (v: number) => void) => {
    if (currentVal === starIndex) {
      setValFunc(starIndex - 0.5);
    } else {
      setValFunc(starIndex);
    }
  };

  // Salvar Votação
  const handleSaveEvaluation = () => {
    if (!selectedMovie) return;

    const isDuoOrGroup = selectedMode === "duo" || selectedMode === "grupo";
    const ratingsObj: { [k: string]: number } = { [userName]: rating };
    const reviewsArr: Review[] = [];

    if (reviewText.trim()) {
      reviewsArr.push({ author: userName, text: reviewText });
    }

    if (isDuoOrGroup) {
      ratingsObj[partnerName] = partnerRating;
      if (partnerReviewText.trim()) {
        reviewsArr.push({ author: partnerName, text: partnerReviewText });
      }
    }

    const ratingValues = Object.values(ratingsObj);
    const avg = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;

    const newEval: EvaluatedMovie = {
      id: selectedMovie.id,
      title: selectedMovie.title,
      poster_path: selectedMovie.poster_path,
      release_date: selectedMovie.release_date,
      ratings: ratingsObj,
      averageRating: parseFloat(avg.toFixed(1)),
      reviews: reviewsArr,
    };

    setEvaluatedList((prev) => [newEval, ...prev.filter((m) => m.id !== selectedMovie.id)]);
    setSelectedMovie(null);
    setReviewText("");
    setPartnerReviewText("");
    setActiveView("podio");
  };

  const currentDisplayList = searchQuery.length >= 3 ? searchResults : trendingMovies;
  const sortedPodiumList = [...evaluatedList].sort((a, b) => b.averageRating - a.averageRating);
  const firstPlace = sortedPodiumList[0];
  const secondPlace = sortedPodiumList[1];
  const thirdPlace = sortedPodiumList[2];
  const restOfPodium = sortedPodiumList.slice(3);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#060913",
        color: "#f8fafc",
        padding: "2rem 1rem",
        fontFamily: "sans-serif",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* --- ESTILO DO RETRO GRID INLINE --- */}
      <style>{`
        .retro-grid-container {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
          opacity: 0.4;
        }
        .retro-grid-plane {
          position: absolute;
          inset: -100%;
          background-image: 
            linear-gradient(to right, rgba(236, 72, 153, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(236, 72, 153, 0.3) 1px, transparent 1px);
          background-size: 50px 50px;
          transform: perspective(600px) rotateX(60deg);
          animation: grid-slide 12s linear infinite;
          transform-origin: 50% 0;
        }
        @keyframes grid-slide {
          0% { transform: perspective(600px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(600px) rotateX(60deg) translateY(50px); }
        }
      `}</style>

      {/* Fundo Retro Grid */}
      <div className="retro-grid-container">
        <div className="retro-grid-plane" />
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 10 }}>
        
        {/* ================= 1. TELA INICIAL ================= */}
        {!selectedMode ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: "2.5rem", textAlign: "center" }}>
            
            {/* Header / Logo Centralizada */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <img
                src="/logo.png"
                alt="Dito & Feito Logo"
                style={{ maxWidth: "160px", maxHeight: "110px", objectFit: "contain", marginBottom: "0.5rem" }}
                onError={(e) => ((e.target as HTMLElement).style.display = "none")}
              />
              <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#ec4899", margin: 0, textShadow: "0 0 20px rgba(236,72,153,0.6)" }}>
                DITO & FEITO
              </h1>
              <p style={{ color: "#22d3ee", fontSize: "1.1rem", margin: 0, letterSpacing: "2px", fontWeight: "600" }}>
                SESSÃO DISCO & AVALIAÇÕES DE CINEMA
              </p>
            </div>

            {/* Três Botões de Modo em Grade/Horizontal */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", width: "100%" }}>
              
              {/* Botão Solo */}
              <button
                onClick={() => {
                  setSelectedMode("solo");
                  setIsRoomJoined(true); // Solo vai direto para a busca
                }}
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(236, 72, 153, 0.5)",
                  borderRadius: "1.5rem",
                  padding: "1.75rem 1.25rem",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                  boxShadow: "0 0 20px rgba(236, 72, 153, 0.15)",
                }}
              >
                <User style={{ width: "2.25rem", height: "2.25rem", color: "#ec4899" }} />
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#ec4899", margin: 0 }}>Solo</h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>Avaliações individuais.</p>
              </button>

              {/* Botão Casalzinho */}
              <button
                onClick={() => {
                  setSelectedMode("duo");
                  setIsRoomJoined(false); // Exige a tela de código/QR Code
                }}
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(34, 211, 238, 0.5)",
                  borderRadius: "1.5rem",
                  padding: "1.75rem 1.25rem",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                  boxShadow: "0 0 20px rgba(34, 211, 238, 0.15)",
                }}
              >
                <Heart style={{ width: "2.25rem", height: "2.25rem", color: "#22d3ee" }} />
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#22d3ee", margin: 0 }}>Casalzinho</h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>Avaliação conjunta, com a nota conjunta</p>
              </button>

              {/* Botão Grupinho */}
              <button
                onClick={() => {
                  setSelectedMode("grupo");
                  setIsRoomJoined(false); // Exige a tela de código/QR Code
                }}
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(234, 179, 8, 0.5)",
                  borderRadius: "1.5rem",
                  padding: "1.75rem 1.25rem",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                  boxShadow: "0 0 20px rgba(234, 179, 8, 0.15)",
                }}
              >
                <Users style={{ width: "2.25rem", height: "2.25rem", color: "#eab308" }} />
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#eab308", margin: 0 }}>Grupinho</h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>Avaliação de 3 a 10 amigos juntos.</p>
              </button>

            </div>
          </div>
        ) : !isRoomJoined ? (

          /* ================= 2. TELA DE CONEXÃO (QR CODE / CÓDIGO) ================= */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "75vh", justifyContent: "center", gap: "1.5rem" }}>
            <button
              onClick={() => setSelectedMode(null)}
              style={{ background: "none", border: "none", color: "#ec4899", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}
            >
              <ArrowLeft style={{ width: "1.1rem", height: "1.1rem" }} /> Voltar para Seleção de Modo
            </button>

            <div
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(34, 211, 238, 0.5)",
                borderRadius: "1.5rem",
                padding: "2rem",
                width: "100%",
                maxWidth: "460px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                boxShadow: "0 0 30px rgba(34, 211, 238, 0.2)",
              }}
            >
              <h2 style={{ color: "#22d3ee", margin: 0, fontSize: "1.5rem" }}>
                Conectar Sessão ({selectedMode === "duo" ? "Casalzinho" : "Grupinho"})
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0, lineHeight: "1.4" }}>
                Escaneie o QR Code ou digite o código da sala para sincronizar as notas com o grupo.
              </p>

              {/* Bloco de QR Code Stylized */}
              <div style={{ width: "170px", height: "170px", backgroundColor: "#020617", border: "2px solid #22d3ee", borderRadius: "1rem", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <QrCode style={{ width: "85px", height: "85px", color: "#22d3ee" }} />
                <span style={{ fontSize: "0.8rem", color: "#22d3ee", fontFamily: "monospace", fontWeight: "bold" }}>CÓDIGO: DISCO80</span>
              </div>

              {/* Form de Código */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div style={{ position: "relative" }}>
                  <KeyRound style={{ position: "absolute", left: "1rem", top: "0.85rem", width: "1.1rem", height: "1.1rem", color: "#22d3ee" }} />
                  <input
                    type="text"
                    placeholder="DIGITE O CÓDIGO DA SALA"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    style={{
                      width: "100%",
                      backgroundColor: "#020617",
                      border: "1px solid #334155",
                      borderRadius: "0.75rem",
                      padding: "0.75rem 1rem 0.75rem 2.75rem",
                      textAlign: "center",
                      color: "#fff",
                      textTransform: "uppercase",
                      outline: "none",
                      fontSize: "0.9rem",
                      letterSpacing: "1px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <button
                  onClick={() => setIsRoomJoined(true)}
                  style={{
                    backgroundColor: "#06b6d4",
                    color: "#020617",
                    border: "none",
                    borderRadius: "0.75rem",
                    padding: "0.9rem",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(6, 182, 212, 0.4)",
                  }}
                >
                  ENTRAR NA SESSÃO
                </button>
              </div>
            </div>
          </div>

        ) : (

          /* ================= 3. ÁREA DE BUSCA, BIBLIOTECA E PÓDIO ================= */
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Topbar da Sessão */}
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(236,72,153,0.4)", padding: "1rem 1.25rem", borderRadius: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button
                  onClick={() => setSelectedMode(null)}
                  style={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.5rem", color: "#ec4899", cursor: "pointer" }}
                  title="Sair do Modo"
                >
                  <ArrowLeft style={{ width: "1.2rem", height: "1.2rem" }} />
                </button>
                <div>
                  <h1 style={{ fontSize: "1.2rem", color: "#ec4899", margin: 0, fontWeight: "bold" }}>DITO & FEITO</h1>
                  <span style={{ fontSize: "0.75rem", color: "#22d3ee", textTransform: "uppercase", fontWeight: "bold" }}>
                    {selectedMode === "duo" ? "Casalzinho" : selectedMode}
                  </span>
                </div>
              </div>

              {/* Menu de Abas */}
              <nav style={{ display: "flex", gap: "0.4rem", backgroundColor: "#020617", padding: "0.3rem", borderRadius: "1rem" }}>
                {[
                  { id: "busca", label: "Buscar Filmes", icon: Search },
                  { id: "biblioteca", label: "Biblioteca", icon: BookOpen },
                  { id: "podio", label: "Pódio", icon: Trophy },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeView === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveView(tab.id as ViewType)}
                      style={{
                        backgroundColor: isActive ? "#db2777" : "transparent",
                        color: "#fff",
                        border: "none",
                        padding: "0.5rem 0.85rem",
                        borderRadius: "0.75rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                      }}
                    >
                      <Icon style={{ width: "1rem", height: "1rem" }} /> {tab.label}
                    </button>
                  );
                })}
              </nav>
            </header>

            {/* --- ABA BUSCA DE FILMES --- */}
            {activeView === "busca" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Campo de Busca */}
                <div style={{ position: "relative", width: "100%" }}>
                  <Search style={{ position: "absolute", left: "1.2rem", top: "1.1rem", width: "1.2rem", height: "1.2rem", color: "#ec4899" }} />
                  <input
                    type="text"
                    placeholder="Digite o nome do filme (ex: Matrix, Pulp Fiction)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "1px solid rgba(236,72,153,0.5)",
                      borderRadius: "1.25rem",
                      padding: "1rem 1rem 1rem 3rem",
                      color: "#fff",
                      fontSize: "1.1rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  {loading && <Loader2 style={{ position: "absolute", right: "1.2rem", top: "1.1rem", width: "1.2rem", height: "1.2rem", color: "#22d3ee" }} className="animate-spin" />}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#94a3b8" }}>
                  <span>{searchQuery.length >= 3 ? `RESULTADOS PARA "${searchQuery.toUpperCase()}"` : "FILMES POPULARES EM ALTA"}</span>
                  <span>CLIQUE NA CAPA PARA AVALIAR</span>
                </div>

                {/* Grade Proporcional de Filmes Verticais */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "1.25rem" }}>
                  {currentDisplayList.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => setSelectedMovie(movie)}
                      style={{
                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                        border: "1px solid #1e293b",
                        borderRadius: "1rem",
                        padding: "0.75rem",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        transition: "transform 0.2s, border-color 0.2s",
                      }}
                    >
                      {/* Capa Proporcional 2:3 */}
                      <div style={{ aspectRatio: "2/3", width: "100%", backgroundColor: "#020617", borderRadius: "0.75rem", overflow: "hidden", position: "relative" }}>
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <Film style={{ width: "2rem", height: "2rem", margin: "auto", color: "#475569" }} />
                        )}
                        <span style={{ position: "absolute", top: "0.4rem", right: "0.4rem", backgroundColor: "rgba(2,6,23,0.85)", border: "1px solid rgba(234,179,8,0.5)", color: "#eab308", fontSize: "0.7rem", fontWeight: "bold", padding: "0.15rem 0.4rem", borderRadius: "0.4rem" }}>
                          ★ {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                        </span>
                      </div>

                      <h3 style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#f8fafc", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {movie.title}
                      </h3>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {movie.release_date?.split("-")[0] || "Ano N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- ABA BIBLIOTECA --- */}
            {activeView === "biblioteca" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <h2 style={{ color: "#22d3ee", margin: 0, fontSize: "1.4rem" }}>Biblioteca de Filmes Avaliados</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
                  {evaluatedList.map((item) => (
                    <div key={item.id} style={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(34, 211, 238, 0.3)", padding: "1rem", borderRadius: "1.25rem", display: "flex", gap: "1rem" }}>
                      <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title} style={{ width: "75px", height: "110px", borderRadius: "0.6rem", objectFit: "cover" }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: "1rem", color: "#fff" }}>{item.title}</h3>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                          {Object.entries(item.ratings).map(([author, score]) => (
                            <span key={author} style={{ backgroundColor: "#020617", padding: "0.25rem 0.5rem", borderRadius: "0.5rem", fontSize: "0.75rem", color: "#ec4899", border: "1px solid #1e293b" }}>
                              {author}: {score} ★
                            </span>
                          ))}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "auto" }}>
                          {item.reviews.map((rev) => (
                            <button
                              key={rev.author}
                              onClick={() => setActiveReviewModal(rev)}
                              style={{ backgroundColor: "rgba(34,211,238,0.15)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.4)", borderRadius: "0.5rem", padding: "0.2rem 0.5rem", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem" }}
                            >
                              <MessageSquare style={{ width: "0.7rem", height: "0.7rem" }} /> Crítica de {rev.author}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- ABA PÓDIO --- */}
            {activeView === "podio" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2.5rem", textAlign: "center" }}>
                <div>
                  <h2 style={{ color: "#eab308", fontSize: "1.8rem", margin: 0, fontWeight: "bold" }}>PÓDIO DA SESSÃO</h2>
                  <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem" }}>Classificação baseada na nota média</p>
                </div>

                <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", justifyContent: "center", width: "100%", maxWidth: "600px" }}>
                  {/* 2º Lugar */}
                  {secondPlace && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                      <div style={{ width: "90px", height: "135px", borderRadius: "0.75rem", overflow: "hidden", border: "2px solid #22d3ee" }}>
                        <img src={`https://image.tmdb.org/t/p/w500${secondPlace.poster_path}`} alt={secondPlace.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <span style={{ fontSize: "0.85rem", color: "#22d3ee", fontWeight: "bold", marginTop: "0.5rem" }}>{secondPlace.averageRating} ★</span>
                      <div style={{ width: "100%", height: "100px", backgroundColor: "rgba(6,182,212,0.2)", borderTop: "3px solid #22d3ee", borderRadius: "0.75rem 0.75rem 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: "bold", color: "#22d3ee" }}>2</div>
                    </div>
                  )}

                  {/* 1º Lugar */}
                  {firstPlace && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, marginTop: "-2rem" }}>
                      <Crown style={{ width: "2.5rem", height: "2.5rem", color: "#eab308", marginBottom: "0.25rem" }} />
                      <div style={{ width: "110px", height: "165px", borderRadius: "0.75rem", overflow: "hidden", border: "3px solid #eab308", boxShadow: "0 0 25px rgba(234,179,8,0.4)" }}>
                        <img src={`https://image.tmdb.org/t/p/w500${firstPlace.poster_path}`} alt={firstPlace.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <span style={{ fontSize: "1rem", color: "#eab308", fontWeight: "bold", marginTop: "0.5rem" }}>{firstPlace.averageRating} ★</span>
                      <div style={{ width: "100%", height: "140px", backgroundColor: "rgba(234,179,8,0.25)", borderTop: "4px solid #eab308", borderRadius: "0.75rem 0.75rem 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", fontWeight: "bold", color: "#eab308" }}>1</div>
                    </div>
                  )}

                  {/* 3º Lugar */}
                  {thirdPlace && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                      <div style={{ width: "90px", height: "135px", borderRadius: "0.75rem", overflow: "hidden", border: "2px solid #ec4899" }}>
                        <img src={`https://image.tmdb.org/t/p/w500${thirdPlace.poster_path}`} alt={thirdPlace.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <span style={{ fontSize: "0.85rem", color: "#ec4899", fontWeight: "bold", marginTop: "0.5rem" }}>{thirdPlace.averageRating} ★</span>
                      <div style={{ width: "100%", height: "80px", backgroundColor: "rgba(236,72,153,0.2)", borderTop: "3px solid #ec4899", borderRadius: "0.75rem 0.75rem 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: "bold", color: "#ec4899" }}>3</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= MODAL DE AVALIAÇÃO DO FILME ================= */}
        {selectedMovie && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2,6,23,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 100 }}>
            <div style={{ backgroundColor: "#0f172a", border: "1px solid rgba(236,72,153,0.5)", borderRadius: "1.5rem", padding: "1.5rem", maxWidth: "520px", width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative", boxSizing: "border-box" }}>
              
              <button onClick={() => setSelectedMovie(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                <X style={{ width: "1.25rem", height: "1.25rem" }} />
              </button>

              {/* Header do Filme */}
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <img src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`} alt={selectedMovie.title} style={{ width: "90px", height: "135px", borderRadius: "0.6rem", objectFit: "cover" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#fff" }}>{selectedMovie.title}</h3>
                  <span style={{ fontSize: "0.75rem", color: "#eab308", fontWeight: "bold" }}>TMDB: {selectedMovie.vote_average?.toFixed(1)} / 10 ★</span>
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.3" }}>
                    {selectedMovie.overview || "Sem sinopse."}
                  </p>
                </div>
              </div>

              {/* Votação Principal */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#ec4899", fontWeight: "bold" }}>Nota de {userName}: {rating} / 10 ★</span>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button key={star} onClick={() => handleStarClick(star, rating, setRating)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <Star style={{ width: "1.2rem", height: "1.2rem", color: rating >= star ? "#ec4899" : "#334155", fill: rating >= star ? "#ec4899" : "none" }} />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder={`Sua crítica/resenha (opcional)...`}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  style={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.75rem", color: "#fff", fontSize: "0.85rem", outline: "none", resize: "none" }}
                />
              </div>

              {/* Votação Dupla (Casalzinho / Grupinho) */}
              {(selectedMode === "duo" || selectedMode === "grupo") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px solid #1e293b", paddingTop: "0.75rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "#22d3ee", fontWeight: "bold" }}>Nota de {partnerName}: {partnerRating} / 10 ★</span>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button key={star} onClick={() => handleStarClick(star, partnerRating, setPartnerRating)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <Star style={{ width: "1.2rem", height: "1.2rem", color: partnerRating >= star ? "#22d3ee" : "#334155", fill: partnerRating >= star ? "#22d3ee" : "none" }} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder={`Crítica/resenha de ${partnerName} (opcional)...`}
                    value={partnerReviewText}
                    onChange={(e) => setPartnerReviewText(e.target.value)}
                    style={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.75rem", color: "#fff", fontSize: "0.85rem", outline: "none", resize: "none" }}
                  />
                </div>
              )}

              <button onClick={handleSaveEvaluation} style={{ backgroundColor: "#db2777", color: "#fff", border: "none", borderRadius: "0.75rem", padding: "0.85rem", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem" }}>
                ENVIAR AVALIAÇÃO
              </button>
            </div>
          </div>
        )}

        {/* MODAL DE CRÍTICA */}
        {activeReviewModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2,6,23,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 100 }}>
            <div style={{ backgroundColor: "#0f172a", border: "1px solid #22d3ee", borderRadius: "1.5rem", padding: "1.5rem", maxWidth: "400px", width: "100%", display: "flex", flexDirection: "column", gap: "1rem", position: "relative" }}>
              <button onClick={() => setActiveReviewModal(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                <X style={{ width: "1.25rem", height: "1.25rem" }} />
              </button>
              <h3 style={{ margin: 0, color: "#22d3ee", fontSize: "1rem" }}>Crítica de {activeReviewModal.author}</h3>
              <p style={{ backgroundColor: "#020617", padding: "1rem", borderRadius: "0.75rem", border: "1px solid #1e293b", fontSize: "0.85rem", color: "#cbd5e1", fontStyle: "italic", margin: 0 }}>
                "{activeReviewModal.text}"
              </p>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
