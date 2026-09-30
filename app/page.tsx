"use client";

import React, { useState } from "react";
import { Search, User, Users, Trophy, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BACKGROUND_POSTERS = [
  "https://image.tmdb.org/t/p/w500/811P3306S2A9q33K35R31kX30.jpg",
  "https://image.tmdb.org/t/p/w500/dXp1o6A3r9Gf3p7p4W.jpg",
  "https://image.tmdb.org/t/p/w500/7WsyChLLEz33B3TeP3.jpg",
  "https://image.tmdb.org/t/p/w500/pB8BM72569u398492.jpg",
  "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEmt33P3.jpg",
  "https://image.tmdb.org/t/p/w500/f89U345928p12.jpg",
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"solo" | "duo" | "podio">("solo");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <main className="relative min-h-screen max-w-5xl mx-auto px-4 py-8 overflow-hidden">
      {/* Background Órbita 3D */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20 flex items-center justify-center overflow-hidden">
        <div className="relative w-[800px] h-[800px] animate-[spin_40s_linear_infinite] rounded-full border border-pink-500/20">
          {BACKGROUND_POSTERS.map((src, index) => {
            const angle = (index / BACKGROUND_POSTERS.length) * 360;
            return (
              <div
                key={index}
                className="absolute w-28 h-40 rounded-xl overflow-hidden shadow-2xl border border-cyan-400/40 box-glow-blue"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${angle}deg) translate(320px) rotate(-${angle}deg)`,
                }}
              >
                <img src={src} alt="Poster" className="w-full h-full object-cover" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="relative z-10">
        {/* Header com estilo retro */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b border-pink-500/30 pb-8 text-center md:text-left backdrop-blur-md bg-slate-950/50 p-6 rounded-3xl box-glow-pink">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
              <span className="text-2xl">🐱</span>
              <h1 className="text-2xl md:text-3xl font-pixel text-pink-500 text-glow-pink tracking-wider">
                DITO & FEITO
              </h1>
              <span className="text-2xl">🐴</span>
            </div>
            <p className="text-cyan-400 font-retro text-xl md:text-2xl tracking-widest text-glow-blue">
              ★ SESSÃO DISCO & AVALIAÇÕES RETRO ★
            </p>
          </div>

          {/* Navegação de Modos */}
          <nav className="flex bg-slate-950/90 p-2 rounded-2xl border border-pink-500/40 box-glow-pink gap-2">
            {[
              { id: "solo", label: "SOLO", icon: User, color: "pink" },
              { id: "duo", label: "DUO/GRUPO", icon: Users, color: "cyan" },
              { id: "podio", label: "PÓDIO", icon: Trophy, color: "yellow" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-pixel transition-all btn-neon-hover ${
                    isActive ? "text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className={`absolute inset-0 rounded-xl ${
                        tab.color === "pink"
                          ? "bg-pink-500 box-glow-pink"
                          : tab.color === "cyan"
                          ? "bg-cyan-400 box-glow-blue"
                          : "bg-yellow-400"
                      }`}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" /> {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </header>

        {/* Transição Suave do Conteúdo Principal (Design Motion) */}
        <AnimatePresence mode="wait">
          {activeTab === "solo" && (
            <motion.section
              key="solo"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-4 w-5 h-5 text-pink-400" />
                  <input
                    type="text"
                    placeholder="Buscar filme ou série no TMDB..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950/90 border border-pink-500/40 rounded-2xl pl-12 pr-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:box-glow-pink transition-all font-retro text-xl"
                  />
                </div>
                <button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-pixel text-xs px-6 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 box-glow-pink btn-neon-hover">
                  <Search className="w-4 h-4" /> BUSCAR
                </button>
              </div>

              <div className="bg-slate-950/80 backdrop-blur-md box-glow-blue rounded-3xl p-10 text-center space-y-3 border border-cyan-500/30">
                <Sparkles className="w-12 h-12 mx-auto text-cyan-400 animate-pulse" />
                <p className="text-cyan-300 font-retro text-2xl tracking-wider">
                  PESQUISE UM TÍTULO PARA COMEÇAR A PONTUAR
                </p>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Digite o nome do filme no campo acima para dar notas e opiniões.
                </p>
              </div>
            </motion.section>
          )}

          {activeTab === "duo" && (
            <motion.section
              key="duo"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <div className="bg-slate-950/80 backdrop-blur-md box-glow-pink p-6 rounded-3xl border border-pink-500/30 space-y-4">
                <h2 className="text-xl font-pixel text-pink-400">CRIAR SALA</h2>
                <p className="text-slate-400 text-sm">
                  Crie uma sala privada para votar em filmes com sua namorada ou amigos.
                </p>
                <button className="w-full bg-pink-600 hover:bg-pink-500 text-white font-pixel text-xs py-3.5 rounded-xl box-glow-pink transition-all btn-neon-hover">
                  GERAR CÓDIGO
                </button>
              </div>

              <div className="bg-slate-950/80 backdrop-blur-md box-glow-blue p-6 rounded-3xl border border-cyan-500/30 space-y-4">
                <h2 className="text-xl font-pixel text-cyan-400">ENTRAR EM SALA</h2>
                <p className="text-slate-400 text-sm">Digite o código gerado pela outra pessoa.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="EX: DISCO-80"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-center font-mono text-slate-100 uppercase focus:outline-none focus:border-cyan-500"
                  />
                  <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-pixel text-xs px-5 py-2.5 rounded-xl transition-all btn-neon-hover">
                    ENTRAR
                  </button>
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === "podio" && (
            <motion.section
              key="podio"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-slate-950/80 backdrop-blur-md box-glow-blue rounded-3xl p-10 text-center space-y-4 border border-cyan-500/30"
            >
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
              <h2 className="text-2xl font-pixel text-yellow-400">PÓDIO DA SESSÃO</h2>
              <p className="text-slate-400 font-retro text-xl max-w-md mx-auto">
                OS FILMES MAIS BEM AVALIADOS DA DUPLA/GRUPO APARECERÃO AQUI EM 1º, 2º E 3º LUGAR!
              </p>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
