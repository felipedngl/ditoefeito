"use client";

import React, { useState, useEffect } from "react";
import { Crown, Tv, Share2, X, Star, Film, User, Search, Plus, Trash2, Edit2, Check } from "lucide-react";

const PET_AVATARS = [
  // Cachorros (2)
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150",
  // Gatos (2)
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150",
  "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=150",
  // Cavalos (2)
  "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150",
  "https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=150",
  // Lontras (2)
  "https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=150",
  "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=150",
  // Passarinhos (2)
  "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=150",
  "https://images.unsplash.com/photo-1522836924256-6062b95cf989?w=150",
  // Coelhinhos (2)
  "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=150",
  "https://images.unsplash.com/photo-1535268647177-201be8c7589f?w=150"
];

export default function Page() {
  const [activeView, setActiveView] = useState("catalogo");
  const [selectedMode, setSelectedMode] = useState("solo");
  const [userName, setUserName] = useState("Dissa");
  const [userAvatar, setUserAvatar] = useState(PET_AVATARS[0]);
  const [partnerName, setPartnerName] = useState("Parceiro(a)");
  const [currentUser, setCurrentUser] = useState("user1");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [editingMediaId, setEditingMediaId] = useState(null);

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [partnerRating, setPartnerRating] = useState(5);
  const [partnerReviewText, setPartnerReviewText] = useState("");

  const [mediaList, setMediaList] = useState([]);

  // Simulação de busca na TMDB
  useEffect(() => {
    if (searchTerm.trim().length > 2) {
      fetch(`https://api.themoviedb.org/3/search/multi?api_key=3d886d38e244837a4e69b00cb3e2365e&language=pt-BR&query=${encodeURIComponent(searchTerm)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.results) {
            setSearchResults(data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv'));
          }
        })
        .catch((err) => console.error("Erro ao buscar:", err));
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const handleStarClick = (star, currentVal, setter) => {
    setter(star);
  };

  const handleSaveEvaluation = () => {
    if (!selectedMedia) return;

    const mediaId = selectedMedia.id;
    const mediaType = selectedMedia.media_type || (selectedMedia.title ? "movie" : "tv");
    const title = selectedMedia.title || selectedMedia.name;
    const poster_path = selectedMedia.poster_path;
    const overview = selectedMedia.overview;
    const vote_average = selectedMedia.vote_average;

    const newRatings = {
      user1: rating,
      ...(selectedMode !== "solo" ? { user2: partnerRating } : {})
    };

    const newReviews = [
      { author: currentUser, text: reviewText },
      ...(selectedMode !== "solo" && partnerReviewText ? [{ author: "user2", text: partnerReviewText }] : [])
    ].filter(r => r.text);

    const ratingsValues = Object.values(newRatings);
    const averageRating = (ratingsValues.reduce((a, b) => a + b, 0) / ratingsValues.length).toFixed(1);

    const existingIndex = mediaList.findIndex((m) => m.id === mediaId);

    if (existingIndex >= 0) {
      const updated = [...mediaList];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ratings: newRatings,
        reviews: newReviews,
        averageRating
      };
      setMediaList(updated);
    } else {
      const newItem = {
        id: mediaId,
        mediaType,
        title,
        poster_path,
        overview,
        vote_average,
        ratings: newRatings,
        reviews: newReviews,
        averageRating
      };
      setMediaList([newItem, ...mediaList]);
    }

    setSelectedMedia(null);
    setRating(5);
    setReviewText("");
    setPartnerRating(5);
    setPartnerReviewText("");
    setEditingMediaId(null);
  };

  const handleDeleteItem = (id) => {
    setMediaList(mediaList.filter(item => item.id !== id));
  };

  const handleOpenEdit = (item) => {
    setSelectedMedia(item);
    setRating(item.ratings?.user1 || 5);
    setPartnerRating(item.ratings?.user2 || 5);
    const myRev = item.reviews?.find(r => r.author === currentUser)?.text || "";
    const partnerRev = item.reviews?.find(r => r.author === "user2")?.text || "";
    setReviewText(myRev);
    setPartnerReviewText(partnerRev);
    setEditingMediaId(item.id);
  };

  const handleShareProfileLink = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    alert("Link do perfil copiado para a área de transferência!");
  };

  const moviesList = mediaList.filter(m => m.mediaType === "movie").sort((a, b) => b.averageRating - a.averageRating);
  const seriesList = mediaList.filter(m => m.mediaType === "tv").sort((a, b) => b.averageRating - a.averageRating);
  const userPersonalEvaluations = mediaList.filter(m => m.ratings[currentUser]);

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#020617", color: "#f8fafc", fontFamily: "sans-serif", padding: "1.5rem" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Cabeçalho */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(15, 23, 42, 0.8)", padding: "1rem", borderRadius: "1rem", border: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img src={userAvatar} alt="Avatar" style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover", border: "2px solid #ec4899" }} />
            <div>
              <h2 style={{ fontSize: "1rem", margin: 0, color: "#fff" }}>{userName}</h2>
              <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Modo: {selectedMode.toUpperCase()}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => setActiveView("catalogo")} style={{ backgroundColor: activeView === "catalogo" ? "#06b6d4" : "#1e293b", color: "#fff", border: "none", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>Catálogo</button>
            <button onClick={() => setActiveView("podio")} style={{ backgroundColor: activeView === "podio" ? "#06b6d4" : "#1e293b", color: "#fff", border: "none", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>Pódio</button>
            <button onClick={() => setActiveView("perfil")} style={{ backgroundColor: activeView === "perfil" ? "#06b6d4" : "#1e293b", color: "#fff", border: "none", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>Perfil</button>
          </div>
        </div>

        {/* Seletor de Modo na Tela Inicial */}
        <div style={{ display: "flex", gap: "0.5rem", backgroundColor: "#0f172a", padding: "0.5rem", borderRadius: "0.75rem", border: "1px solid #1e293b" }}>
          {["solo", "duo", "grupo"].map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              style={{
                flex: 1,
                backgroundColor: selectedMode === mode ? "#ec4899" : "transparent",
                color: selectedMode === mode ? "#fff" : "#94a3b8",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.5rem",
                fontWeight: "bold",
                fontSize: "0.8rem",
                cursor: "pointer",
                textTransform: "uppercase"
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Conteúdo Dinâmico */}
        {activeView === "catalogo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Busque por filmes ou séries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.75rem 1rem 0.75rem 2.5rem", color: "#fff", outline: "none", fontSize: "0.9rem", boxSizing: "border-box" }}
              />
              <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "1.2rem", height: "1.2rem", color: "#64748b" }} />
            </div>

            {searchResults.length > 0 && (
              <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "0.75rem", maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                {searchResults.map((item) => (
                  <div key={item.id} onClick={() => { setSelectedMedia(item); setSearchResults([]); setSearchTerm(""); }} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 1rem", cursor: "pointer", borderBottom: "1px solid #1e293b" }}>
                    <img src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "https://via.placeholder.com/45x65"} alt="" style={{ width: "35px", height: "50px", borderRadius: "0.3rem", objectFit: "cover" }} />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.85rem", color: "#fff", fontWeight: "bold" }}>{item.title || item.name}</span>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || "N/A"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#22d3ee", margin: 0 }}>Meus Registros ({mediaList.length})</h3>
              {mediaList.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Nenhum filme ou série adicionado ainda. Use a busca acima!</p>
              ) : (
                mediaList.map((item) => (
                  <div key={item.id} style={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid #1e293b", borderRadius: "1rem", padding: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                    <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt="" style={{ width: "55px", height: "80px", borderRadius: "0.5rem", objectFit: "cover" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: "1rem", color: "#fff" }}>{item.title}</h4>
                      <span style={{ fontSize: "0.8rem", color: "#eab308", fontWeight: "bold" }}>Média: {item.averageRating} ★</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => handleOpenEdit(item)} style={{ background: "none", border: "none", color: "#22d3ee", cursor: "pointer" }}><Edit2 style={{ width: "1rem", height: "1rem" }} /></button>
                      <button onClick={() => handleDeleteItem(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 style={{ width: "1rem", height: "1rem" }} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeView === "podio" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
              <h2 style={{ color: "#22d3ee", fontSize: "1.6rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Film style={{ width: "1.5rem", height: "1.5rem" }} /> Pódio de Filmes
              </h2>
              {moviesList.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Nenhum filme avaliado ainda.</p>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", justifyContent: "center", width: "100%", maxWidth: "550px" }}>
                  {moviesList[1] && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                      <div style={{ width: "80px", height: "120px", borderRadius: "0.75rem", overflow: "hidden", border: "2px solid #22d3ee" }}>
                        <img src={`https://image.tmdb.org/t/p/w500${moviesList[1].poster_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#22d3ee", fontWeight: "bold", marginTop: "0.4rem" }}>{moviesList[1].averageRating} ★</span>
                      <div style={{ width: "100%", height: "80px", backgroundColor: "rgba(6,182,212,0.2)", borderTop: "3px solid #22d3ee", borderRadius: "0.5rem 0.5rem 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "bold", color: "#22d3ee" }}>2</div>
                    </div>
                  )}
                  {moviesList[0] && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, marginTop: "-1.5rem" }}>
                      <Crown style={{ width: "2rem", height: "2rem", color: "#eab308", marginBottom: "0.2rem" }} />
                      <div style={{ width: "100px", height: "150px", borderRadius: "0.75rem", overflow: "hidden", border: "3px solid #eab308", boxShadow: "0 0 20px rgba(234,179,8,0.4)" }}>
                        <img src={`https://image.tmdb.org/t/p/w500${moviesList[0].poster_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <span style={{ fontSize: "0.9rem", color: "#eab308", fontWeight: "bold", marginTop: "0.4rem" }}>{moviesList[0].averageRating} ★</span>
                      <div style={{ width: "100%", height: "110px", backgroundColor: "rgba(234,179,8,0.25)", borderTop: "4px solid #eab308", borderRadius: "0.5rem 0.5rem 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold", color: "#eab308" }}>1</div>
                    </div>
                  )}
                  {moviesList[2] && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                      <div style={{ width: "80px", height: "120px", borderRadius: "0.75rem", overflow: "hidden", border: "2px solid #ec4899" }}>
                        <img src={`https://image.tmdb.org/t/p/w500${moviesList[2].poster_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#ec4899", fontWeight: "bold", marginTop: "0.4rem" }}>{moviesList[2].averageRating} ★</span>
                      <div style={{ width: "100%", height: "60px", backgroundColor: "rgba(236,72,153,0.2)", borderTop: "3px solid #ec4899", borderRadius: "0.5rem 0.5rem 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "bold", color: "#ec4899" }}>3</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", borderTop: "1px solid #1e293b", paddingTop: "2rem" }}>
              <h2 style={{ color: "#22d3ee", fontSize: "1.6rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Tv style={{ width: "1.5rem", height: "1.5rem" }} /> Pódio de Séries
              </h2>
              {seriesList.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Nenhuma série avaliada ainda.</p>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", justifyContent: "center", width: "100%", maxWidth: "550px" }}>
                  {seriesList[1] && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                      <div style={{ width: "80px", height: "120px", borderRadius: "0.75rem", overflow: "hidden", border: "2px solid #22d3ee" }}>
                        <img src={`https://image.tmdb.org/t/p/w500${seriesList[1].poster_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#22d3ee", fontWeight: "bold", marginTop: "0.4rem" }}>{seriesList[1].averageRating} ★</span>
                      <div style={{ width: "100%", height: "80px", backgroundColor: "rgba(6,182,212,0.2)", borderTop: "3px solid #22d3ee", borderRadius: "0.5rem 0.5rem 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "bold", color: "#22d3ee" }}>2</div>
                    </div>
                  )}
                  {seriesList[0] && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, marginTop: "-1.5rem" }}>
                      <Crown style={{ width: "2rem", height: "2rem", color: "#eab308", marginBottom: "0.2rem" }} />
                      <div style={{ width: "100px", height: "150px", borderRadius: "0.75rem", overflow: "hidden", border: "3px solid #eab308", boxShadow: "0 0 20px rgba(234,179,8,0.4)" }}>
                        <img src={`https://image.tmdb.org/t/p/w500${seriesList[0].poster_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <span style={{ fontSize: "0.9rem", color: "#eab308", fontWeight: "bold", marginTop: "0.4rem" }}>{seriesList[0].averageRating} ★</span>
                      <div style={{ width: "100%", height: "110px", backgroundColor: "rgba(234,179,8,0.25)", borderTop: "4px solid #eab308", borderRadius: "0.5rem 0.5rem 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold", color: "#eab308" }}>1</div>
                    </div>
                  )}
                  {seriesList[2] && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                      <div style={{ width: "80px", height: "120px", borderRadius: "0.75rem", overflow: "hidden", border: "2px solid #ec4899" }}>
                        <img src={`https://image.tmdb.org/t/p/w500${seriesList[2].poster_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#ec4899", fontWeight: "bold", marginTop: "0.4rem" }}>{seriesList[2].averageRating} ★</span>
                      <div style={{ width: "100%", height: "60px", backgroundColor: "rgba(236,72,153,0.2)", borderTop: "3px solid #ec4899", borderRadius: "0.5rem 0.5rem 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "bold", color: "#ec4899" }}>3</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "perfil" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(236,72,153,0.4)", borderRadius: "1.5rem", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", textAlign: "center" }}>
              <img src={userAvatar} alt="Avatar Pet" style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", border: "3px solid #ec4899", boxShadow: "0 0 15px rgba(236,72,153,0.4)" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", maxWidth: "300px" }}>
                <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "bold" }}>Seu Nome / Apelido:</label>
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} style={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.6rem", color: "#fff", textAlign: "center", fontWeight: "bold", outline: "none" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
                <span style={{ fontSize: "0.8rem", color: "#22d3ee", fontWeight: "bold" }}>Escolha seu Avatar de Bichinho:</span>
                <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  {PET_AVATARS.map((url, i) => (
                    <img key={i} src={url} alt="Pet Preset" onClick={() => setUserAvatar(url)} style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover", cursor: "pointer", border: userAvatar === url ? "3px solid #22d3ee" : "2px solid transparent" }} />
                  ))}
                </div>
              </div>

              <button onClick={handleShareProfileLink} style={{ backgroundColor: "#06b6d4", color: "#020617", border: "none", borderRadius: "0.75rem", padding: "0.75rem 1.5rem", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                <Share2 style={{ width: "1rem", height: "1rem" }} /> Compartilhar Link do Meu Perfil
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3 style={{ color: "#22d3ee", margin: 0, fontSize: "1.2rem" }}>Minhas Avaliações Pessoais ({userName})</h3>
              {userPersonalEvaluations.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Você ainda não avaliou nenhum título individualmente.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {userPersonalEvaluations.map((item) => {
                    const myRating = item.ratings[currentUser];
                    const myReview = item.reviews.find((r) => r.author === currentUser)?.text;
                    return (
                      <div key={item.id} style={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid #1e293b", padding: "1rem", borderRadius: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                        <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt="" style={{ width: "55px", height: "80px", borderRadius: "0.5rem", objectFit: "cover" }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: "1rem", color: "#fff" }}>{item.title}</h4>
                          <span style={{ fontSize: "0.8rem", color: "#ec4899", fontWeight: "bold" }}>Sua Nota: {myRating} ★</span>
                          {myReview && <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic" }}>"{myReview}"</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Avaliação */}
        {selectedMedia && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2,6,23,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 100 }}>
            <div style={{ backgroundColor: "#0f172a", border: "1px solid rgba(236,72,153,0.5)", borderRadius: "1.5rem", padding: "1.5rem", maxWidth: "520px", width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative", boxSizing: "border-box" }}>
              
              <button onClick={() => setSelectedMedia(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                <X style={{ width: "1.25rem", height: "1.25rem" }} />
              </button>

              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <img src={`https://image.tmdb.org/t/p/w500${selectedMedia.poster_path}`} alt="" style={{ width: "90px", height: "135px", borderRadius: "0.6rem", objectFit: "cover" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#fff" }}>{selectedMedia.title || selectedMedia.name}</h3>
                  <span style={{ fontSize: "0.75rem", color: "#eab308", fontWeight: "bold" }}>TMDB: {selectedMedia.vote_average?.toFixed(1) || "N/A"} / 10 ★</span>
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{selectedMedia.overview || "Sem sinopse."}</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#ec4899", fontWeight: "bold" }}>Nota de {userName.trim() || "Usuário"}: {rating} / 10 ★</span>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button key={star} onClick={() => handleStarClick(star, rating, setRating)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <Star style={{ width: "1.2rem", height: "1.2rem", color: rating >= star ? "#ec4899" : "#334155", fill: rating >= star ? "#ec4899" : "none" }} />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Sua crítica/resenha (opcional)..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  style={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.75rem", color: "#fff", fontSize: "0.85rem", outline: "none", resize: "none" }}
                />
              </div>

              {(selectedMode === "duo" || selectedMode === "grupo") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px solid #1e293b", paddingTop: "0.75rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "#22d3ee", fontWeight: "bold" }}>Nota de {partnerName.trim() || "Parceiro(a)"}: {partnerRating} / 10 ★</span>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button key={star} onClick={() => handleStarClick(star, partnerRating, setPartnerRating)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <Star style={{ width: "1.2rem", height: "1.2rem", color: partnerRating >= star ? "#22d3ee" : "#334155", fill: partnerRating >= star ? "#22d3ee" : "none" }} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Crítica/resenha do parceiro..."
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

      </div>
    </main>
  );
}
