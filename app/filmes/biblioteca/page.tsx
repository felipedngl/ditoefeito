"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
ArrowLeft,
BookOpen,
Film,
Library,
Star,
Trash2,
Trophy,
UserRound,
X,
} from "lucide-react";

import {
getUserProfile,
subscribeToAuth,
type UserProfile,
} from "@/lib/auth";

import {
deleteRating,
getUserRatings,
type SavedRating,
} from "@/lib/ratings";

export default function BibliotecaPage() {
const router = useRouter();

const [profile, setProfile] = useState<UserProfile | null>(null);
const [uid, setUid] = useState<string | null>(null);
const [ratings, setRatings] = useState<SavedRating[]>([]);
const [loading, setLoading] = useState(true);

const [deleteTarget, setDeleteTarget] =
useState<SavedRating | null>(null);

const [deletingKey, setDeletingKey] =
useState<string | null>(null);

const [deleteError, setDeleteError] =
useState("");

useEffect(() => {
const unsubscribe = subscribeToAuth(async (user) => {
if (!user) {
setUid(null);
setProfile(null);
setRatings([]);
setLoading(false);
return;
}

  setUid(user.uid);

  try {
    const userProfile = await getUserProfile(user.uid);
    setProfile(userProfile);

    const savedRatings = await getUserRatings(user.uid);

    setRatings(savedRatings);
  } catch (error) {
    console.error(
      "Erro ao carregar biblioteca:",
      error
    );
  } finally {
    setLoading(false);
  }
});

return unsubscribe;

}, []);

const movies = ratings.filter(
(item) => item.mediaType === "movie"
);

const tv = ratings.filter(
(item) => item.mediaType === "tv"
);

function editRating(item: SavedRating) {
router.push(
`/filmes?edit=${item.mediaType}_${item.mediaId}`
);
}

function openDeleteConfirmation(item: SavedRating) {
setDeleteError("");
setDeleteTarget(item);
}

function closeDeleteConfirmation() {
if (deletingKey) return;

setDeleteTarget(null);
setDeleteError("");
}

async function handleDelete() {
if (!uid || !deleteTarget) return;

const key =
  `${deleteTarget.mediaType}_${deleteTarget.mediaId}`;

try {
  setDeletingKey(key);
  setDeleteError("");

  await deleteRating(
    uid,
    deleteTarget.mediaType,
    deleteTarget.mediaId
  );

  setRatings((current) =>
    current.filter(
      (item) =>
        !(
          item.mediaType === deleteTarget.mediaType &&
          item.mediaId === deleteTarget.mediaId
        )
    )
  );

  setDeleteTarget(null);
} catch (error) {
  console.error(
    "Erro ao excluir título:",
    error
  );

  setDeleteError(
    error instanceof Error
      ? error.message
      : "Não foi possível excluir este título."
  );
} finally {
  setDeletingKey(null);
}
}

if (loading) {
return ( <main className="retro-grid flex min-h-screen items-center justify-center"> <div className="font-pixel text-sm text-pink-400">
CARREGANDO BIBLIOTECA... </div> </main>
);
}

return ( <main className="retro-grid min-h-screen text-white"> <header className="border-b border-white/10 bg-[#070910]/90 backdrop-blur-xl"> <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-6">
<button
type="button"
onClick={() => router.push("/filmes")}
className="flex items-center gap-2 font-pixel text-[10px] text-slate-300 transition hover:text-white"
> <ArrowLeft size={16} />
CATÁLOGO </button>

      <div className="text-center">
        <div className="font-pixel text-[9px] text-pink-300">
          DITO & FEITO
        </div>

        <h1 className="mt-1 font-pixel text-lg text-white">
          BIBLIOTECA
        </h1>
      </div>

      <button
        type="button"
        onClick={() => router.push("/perfil")}
        className="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-white/[0.04]"
      >
        {profile?.avatar && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xl">
            {profile.avatar}
          </div>
        )}

        <div className="hidden text-left sm:block">
          <div className="font-pixel text-[9px] text-white">
            {profile?.username || "PERFIL"}
          </div>

          {profile?.usernameSlug && (
            <div className="font-retro text-sm text-slate-500">
              @{profile.usernameSlug}
            </div>
          )}
        </div>
      </button>
    </div>
  </header>

  <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
    <nav className="flex gap-2 overflow-x-auto py-5">
      <NavButton
        icon={<Film size={16} />}
        label="CATÁLOGO"
        onClick={() =>
          router.push("/filmes")
        }
      />

      <NavButton
        icon={<BookOpen size={16} />}
        label="BIBLIOTECA"
        active
        onClick={() =>
          router.push("/filmes/biblioteca")
        }
      />

      <NavButton
        icon={<Trophy size={16} />}
        label="PÓDIO"
        onClick={() =>
          router.push("/filmes/podio")
        }
      />

      <NavButton
        icon={<UserRound size={16} />}
        label="PERFIL"
        onClick={() =>
          router.push("/perfil")
        }
      />
    </nav>

    <div className="mt-5">
      <div className="mb-10 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
          <Library size={26} />
        </div>

        <div>
          <p className="font-pixel text-[9px] text-pink-300">
            SEU CINEMA
          </p>

          <h2 className="mt-1 font-pixel text-2xl text-white md:text-4xl">
            BIBLIOTECA
          </h2>

          <p className="mt-2 font-retro text-base text-slate-400">
            Todos os filmes e séries que você avaliou.
          </p>
        </div>
      </div>

      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-pixel text-[9px] text-cyan-300">
              FILMES
            </p>

            <h3 className="mt-1 font-pixel text-lg text-white">
              {movies.length}{" "}
              {movies.length === 1
                ? "TÍTULO"
                : "TÍTULOS"}
            </h3>
          </div>
        </div>

        {movies.length === 0 ? (
          <EmptyLibrary
            type="FILMES"
            onClick={() =>
              router.push("/filmes")
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {movies.map((item) => (
              <RatingCard
                key={`${item.mediaType}_${item.mediaId}`}
                item={item}
                onEdit={() =>
                  editRating(item)
                }
                onDelete={() =>
                  openDeleteConfirmation(item)
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-pixel text-[9px] text-pink-300">
              SÉRIES
            </p>

            <h3 className="mt-1 font-pixel text-lg text-white">
              {tv.length}{" "}
              {tv.length === 1
                ? "TÍTULO"
                : "TÍTULOS"}
            </h3>
          </div>
        </div>

        {tv.length === 0 ? (
          <EmptyLibrary
            type="SÉRIES"
            onClick={() =>
              router.push("/filmes")
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {tv.map((item) => (
              <RatingCard
                key={`${item.mediaType}_${item.mediaId}`}
                item={item}
                onEdit={() =>
                  editRating(item)
                }
                onDelete={() =>
                  openDeleteConfirmation(item)
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  </section>

  {deleteTarget && (
    <DeleteModal
      item={deleteTarget}
      deleting={
        deletingKey !== null
      }
      error={deleteError}
      onClose={
        closeDeleteConfirmation
      }
      onConfirm={handleDelete}
    />
  )}
</main>

);
}

function NavButton({
icon,
label,
active = false,
onClick,
}: {
icon: React.ReactNode;
label: string;
active?: boolean;
onClick: () => void;
}) {
return (
<button
type="button"
onClick={onClick}
className={[
"flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 font-pixel text-[9px] transition",
active
? "border-pink-400/40 bg-pink-500/10 text-pink-200"
: "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white",
].join(" ")}
>
{icon}
{label} </button>
);
}

function RatingCard({
item,
onEdit,
onDelete,
}: {
item: SavedRating;
onEdit: () => void;
onDelete: () => void;
}) {
return ( <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] transition hover:border-pink-400/30 hover:bg-white/[0.04]"> <button
     type="button"
     onClick={onEdit}
     className="block w-full text-left"
   > <div className="aspect-[2/3] overflow-hidden bg-[#101522]">
{item.posterPath ? (
<img
src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
alt={item.title}
className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
loading="lazy"
/>
) : ( <div className="flex h-full items-center justify-center p-4 text-center font-pixel text-[7px] text-slate-600">
SEM IMAGEM </div>
)} </div>

    <div className="p-4">
      <div className="font-pixel text-[7px] text-cyan-300">
        {item.mediaType === "movie"
          ? "FILME"
          : "SÉRIE"}
      </div>

      <h4 className="mt-1 line-clamp-2 font-retro text-base leading-tight text-white">
        {item.title}
      </h4>

      {item.year && (
        <p className="mt-1 font-retro text-xs text-slate-500">
          {item.year}
        </p>
      )}

      <div className="mt-3 flex items-center gap-1.5">
        <Star
          size={15}
          fill="currentColor"
          className="text-yellow-300"
        />

        <span className="font-pixel text-sm text-white">
          {item.rating.toFixed(1)}
        </span>
      </div>

      {item.review && (
        <p className="mt-3 line-clamp-3 font-retro text-xs italic leading-5 text-slate-500">
          “{item.review}”
        </p>
      )}
    </div>
  </button>

  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      onDelete();
    }}
    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/20 bg-black/70 text-red-300 opacity-0 backdrop-blur-md transition hover:border-red-300/50 hover:bg-red-500/20 hover:text-red-200 group-hover:opacity-100"
    aria-label={`Excluir ${item.title}`}
  >
    <Trash2 size={15} />
  </button>
</article>
);
}

function EmptyLibrary({
type,
onClick,
}: {
type: string;
onClick: () => void;
}) {
return ( <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center"> <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04]"> <Library
       size={24}
       className="text-cyan-400/50"
     /> </div>

  <p className="mt-4 font-pixel text-[9px] text-slate-400">
    NENHUM {type} AINDA
  </p>

  <p className="mx-auto mt-2 max-w-md font-retro text-sm leading-6 text-slate-600">
    Avalie alguns títulos no Catálogo e
    eles aparecerão aqui.
  </p>

  <button
    type="button"
    onClick={onClick}
    className="mt-5 rounded-xl border border-pink-400/20 bg-pink-500/10 px-5 py-3 font-pixel text-[9px] text-pink-300 transition hover:border-pink-300 hover:text-white"
  >
    IR PARA O CATÁLOGO
  </button>
</div>
);
}

function DeleteModal({
item,
deleting,
error,
onClose,
onConfirm,
}: {
item: SavedRating;
deleting: boolean;
error: string;
onClose: () => void;
onConfirm: () => void;
}) {
return ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"> <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-[#0d111b] p-6 shadow-2xl"> <div className="flex items-start justify-between gap-4"> <div> <p className="font-pixel text-[9px] text-red-300">
REMOVER DA BIBLIOTECA </p>

        <h3 className="mt-2 font-pixel text-base text-white">
          {item.title}
        </h3>
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={deleting}
        className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:border-white/20 hover:text-white disabled:opacity-40"
      >
        <X size={17} />
      </button>
    </div>

    <p className="mt-5 font-retro text-sm leading-6 text-slate-400">
      Isso vai apagar sua nota e sua crítica
      pessoal deste título.
    </p>

    <p className="mt-2 font-retro text-sm leading-6 text-slate-600">
      O título continua existindo no TMDB e
      não será removido de nenhuma sessão
      compartilhada.
    </p>

    {error && (
      <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 font-retro text-sm text-red-300">
        {error}
      </div>
    )}

    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        disabled={deleting}
        className="rounded-xl border border-white/10 px-5 py-3 font-pixel text-[9px] text-slate-300 transition hover:border-white/20 hover:text-white disabled:opacity-40"
      >
        CANCELAR
      </button>

      <button
        type="button"
        onClick={onConfirm}
        disabled={deleting}
        className="rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-3 font-pixel text-[9px] text-red-300 transition hover:border-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting
          ? "REMOVENDO..."
          : "REMOVER"}
      </button>
    </div>
  </div>
</div>
);
}
