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
  Tv,
  X,
  BookOpen,
  ArrowLeft,
  MessageSquare,
  Crown,
  QrCode,
  KeyRound,
  Pencil,
  Trash2,
} from "lucide-react";

const TMDB_API_KEY = "f387a8d39e74287934d786c1f2c2fe57";

type ModeType = "solo" | "duo" | "grupo" | null;
type ViewType = "busca" | "biblioteca" | "podio";

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  media_type?: "movie" | "tv";
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  overview: string;
}

interface Review {
  author: string;
  text: string;
}

interface EvaluatedItem {
  id: number;
  title: string;
  media_type: "movie" | "tv";
  poster_path: string | null;
  release_date: string;
  ratings: { [author: string]: number };
  averageRating: number;
  reviews: Review[];
}

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<ModeType>(null);
  const [activeView, setActiveView] = useState<ViewType>("busca");

  // Nomes dos Participantes
  const [userName, setUserName] = useState("");
  const [partnerName, setPartnerName] = useState("");

  // Código de Sala
  const [customRoomCode, setCustomRoomCode] = useState("");
  const [isRoomJoined, setIsRoomJoined] = useState(false);

  // Busca TMDB
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [trendingMedia, setTrendingMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal de Avaliação
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null);
  
  // Notas zeradas por padrão (0)
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [partnerRating, setPartnerRating] = useState<number>(0);
  const [partnerReviewText, setPartnerReviewText] = useState("");

  const [activeReviewModal, setActiveReviewModal] = useState<{ author: string; text: string } | null>(null);

  // Lista de Avaliações
  const [evaluatedList, setEvaluatedList] = useState<EvaluatedItem[]>([]);

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    const savedData = localStorage.getItem("ditoefeito_evaluations");
    if (savedData) {
      try {
        setEvaluatedList(JSON.parse(savedData));
      } catch (e) {
        console.error("Erro ao ler dados salvos:", e);
      }
    }
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("ditoefeito_evaluations", JSON.stringify(evaluatedList));
  }, [evaluatedList]);

  // Gerar código de sala
  const handleGenerateRandomCode = () => {
    const randomCode = "SESSAO-" + Math.floor(1000 + Math.random() * 9000);
    setCustomRoomCode(randomCode);
  };

  // Carregar em alta da semana
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}&language=pt-BR`
        );
        const data = await res.json();
        if (data.results) {
          const filtered = data.results.filter(
            (item: any) => item.media_type === "movie" || item.media_type === "tv"
          );
          setTrendingMedia(filtered.slice(0, 16));
        }
      } catch (e) {
        console.error("Erro ao carregar em alta:", e);
      }
    };
    fetchTrending();
  }, []);

  // Busca Multi no TMDB
  useEffect(() => {
    const fetchSearch = async () => {
      if (searchQuery.trim().length < 3) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(
            searchQuery
          )}`
        );
        const data = await res.json();
        if (data.results) {
          const filtered = data.results.filter(
            (item: any) => item.media_type === "movie" || item.media_type === "tv"
          );
          setSearchResults(filtered);
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

  // Editar Filme/Série
  const handleEditEvaluation = (item: EvaluatedItem) => {
    const mediaObj: MediaItem = {
      id: item.id,
      title: item.title,
      media_type: item.media_type,
      poster_path: item.poster_path,
      release_date: item.release_date,
      vote_average: 0,
      overview: "",
    };

    setSelectedMedia(mediaObj);
    setEditingMediaId(item.id);

    const currentUser = userName.trim() || "Você";
    const currentPartner = partnerName.trim() || "Parceiro(a)";

    setRating(item.ratings[currentUser] || 0);
    setReviewText(item.reviews.find((r) => r.author === currentUser)?.text || "");

    if (selectedMode === "duo" || selectedMode === "grupo") {
      setPartnerRating(item.ratings[currentPartner] || 0);
      setPartnerReviewText(item.reviews.find((r) => r.author === currentPartner)?.text || "");
    }
  };

  // Excluir Avaliação
  const handleDeleteEvaluation = (id: number) => {
    setEvaluatedList((prev) => prev.filter((item) => item.id !== id));
  };

  // Salvar Votação
  const handleSaveEvaluation = () => {
    if (!selectedMedia) return;

    const isDuoOrGroup = selectedMode === "duo" || selectedMode === "grupo";
    const authorOne = userName.trim() || "Você";
    const authorTwo = partnerName.trim() || "Parceiro(a)";

    const ratingsObj: { [k: string]: number } = { [authorOne]: rating };
    const reviewsArr: Review[] = [];

    if (reviewText.trim()) {
      reviewsArr.push({ author: authorOne, text: reviewText });
    }

    if (isDuoOrGroup) {
      ratingsObj[authorTwo] = partnerRating;
      if (partnerReviewText.trim()) {
        reviewsArr.push({ author: authorTwo, text: partnerReviewText });
      }
    }

    const ratingValues = Object.values(ratingsObj);
    const avg = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;
    const titleOrName = selectedMedia.title || selectedMedia.name || "Sem título";
    const releaseDate = selectedMedia.release_date || selectedMedia.first_air_date || "";

    const newEval: EvaluatedItem = {
      id: selectedMedia.id,
      title: titleOrName,
      media_type: selectedMedia.media_type || "movie",
      poster_path: selectedMedia.poster_path,
      release_date: releaseDate,
      ratings: ratingsObj,
      averageRating: parseFloat(avg.toFixed(1)),
      reviews: reviewsArr,
    };

    setEvaluatedList((prev) => [newEval, ...prev.filter((m) => m.id !== selectedMedia.id)]);
    setSelectedMedia(null);
    setEditingMediaId(null);
    setReviewText("");
    setPartnerReviewText("");
    setActiveView("podio");
  };

  const currentDisplayList = searchQuery.length >= 3 ? searchResults : trendingMedia;
  const sortedPodiumList = [...evaluatedList].sort((a, b) => b.averageRating - a.averageRating);
  const firstPlace = sortedPodiumList[0];
  const secondPlace = sortedPodiumList[1];
  const thirdPlace = sortedPodiumList[2];

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
      <style>{`
        .retro-grid-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .retro-grid-lines {
          position: absolute;
          inset: -100%;
          background-image: 
            linear-gradient(to right, rgba(236, 72, 153, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(236, 72, 153, 0.2) 1px, transparent 1px);
          background-size: 60px 60px;
          transform: perspective(500px) rotateX(65deg);
          animation: grid-scroll 15s linear infinite;
          transform-origin: 50% 0;
        }
        .retro-grid-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 40%, rgba(6, 9, 19, 0.85) 20%, rgba(6, 9, 19, 0.98) 100%);
        }
        @keyframes grid-scroll {
          0% { transform: perspective(500px) rotateX(65deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(65deg) translateY(60px); }
        }
      `}</style>

      <div className="retro-grid-bg">
        <div className="retro-grid-lines" />
        <div className="retro-grid-overlay" />
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 10 }}>
        
        {/* ================= 1. TELA INICIAL ================= */}
        {!selectedMode ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: "2.5rem", textAlign: "center" }}>
            
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
                AVALIAÇÕES DE FILMES E SÉRIES
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", width: "100%" }}>
              
              <button
                onClick={() => setSelectedMode("solo")}
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
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

              <button
                onClick={() => setSelectedMode("duo")}
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
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

              <button
                onClick={() => setSelectedMode("grupo")}
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
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

          /* ================= 2. TELA DE IDENTIFICAÇÃO E CÓDIGO DA SALA ================= */
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
                gap: "1.25rem",
                boxShadow: "0 0 30px rgba(34, 211, 238, 0.2)",
              }}
            >
              <h2 style={{ color: "#22d3ee", margin: 0, fontSize: "1.5rem" }}>
                Identificação da Sessão ({selectedMode === "duo" ? "Casalzinho" : selectedMode === "grupo" ? "Grupinho" : "Solo"})
              </h2>

              {/* Formulário de Nomes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "left" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#ec4899", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>
                    Seu Nome:
                  </label>
                  <input
                    type="text"
                    placeholder="Digite seu nome..."
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "#020617",
                      border: "1px solid #334155",
                      borderRadius: "0.75rem",
                      padding: "0.75rem",
                      color: "#fff",
                      outline: "none",
                      fontSize: "0.85rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {(selectedMode === "duo" || selectedMode === "grupo") && (
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "#22d3ee", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>
                      Nome do(a) Acompanhante / Parceiro(a):
                    </label>
                    <input
                      type="text"
                      placeholder="Digite o nome..."
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      style={{
                        width: "100%",
                        backgroundColor: "#020617",
                        border: "1px solid #334155",
                        borderRadius: "0.75rem",
                        padding: "0.75rem",
                        color: "#fff",
                        outline: "none",
                        fontSize: "0.85rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Se for Duo ou Grupo, exibe Código da Sala */}
              {(selectedMode === "duo" || selectedMode === "grupo") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", borderTop: "1px solid #1e293b", paddingTop: "1rem" }}>
                  <div style={{ width: "140px", height: "140px", backgroundColor: "#020617", border: "2px solid #22d3ee", borderRadius: "1rem", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                    <QrCode style={{ width: "70px", height: "70px", color: "#22d3ee" }} />
                    <span style={{ fontSize: "0.75rem", color: "#22d3ee", fontFamily: "monospace", fontWeight: "bold" }}>
                      {customRoomCode ? customRoomCode : "CÓDIGO SALA"}
                    </span>
                  </div>

                  <div style={{ position: "relative" }}>
                    <KeyRound style={{ position: "absolute", left: "1rem", top: "0.85rem", width: "1.1rem", height: "1.1rem", color: "#22d3ee" }} />
                    <input
                      type="text"
                      placeholder="CÓDIGO DA SALA (EX: DISCO123)"
                      value={customRoomCode}
                      onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
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
                        fontSize: "0.85rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <button
                    onClick={handleGenerateRandomCode}
                    style={{ background: "none", border: "none", color: "#22d3ee", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline" }}
                  >
                    ⚡ Gerar código aleatório
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  if ((selectedMode === "duo" || selectedMode === "grupo") && !customRoomCode.trim()) {
                    alert("Por favor, digite ou gere um código para a sala.");
                    return;
                  }
                  setIsRoomJoined(true);
                }}
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
                  marginTop: "0.5rem",
                }}
              >
                ENTRAR NA SESSÃO
              </button>
            </div>
          </div>

        ) : (

          /* ================= 3. ÁREA PRINCIPAL ================= */
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(236,72,153,0.4)", padding: "1rem 1.25rem", borderRadius: "1.5rem" }}>
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
                    {selectedMode === "duo" ? "Casalzinho" : selectedMode} {customRoomCode && `(${customRoomCode})`}
                  </span>
                </div>
              </div>

              <nav style={{ display: "flex", gap: "0.4rem", backgroundColor: "#020617", padding: "0.3rem", borderRadius: "1rem" }}>
                {[
                  { id: "busca", label: "Buscar", icon: Search },
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

            {/* --- ABA BUSCA DE FILMES E SÉRIES --- */}
            {activeView === "busca" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ position: "relative", width: "100%" }}>
                  <Search style={{ position: "absolute", left: "1.2rem", top: "1.1rem", width: "1.2rem", height: "1.2rem", color: "#ec4899" }} />
                  <input
                    type="text"
                    placeholder="Pesquise um filme ou série (ex: Breaking Bad, Interstellar)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
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
                  <span>{searchQuery.length >= 3 ? `SUGESTÕES PARA "${searchQuery.toUpperCase()}"` : "FILMES E SÉRIES EM ALTA DA SEMANA"}</span>
                  <span>CLIQUE NA CAPA PARA AVALIAR</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "1.25rem" }}>
                  {currentDisplayList.map((media) => {
                    const isTv = media.media_type === "tv" || (!media.title && !!media.name);
                    const titleText = media.title || media.name || "Sem título";
                    const yearText = (media.release_date || media.first_air_date)?.split("-")[0] || "Ano N/A";

                    return (
                      <div
                        key={media.id}
                        onClick={() => {
                          setSelectedMedia({ ...media, media_type: isTv ? "tv" : "movie" });
                          setEditingMediaId(null);
                          // Nota zerada ao abrir novo filme
                          setRating(0);
                          setReviewText("");
                          setPartnerRating(0);
                          setPartnerReviewText("");
                        }}
                        style={{
                          backgroundColor: "rgba(15, 23, 42, 0.85)",
                          border: "1px solid #1e293b",
                          borderRadius: "1rem",
                          padding: "0.75rem",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        <div style={{ aspectRatio: "2/3", width: "100%", backgroundColor: "#020617", borderRadius: "0.75rem", overflow: "hidden", position: "relative" }}>
                          {media.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w500${media.poster_path}`}
                              alt={titleText}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <Film style={{ width: "2rem", height: "2rem", margin: "auto", color: "#475569" }} />
                          )}
                          
                          <span style={{ position: "absolute", top: "0.4rem", left: "0.4rem", backgroundColor: isTv ? "rgba(34,211,238,0.85)" : "rgba(236,72,153,0.85)", color: "#020617", fontSize: "0.65rem", fontWeight: "bold", padding: "0.15rem 0.35rem", borderRadius: "0.3rem", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            {isTv ? <Tv style={{ width: "0.6rem", height: "0.6rem" }} /> : <Film style={{ width: "0.6rem", height: "0.6rem" }} />}
                            {isTv ? "SÉRIE" : "FILME"}
                          </span>

                          <span style={{ position: "absolute", top: "0.4rem", right: "0.4rem", backgroundColor: "rgba(2,6,23,0.85)", border: "1px solid rgba(234,179,8,0.5)", color: "#eab308", fontSize: "0.7rem", fontWeight: "bold", padding: "0.15rem 0.4rem", borderRadius: "0.4rem" }}>
                            ★ {media.vote_average ? media.vote_average.toFixed(1) : "N/A"}
                          </span>
                        </div>

                        <h3 style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#f8fafc", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {titleText}
                        </h3>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {yearText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- ABA BIBLIOTECA --- */}
            {activeView === "biblioteca" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <h2 style={{ color: "#22d3ee", margin: 0, fontSize: "1.4rem" }}>Biblioteca de Filmes & Séries</h2>
                
                {evaluatedList.length === 0 ? (
                  <div style={{ backgroundColor: "rgba(15, 23, 42, 0.8)", padding: "2.5rem", borderRadius: "1.5rem", textAlign: "center", color: "#94a3b8" }}>
                    <BookOpen style={{ width: "2.5rem", height: "2.5rem", margin: "0 auto 1rem auto", color: "#ec4899" }} />
                    <p style={{ margin: 0 }}>Nenhum filme ou série avaliado ainda.</p>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Pesquise na aba "Buscar" para dar sua nota!</span>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
                    {evaluatedList.map((item) => (
                      <div key={item.id} style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(34, 211, 238, 0.3)", padding: "1rem", borderRadius: "1.25rem", display: "flex", gap: "1rem", position: "relative" }}>
                        
                        <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title} style={{ width: "75px", height: "110px", borderRadius: "0.6rem", objectFit: "cover" }} />
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <h3 style={{ margin: 0, fontSize: "1rem", color: "#fff" }}>{item.title}</h3>
                              <span style={{ fontSize: "0.65rem", color: item.media_type === "tv" ? "#22d3ee" : "#ec4899", fontWeight: "bold" }}>
                                {item.media_type === "tv" ? "SÉRIE" : "FILME"}
                              </span>
                            </div>
                            
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                              <button
                                onClick={() => handleEditEvaluation(item)}
                                style={{ background: "none", border: "none", color: "#22d3ee", cursor: "pointer", padding: "0.2rem" }}
                                title="Editar Nota"
                              >
                                <Pencil style={{ width: "0.9rem", height: "0.9rem" }} />
                              </button>
                              <button
                                onClick={() => handleDeleteEvaluation(item.id)}
                                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0.2rem" }}
                                title="Excluir"
                              >
                                <Trash2 style={{ width: "0.9rem", height: "0.9rem" }} />
                              </button>
                            </div>
                          </div>

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
                )}
              </div>
            )}

            {/* --- ABA PÓDIO --- */}
            {activeView === "podio" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2.5rem", textAlign: "center" }}>
                <div>
                  <h2 style={{ color: "#eab308", fontSize: "1.8rem", margin: 0, fontWeight: "bold" }}>PÓDIO DA SESSÃO</h2>
                  <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem" }}>Classificação geral por nota média</p>
                </div>

                {evaluatedList.length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                    Nenhum título no pódio ainda.
                  </div>
                ) : (
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
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= MODAL DE AVALIAÇÃO DO FILME / SÉRIE ================= */}
        {selectedMedia && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2,6,23,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 100 }}>
            <div style={{ backgroundColor: "#0f172a", border: "1px solid rgba(236,72,153,0.5)", borderRadius: "1.5rem", padding: "1.5rem", maxWidth: "520px", width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative", boxSizing: "border-box" }}>
              
              <button onClick={() => setSelectedMedia(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                <X style={{ width: "1.25rem", height: "1.25rem" }} />
              </button>

              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <img src={`https://image.tmdb.org/t/p/w500${selectedMedia.poster_path}`} alt={selectedMedia.title || selectedMedia.name} style={{ width: "90px", height: "135px", borderRadius: "0.6rem", objectFit: "cover" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#fff" }}>{selectedMedia.title || selectedMedia.name}</h3>
                  <span style={{ fontSize: "0.75rem", color: "#eab308", fontWeight: "bold" }}>
                    {editingMediaId ? "Modo de Edição" : `TMDB: ${selectedMedia.vote_average?.toFixed(1) || "N/A"} / 10 ★`}
                  </span>
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.3" }}>
                    {selectedMedia.overview || "Sem sinopse cadastrada."}
                  </p>
                </div>
              </div>

              {/* Avaliação do Usuário Principal */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#ec4899", fontWeight: "bold" }}>
                  Nota de {userName.trim() || "Você"}: {rating} / 10 ★
                </span>
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

              {/* Avaliação do Parceiro */}
              {(selectedMode === "duo" || selectedMode === "grupo") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px solid #1e293b", paddingTop: "0.75rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "#22d3ee", fontWeight: "bold" }}>
                    Nota de {partnerName.trim() || "Parceiro(a)"}: {partnerRating} / 10 ★
                  </span>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button key={star} onClick={() => handleStarClick(star, partnerRating, setPartnerRating)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <Star style={{ width: "1.2rem", height: "1.2rem", color: partnerRating >= star ? "#22d3ee" : "#334155", fill: partnerRating >= star ? "#22d3ee" : "none" }} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder={`Crítica/resenha de ${partnerName.trim() || "Parceiro(a)"} (opcional)...`}
                    value={partnerReviewText}
                    onChange={(e) => setPartnerReviewText(e.target.value)}
                    style={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.75rem", color: "#fff", fontSize: "0.85rem", outline: "none", resize: "none" }}
                  />
                </div>
              )}

              <button onClick={handleSaveEvaluation} style={{ backgroundColor: "#db2777", color: "#fff", border: "none", borderRadius: "0.75rem", padding: "0.85rem", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem" }}>
                {editingMediaId ? "ATUALIZAR AVALIAÇÃO" : "ENVIAR AVALIAÇÃO"}
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
