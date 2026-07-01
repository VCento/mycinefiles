import type { MediaType } from "@/lib/titles/constants";
import type { TitleSearchResult } from "@/lib/titles/types";

/**
 * Curated MOCK title catalogue for Sprint 2A. No external API (TMDb) is called
 * this sprint — search merges these with any matching local `titles` rows.
 *
 * Each entry carries a stable `tmdbId` of the form `mock_<slug>` and
 * `source = "mock"`, so the EXISTING `unique(tmdb_id, media_type)` constraint
 * dedupes them naturally on insert. `posterPath` is null on purpose — the UI
 * renders a clean placeholder.
 */

/** Accent-insensitive, URL-safe slug used to build a stable mock id. */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface MockSeed {
  displayTitle: string;
  originalTitle?: string;
  mediaType: MediaType;
  releaseYear: number;
  overview: string;
  genres: string[];
}

const SEEDS: readonly MockSeed[] = [
  // Movies
  {
    displayTitle: "Whiplash",
    mediaType: "movie",
    releaseYear: 2014,
    overview: "Un baterista y un mentor brutal llevan la obsesión al límite.",
    genres: ["Drama", "Música"],
  },
  {
    displayTitle: "Her",
    mediaType: "movie",
    releaseYear: 2013,
    overview: "Un hombre solitario se enamora de una inteligencia artificial.",
    genres: ["Drama", "Romance", "Ciencia ficción"],
  },
  {
    displayTitle: "Parásitos",
    originalTitle: "기생충",
    mediaType: "movie",
    releaseYear: 2019,
    overview: "Una familia pobre se infiltra en la vida de una familia rica.",
    genres: ["Drama", "Thriller"],
  },
  {
    displayTitle: "La red social",
    originalTitle: "The Social Network",
    mediaType: "movie",
    releaseYear: 2010,
    overview: "El nacimiento de Facebook, entre ambición y traición.",
    genres: ["Drama", "Biografía"],
  },
  {
    displayTitle: "Interestelar",
    originalTitle: "Interstellar",
    mediaType: "movie",
    releaseYear: 2014,
    overview: "Un padre cruza el espacio y el tiempo para salvar a su hija.",
    genres: ["Ciencia ficción", "Aventura", "Drama"],
  },
  {
    displayTitle: "Eterno resplandor de una mente sin recuerdos",
    originalTitle: "Eternal Sunshine of the Spotless Mind",
    mediaType: "movie",
    releaseYear: 2004,
    overview: "Dos amantes borran su relación de la memoria y la reviven.",
    genres: ["Romance", "Drama", "Ciencia ficción"],
  },
  {
    displayTitle: "El club de la pelea",
    originalTitle: "Fight Club",
    mediaType: "movie",
    releaseYear: 1999,
    overview: "Un oficinista insomne funda un club clandestino de pelea.",
    genres: ["Drama", "Thriller"],
  },
  {
    displayTitle: "El padrino",
    originalTitle: "The Godfather",
    mediaType: "movie",
    releaseYear: 1972,
    overview: "La saga de una familia de la mafia y su heredero reticente.",
    genres: ["Drama", "Crimen"],
  },
  {
    displayTitle: "Vidas pasadas",
    originalTitle: "Past Lives",
    mediaType: "movie",
    releaseYear: 2023,
    overview: "Dos amigos de la infancia se reencuentran décadas después.",
    genres: ["Romance", "Drama"],
  },
  {
    displayTitle: "La La Land",
    mediaType: "movie",
    releaseYear: 2016,
    overview: "Una actriz y un músico persiguen sus sueños en Los Ángeles.",
    genres: ["Romance", "Música", "Drama"],
  },

  // Series
  {
    displayTitle: "Breaking Bad",
    mediaType: "tv",
    releaseYear: 2008,
    overview: "Un profesor de química se convierte en capo de la metanfetamina.",
    genres: ["Drama", "Crimen", "Thriller"],
  },
  {
    displayTitle: "Succession",
    mediaType: "tv",
    releaseYear: 2018,
    overview: "Una familia multimillonaria se devora por el control del imperio.",
    genres: ["Drama"],
  },
  {
    displayTitle: "The Bear",
    mediaType: "tv",
    releaseYear: 2022,
    overview: "Un chef de alta cocina hereda el caótico local de su hermano.",
    genres: ["Drama", "Comedia"],
  },
  {
    displayTitle: "Friends",
    mediaType: "tv",
    releaseYear: 1994,
    overview: "Seis amigos navegan la vida y el amor en Nueva York.",
    genres: ["Comedia", "Romance"],
  },
  {
    displayTitle: "The Office",
    mediaType: "tv",
    releaseYear: 2005,
    overview: "El día a día absurdo de una oficina de papel en Scranton.",
    genres: ["Comedia"],
  },
  {
    displayTitle: "Dark",
    mediaType: "tv",
    releaseYear: 2017,
    overview: "Un pueblo alemán esconde viajes en el tiempo y secretos familiares.",
    genres: ["Ciencia ficción", "Thriller", "Misterio"],
  },
  {
    displayTitle: "Black Mirror",
    mediaType: "tv",
    releaseYear: 2011,
    overview: "Historias inquietantes sobre tecnología y su lado oscuro.",
    genres: ["Ciencia ficción", "Drama", "Antología"],
  },
  {
    displayTitle: "Better Call Saul",
    mediaType: "tv",
    releaseYear: 2015,
    overview: "El origen del abogado tramposo del universo de Breaking Bad.",
    genres: ["Drama", "Crimen"],
  },
  {
    displayTitle: "Game of Thrones",
    mediaType: "tv",
    releaseYear: 2011,
    overview: "Casas nobles luchan por el trono de los Siete Reinos.",
    genres: ["Fantasía", "Drama", "Aventura"],
  },
  {
    displayTitle: "Stranger Things",
    mediaType: "tv",
    releaseYear: 2016,
    overview: "Unos niños enfrentan fuerzas sobrenaturales en los años ochenta.",
    genres: ["Ciencia ficción", "Terror", "Drama"],
  },

  // Documentaries
  {
    displayTitle: "Free Solo",
    mediaType: "documentary",
    releaseYear: 2018,
    overview: "Un escalador asciende El Capitán sin cuerda ni protección.",
    genres: ["Documental", "Deporte"],
  },
  {
    displayTitle: "Senna",
    mediaType: "documentary",
    releaseYear: 2010,
    overview: "La vida y la muerte del legendario piloto Ayrton Senna.",
    genres: ["Documental", "Deporte", "Biografía"],
  },
  {
    displayTitle: "The Last Dance",
    mediaType: "documentary",
    releaseYear: 2020,
    overview: "El último año dorado de Michael Jordan y los Bulls.",
    genres: ["Documental", "Deporte"],
  },
  {
    displayTitle: "Jiro Dreams of Sushi",
    mediaType: "documentary",
    releaseYear: 2011,
    overview: "Un maestro del sushi persigue la perfección toda su vida.",
    genres: ["Documental", "Gastronomía"],
  },
  {
    displayTitle: "Man on Wire",
    mediaType: "documentary",
    releaseYear: 2008,
    overview: "Un equilibrista cruza entre las Torres Gemelas en 1974.",
    genres: ["Documental", "Biografía"],
  },

  // International / arthouse
  {
    displayTitle: "La gran belleza",
    originalTitle: "La grande bellezza",
    mediaType: "movie",
    releaseYear: 2013,
    overview: "Un escritor recorre la decadencia y belleza de Roma.",
    genres: ["Drama"],
  },
  {
    displayTitle: "Amélie",
    originalTitle: "Le Fabuleux Destin d'Amélie Poulain",
    mediaType: "movie",
    releaseYear: 2001,
    overview: "Una joven parisina decide cambiar en secreto la vida de los demás.",
    genres: ["Romance", "Comedia"],
  },
  {
    displayTitle: "Deseando amar",
    originalTitle: "花樣年華",
    mediaType: "movie",
    releaseYear: 2000,
    overview: "Dos vecinos contienen un amor imposible en el Hong Kong de los sesenta.",
    genres: ["Romance", "Drama"],
  },
  {
    displayTitle: "Roma",
    mediaType: "movie",
    releaseYear: 2018,
    overview: "Una trabajadora doméstica sostiene a una familia en el México de los setenta.",
    genres: ["Drama"],
  },
  {
    displayTitle: "Oldboy",
    originalTitle: "올드보이",
    mediaType: "movie",
    releaseYear: 2003,
    overview: "Un hombre encerrado 15 años busca venganza al ser liberado.",
    genres: ["Thriller", "Drama", "Misterio"],
  },
  {
    displayTitle: "Yi Yi",
    originalTitle: "一一",
    mediaType: "movie",
    releaseYear: 2000,
    overview: "Tres generaciones de una familia taiwanesa frente a la vida.",
    genres: ["Drama"],
  },
  {
    displayTitle: "Stalker",
    originalTitle: "Сталкер",
    mediaType: "movie",
    releaseYear: 1979,
    overview: "Un guía conduce a dos hombres a una zona prohibida que cumple deseos.",
    genres: ["Ciencia ficción", "Drama"],
  },
  {
    displayTitle: "Persona",
    mediaType: "movie",
    releaseYear: 1966,
    overview: "Una actriz muda y su enfermera se funden en una misma identidad.",
    genres: ["Drama", "Thriller"],
  },
  {
    displayTitle: "La vida de los otros",
    originalTitle: "Das Leben der Anderen",
    mediaType: "movie",
    releaseYear: 2006,
    overview: "Un agente de la Stasi se obsesiona con la pareja que vigila.",
    genres: ["Drama", "Thriller"],
  },
  {
    displayTitle: "Ciudad de Dios",
    originalTitle: "Cidade de Deus",
    mediaType: "movie",
    releaseYear: 2002,
    overview: "Dos chicos toman caminos opuestos en una favela de Río.",
    genres: ["Crimen", "Drama"],
  },
];

export const MOCK_TITLES: readonly TitleSearchResult[] = SEEDS.map((seed) => ({
  tmdbId: `mock_${slugify(seed.displayTitle)}`,
  mediaType: seed.mediaType,
  displayTitle: seed.displayTitle,
  originalTitle: seed.originalTitle ?? null,
  releaseYear: seed.releaseYear,
  overview: seed.overview,
  genres: seed.genres,
  posterPath: null,
  source: "mock",
}));

/** Case/accent-insensitive substring match over display + original title. */
export function searchMockTitles(query: string): TitleSearchResult[] {
  const needle = slugify(query);
  if (!needle) return [];
  return MOCK_TITLES.filter((title) => {
    const haystack = slugify(
      `${title.displayTitle} ${title.originalTitle ?? ""}`,
    );
    return haystack.includes(needle);
  });
}
