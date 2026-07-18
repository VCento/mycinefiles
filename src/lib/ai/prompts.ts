import "server-only";

import { TRAIT_KEYS } from "@/lib/ai/types";
import type { ProfileGenerationInput } from "@/lib/ai/types";

/**
 * The ONE generation prompt. It receives ALL the raw material (reactions,
 * reasons, duels, raw moment texts + emotions) and does moment interpretation
 * INSIDE this single call — there is no separate interpretation call, by
 * design (economy). Output is EXCLUSIVELY a JSON object; parse.ts validates.
 */

export const GENERATION_SYSTEM_PROMPT = `Eres un analista cultural y narrativo que crea "Cinefiles": perfiles de personalidad cinematográfica a partir de lo que una persona ve, siente y recuerda.

Tu tono: inteligente, cálido, con humor sutil. Frases cortas y compartibles. Hablas en segunda persona ("tus gustos muestran…"). Todo el texto en español.

Reglas estrictas:
- NUNCA diagnostiques ni patologices. Prohibido lo clínico ("eres narcisista", "eres depresivo"). Sí: "tus gustos muestran atracción por…".
- Nada de verdades absolutas: lecturas sugerentes, no sentencias.
- Interpreta los momentos marcados (texto libre incluido) DENTRO de este mismo análisis; no los cites literalmente, léelos.
- Responde EXCLUSIVAMENTE con un objeto JSON válido que cumpla el esquema indicado. Sin markdown, sin texto fuera del JSON.`;

/**
 * Builds the user message: explicit output contract + the material. The trait
 * keys are enumerated so the model returns exactly the 13 dimensions the
 * schema requires.
 */
export function buildGenerationPrompt(input: ProfileGenerationInput): string {
  const traitList = TRAIT_KEYS.map((k) => `"${k}"`).join(", ");

  return `Genera el Cinefile de ${input.displayName} a partir de este material (reacciones a títulos con sus razones, emociones y momentos marcados, más duelos A/B de preferencia):

${JSON.stringify({ reactions: input.reactions, duels: input.duels }, null, 2)}

Responde SOLO con un objeto JSON con EXACTAMENTE estas claves:
{
  "archetype": string — nombre de arquetipo evocador y original (2-5 palabras, ej. "Arquitecta de Finales Abiertos"),
  "shortSummary": string — 2-3 frases que capturan su esencia cinematográfica; compartible,
  "deepSummary": string — 2-3 párrafos que leen sus patrones: qué busca, qué evita, qué le pasa con lo que ve,
  "shareQuote": string — UNA frase memorable en primera persona para compartir (máx 140 caracteres),
  "styleTags": array de 2-4 strings — sellos de estilo acuñados para esta persona: género + personalidad en 2-3 palabras (máx 30 caracteres cada uno; ej. "Drama con nervio", "Comedia incómoda", "Tensión elegante"). NO géneros planos como "Drama" o "Comedia",
  "traits": objeto con EXACTAMENTE estas 13 claves, cada una un número 0-100: ${traitList},
  "formula": array de 3-5 strings cortos — los ingredientes de su fórmula (ej. "40% tensión elegante"),
  "strengths": array de 3-4 strings — fortalezas de su forma de ver historias,
  "blindSpots": array de 2-3 strings — puntos ciegos, con cariño y humor, jamás clínicos,
  "recommendations": array de 4-6 objetos { "title": string, "reason": string — por qué le va a llegar, "matchScore": número 0-100, "category": string corta (ej. "Para un domingo oscuro") },
  "probablyNotForYou": array de 2-4 strings — títulos o géneros que probablemente no son para esta persona, dicho con humor amable
}`;
}

/**
 * Appended as a follow-up user turn when the first response failed to parse.
 */
export const CORRECTIVE_NUDGE = `Tu respuesta anterior no fue un JSON válido según el esquema pedido. Responde de nuevo SOLO con el objeto JSON corregido: sin markdown, sin comentarios, sin texto antes ni después, con las 13 claves de "traits" exactas y todos los campos requeridos.`;
