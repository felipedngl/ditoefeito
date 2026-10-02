import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type MediaType = "movie" | "tv";

function getYear(date?: string) {
  if (!date) return "";
  return date.slice(0, 4);
}

function normalizeMovie(item: any) {
  return {
    id: item.id,
    type: "movie" as const,
    title: item.title || item.original_title || "Sem título",
    originalTitle: item.original_title || "",
    overview: item.overview || "Sem descrição disponível.",
    posterPath: item.poster_path || null,
    backdropPath: item.backdrop_path || null,
    year: getYear(item.release_date),
    rating:
      typeof item.vote_average === "number"
        ? Number(item.vote_average.toFixed(1))
        : 0,
    voteCount: item.vote_count || 0,
    popularity: item.popularity || 0,
  };
}

function normalizeTv(item: any) {
  return {
    id: item.id,
    type: "tv" as const,
    title: item.name || item.original_name || "Sem título",
    originalTitle: item.original_name || "",
    overview: item.overview || "Sem descrição disponível.",
    posterPath: item.poster_path || null,
    backdropPath: item.backdrop_path || null,
    year: getYear(item.first_air_date),
    rating:
      typeof item.vote_average === "number"
        ? Number(item.vote_average.toFixed(1))
        : 0,
    voteCount: item.vote_count || 0,
    popularity: item.popularity || 0,
  };
}

async function tmdbFetch(
  endpoint: string,
  params: Record<string, string> = {}
) {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error("TMDB_API_KEY não configurada.");
  }

  const searchParams = new URLSearchParams({
    api_key: apiKey,
    language: "pt-BR",
    region: "BR",
    include_adult: "false",
    ...params,
  });

  const response = await fetch(
    `${TMDB_BASE_URL}${endpoint}?${searchParams.toString()}`,
    {
      headers: {
        accept: "application/json",
      },
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `TMDB respondeu ${response.status}: ${text}`
    );
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const action = searchParams.get("action") || "search";
    const type = searchParams.get("type") as MediaType | null;
    const query = searchParams.get("query")?.trim() || "";

    if (action === "search") {
      if (!type || !["movie", "tv"].includes(type)) {
        return NextResponse.json(
          {
            error: "Tipo inválido. Use movie ou tv.",
          },
          { status: 400 }
        );
      }

      if (!query) {
        return NextResponse.json({
          results: [],
        });
      }

      if (type === "movie") {
        const data = await tmdbFetch("/search/movie", {
          query,
          page: "1",
        });

        return NextResponse.json({
          results: (data.results || [])
            .slice(0, 12)
            .map(normalizeMovie),
        });
      }

      const data = await tmdbFetch("/search/tv", {
        query,
        page: "1",
      });

      return NextResponse.json({
        results: (data.results || [])
          .slice(0, 12)
          .map(normalizeTv),
      });
    }

    if (action === "popular") {
      const movieData = await tmdbFetch("/movie/popular", {
        page: "1",
      });

      const tvData = await tmdbFetch("/tv/popular", {
        page: "1",
      });

      return NextResponse.json({
        movies: (movieData.results || [])
          .slice(0, 12)
          .map(normalizeMovie),

        tv: (tvData.results || [])
          .slice(0, 12)
          .map(normalizeTv),
      });
    }

    return NextResponse.json(
      {
        error: "Ação inválida.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("TMDB API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao consultar o TMDB.",
      },
      { status: 500 }
    );
  }
}
