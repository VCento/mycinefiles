import "server-only";

import { TRAIT_KEYS } from "@/lib/ai/types";
import type {
  ProfileGenerationInput,
  ProfileGenerationOutput,
  TraitScores,
} from "@/lib/ai/types";
import { isPositiveReaction } from "@/lib/titles/constants";

/**
 * Mock provider output: realistic Spanish, deterministic-ish (seeded from the
 * user's actual material so demos feel personal and re-runs are stable for the
 * same input). Zero external calls, zero keys — dev/demo works offline.
 */

/** Tiny stable hash for seeding variant selection. */
function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const ARCHETYPES = [
  {
    archetype: "Cartógrafo de Emociones Fuertes",
    shareQuote:
      "No busco películas que me entretengan: busco las que me dejan pensando a las 2 a.m.",
    styleTags: ["Drama con nervio", "Tensión elegante", "Finales que duelen"],
  },
  {
    archetype: "Coleccionista de Silencios Incómodos",
    shareQuote:
      "Mi género favorito es esa escena que nadie más recuerda y yo no puedo olvidar.",
    styleTags: ["Comedia incómoda", "Intimismo afilado", "Silencios con carga"],
  },
  {
    archetype: "Arquitecta de Finales Abiertos",
    shareQuote:
      "Prefiero un final que me rompa un poco a uno que me deje igual que antes.",
    styleTags: ["Misterio emocional", "Drama de autor", "Ambigüedad elegante"],
  },
] as const;

/**
 * Duel choices nudge specific traits so the mock visibly reacts to what the
 * user answered (the demo feels alive, not canned).
 */
const DUEL_TRAIT_NUDGES: Record<string, Partial<Record<(typeof TRAIT_KEYS)[number], number>>> = {
  tension: { adrenalina: 18, intensidad_emocional: 10 },
  humor: { humor: 20, calidez: 8 },
  final_feliz: { calidez: 15, romanticismo: 8 },
  final_impactante: { intensidad_emocional: 16, tolerancia_oscuridad: 10 },
  realismo: { realismo: 20, curiosidad_intelectual: 6 },
  fantasia: { fantasia: 20, sensibilidad_estetica: 6 },
  personajes_buenos: { calidez: 12 },
  personajes_complejos: { complejidad_narrativa: 16, curiosidad_intelectual: 8 },
  liviano: { humor: 10, calidez: 6 },
  intenso: { intensidad_emocional: 14, adrenalina: 8 },
  historia_simple: { calidez: 6 },
  historia_pensar: { complejidad_narrativa: 14, curiosidad_intelectual: 12 },
  calidez: { calidez: 16, romanticismo: 8 },
  oscuridad_elegante: { tolerancia_oscuridad: 18, sensibilidad_estetica: 10 },
};

/** Reason tags nudge traits too (lighter touch than duels). */
const REASON_TRAIT_NUDGES: Record<string, Partial<Record<(typeof TRAIT_KEYS)[number], number>>> = {
  tension: { adrenalina: 6 },
  humor: { humor: 6 },
  estetica: { sensibilidad_estetica: 8 },
  musica: { sensibilidad_estetica: 5 },
  romance: { romanticismo: 8 },
  oscuridad: { tolerancia_oscuridad: 8 },
  inteligencia: { curiosidad_intelectual: 8 },
  nostalgia: { nostalgia: 8 },
  mundo: { fantasia: 5 },
  personajes: { complejidad_narrativa: 4, calidez: 3 },
  historia: { complejidad_narrativa: 4 },
  me_hizo_sentir: { intensidad_emocional: 6 },
};

function clampTrait(value: number): number {
  return Math.max(8, Math.min(94, Math.round(value)));
}

function buildTraits(input: ProfileGenerationInput): TraitScores {
  const base = Object.fromEntries(TRAIT_KEYS.map((k) => [k, 48])) as TraitScores;

  for (const duel of input.duels) {
    const nudges = DUEL_TRAIT_NUDGES[duel.selectedOption];
    if (!nudges) continue;
    for (const [key, delta] of Object.entries(nudges)) {
      base[key as keyof TraitScores] += delta ?? 0;
    }
  }
  for (const reaction of input.reactions) {
    for (const reason of reaction.reasons) {
      const nudges = REASON_TRAIT_NUDGES[reason];
      if (!nudges) continue;
      for (const [key, delta] of Object.entries(nudges)) {
        base[key as keyof TraitScores] += delta ?? 0;
      }
    }
  }

  // Slight deterministic spread so bars never look uniform.
  const seed = hashString(input.displayName);
  TRAIT_KEYS.forEach((key, i) => {
    base[key] = clampTrait(base[key] + ((seed >> i) % 9) - 4);
  });

  return base;
}

export async function generateMockProfile(
  input: ProfileGenerationInput,
): Promise<ProfileGenerationOutput> {
  const positives = input.reactions.filter((r) => isPositiveReaction(r.reaction));
  const firstLove = positives[0]?.title ?? "lo que ves";
  const seed = hashString(input.displayName + String(input.reactions.length));
  const variant = ARCHETYPES[seed % ARCHETYPES.length]!;

  return {
    archetype: variant.archetype,
    shortSummary: `Tus gustos muestran a alguien que no ve historias: las habita. Entre ${firstLove} y tus duelos se dibuja un patrón claro — buscas emoción con sustancia, y cuando algo te marca, te marca de verdad.`,
    deepSummary: `Hay un hilo conductor en tu material: no eliges títulos por lo que prometen, sino por lo que te dejan. Tus reacciones más fuertes se concentran en historias que combinan tensión emocional con personajes que no se dejan resumir en una frase. Los momentos que marcaste lo confirman: recuerdas escenas de quiebre, no de espectáculo.\n\nTus duelos dibujan a alguien que tolera bien la incomodidad narrativa: prefieres que una historia te exija a que te arrulle. Eso no significa que no disfrutes lo liviano — significa que hasta en lo liviano buscas una chispa de verdad. Y cuando la encuentras, la conviertes en referencia personal: tus títulos favoritos funcionan como un idioma privado con el que explicas el mundo.`,
    shareQuote: variant.shareQuote,
    styleTags: [...variant.styleTags],
    traits: buildTraits(input),
    formula: [
      "40% tensión con propósito",
      "25% personajes que duelen",
      "20% estética que se queda",
      "15% humor en el momento justo",
    ],
    strengths: [
      "Detectas la escena importante antes de que la historia la subraye.",
      "Le das segundas oportunidades a historias difíciles — y sueles tener razón.",
      "Tu memoria emocional de lo que ves es un archivo, no un álbum.",
    ],
    blindSpots: [
      "Cuando algo es demasiado feliz, sospechas. A veces era solo felicidad.",
      "Confundes «me aburrió» con «no era profundo». De vez en cuando era ambas.",
    ],
    recommendations: [
      {
        title: "The Leftovers",
        reason:
          "Duelo, misterio y personajes rotos que se reconstruyen: exactamente tu zona de impacto.",
        matchScore: 93,
        category: "Para dejarte pensando",
      },
      {
        title: "Aftersun",
        reason:
          "Una memoria que duele en silencio. De las que marcas y no le cuentas a nadie.",
        matchScore: 90,
        category: "Para un domingo introspectivo",
      },
      {
        title: "Fleabag",
        reason:
          "Humor afilado sobre heridas reales — la combinación que tus duelos piden a gritos.",
        matchScore: 88,
        category: "Risa con fondo",
      },
      {
        title: "Arrival",
        reason:
          "Ciencia ficción que en realidad es una carta de amor a la memoria. Tu tipo de truco.",
        matchScore: 86,
        category: "Cabeza y corazón",
      },
    ],
    probablyNotForYou: [
      "Comedias románticas de aeropuerto: demasiada resolución, muy poca herida.",
      "Franquicias de acción en piloto automático — tu atención cobra por hora.",
    ],
  };
}
