"use client";

import React, { useState } from "react";
import { Film, Tv, Users, User, Trophy, Search, Plus, Sparkles } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"solo" | "duo" | "podio">("solo");
  const [searchQuery, setSearchQuery] = useState("");
  const [roomCode, setRoomCode] = useState("");

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 py-8">
      {/* Cabeçalho 80s Disco */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b border-pink-500/30 pb-8 text-center md:text-left">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
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
        <nav className="flex bg-slate-950 p-2 rounded-2xl border border-pink-500/40 box-glow-pink gap-2">
          <button
            onClick={() => setActiveTab("solo")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-pixel transition-all ${
              activeTab === "solo"
                ? "bg-pink-600 text-white shadow-lg box-glow-pink"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" /> SOLO
          </button>
          <button
            onClick={() => setActiveTab("duo")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-pixel transition-all ${
              activeTab === "duo"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-lg box-glow-blue"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" /> DUO/GRUPO
          </button>
          <button
            onClick={() => setActiveTab("podio")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-pixel transition-all ${
              activeTab === "podio"
                ? "bg-yellow-400 text-slate-950 font-bold shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4" /> PÓDIO
          </button>
        </nav>
      </header>

      {/* Conteúdo do Modo Solo */}
      {activeTab === "solo" && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4 w-5 h-5 text-pink-400" />
              <input
                type="text"
                placeholder="Buscar filme ou série no TMDB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-pink-500/30 rounded-2xl pl-12 pr-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:box-glow-pink transition-all font-retro text-lg"
              />
            </div>
            <button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-pixel text-xs px-6 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 box-glow-pink">
              <Search className="w-4 h-4" /> BUSCAR
            </button>
          </div>

          <div className="bg-slate-950/60 box-glow-blue rounded-3xl p-10 text-center space-y-3 border border-cyan-500/30">
            <Sparkles className="w-12 h-12 mx-auto text-cyan-400 animate-pulse" />
            <p className="text-cyan-300 font-retro text-2xl tracking-wider">
              PESQUISE UM TÍTULO PARA COMEÇAR A PONTUAR
            </p>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Digite o nome do filme ou série no campo acima para dar sua nota e opiniões.
            </p>
          </div>
        </section>
      )}

      {/* Conteúdo do Modo Duo / Grupo */}
      {activeTab === "duo" && (
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-950/80 box-Acontece nas melhores famílias! Quando o foco é deixar a solução redondinha de primeira, às vezes o código acaba dando uma esticada além da conta.

Se a ideia era ter algo mais **enxuto, modular ou resumido** para colar direto sem complicação, me avisa o que você prefere ajustar:

*   **Simplificar e cortar o "gordura":** Deixar só as regras essenciais para enxugar o tamanho.
*   **Dividir em partes/módulos:** Separar só o trecho específico da tela ou do componente que você precisa ajustar agora.
*   **Usar utilitários/Tailwind:** Se estiver usando algum framework CSS, posso converter para classes utilitárias para eliminar o arquivo CSS dedicado.

Como fica melhor para você continuar?
