"use client";

import React, { useState } from "react";
import { Film, Tv, Users, User, Trophy, Search, Plus, Star } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"solo" | "duo" | "grupo" | "podio">("solo");
  const [searchQuery, setSearchQuery] = useState("");
  const [roomCode, setRoomCode] = useState("");

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-pink-500/20 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400">
            DITO & FEITO
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Avalie filmes e séries em dupla ou em grupo
          </p>
        </div>

        {/* Seleção de Modos */}
        <nav className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 gap-1">
          <button
            onClick={() => setActiveTab("solo")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "solo"
                ? "bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" /> Solo
          </button>
          <button
            onClick={() => setActiveTab("duo")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "duo"
                ? "bg-gradient-to-r from-pink-600 to-cyan-500 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" /> Duo / Grupo
          </button>
          <button
            onClick={() => setActiveTab("podio")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "podio"
                ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4" /> Pódio
          </button>
        </nav>
      </header>

      {/* Conteúdo do Modo Solo */}
      {activeTab === "solo" && (
        <section className="space-y-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar filme ou série no TMDB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>
            <button className="bg-pink-600 hover:bg-pink-500 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center gap-2">
              <Search className="w-4 h-4" /> Buscar
            </button>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-400">
            <Film className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-lg">Digite o nome de um filme ou série acima para começar suas avaliações.</p>
          </div>
        </section>
      )}

      {/* Conteúdo do Modo Duo / Grupo */}
      {activeTab === "duo" && (
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-xl font-bold text-pink-400 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Criar Nova Sala
            </h2>
            <p className="text-slate-400 text-sm">
              Crie uma sala privada e compartilhe o código com seus amigos para avaliarem juntos.
            </p>
            <button className="w-full bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-bold py-3 rounded-xl transition-all">
              Gerar Código de Sala
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
              <Users className="w-5 h-5" /> Entrar em uma Sala
            </h2>
            <p className="text-slate-400 text-sm">
              Cole abaixo o código fornecido pelo criador da sala.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: DISCO-80"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center font-mono text-slate-100 uppercase focus:outline-none focus:border-cyan-500"
              />
              <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all">
                Entrar
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Conteúdo do Pódio */}
      {activeTab === "podio" && (
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-100">Pódio do Grupo</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Assim que as votações forem finalizadas na sala, os filmes e séries mais bem avaliados aparecerão aqui em 1º, 2º e 3º lugar.
          </p>
        </section>
      )}
    </main>
  );
}
