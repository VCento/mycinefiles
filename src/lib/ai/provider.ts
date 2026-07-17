import "server-only";

import { env } from "@/lib/env";
import { generateMockProfile } from "@/lib/ai/mock";
import { generateAnthropicProfile } from "@/lib/ai/anthropic";
import type {
  ProfileGenerationInput,
  ProfileGenerationOutput,
} from "@/lib/ai/types";

/**
 * Provider abstraction. Switches on AI_PROVIDER ('anthropic' | 'mock';
 * default mock). If 'anthropic' is requested but the key is missing, we fall
 * back to mock with a warning — the app must never crash for lack of AI keys.
 */

export interface AIProvider {
  name: "anthropic" | "mock";
  generateProfile(
    input: ProfileGenerationInput,
  ): Promise<ProfileGenerationOutput>;
}

const mockProvider: AIProvider = {
  name: "mock",
  generateProfile: generateMockProfile,
};

const anthropicProvider: AIProvider = {
  name: "anthropic",
  generateProfile: generateAnthropicProfile,
};

export function getAIProvider(): AIProvider {
  if (env.AI_PROVIDER === "anthropic") {
    if (!env.ANTHROPIC_API_KEY) {
      console.warn(
        "[ai/provider] AI_PROVIDER=anthropic pero falta ANTHROPIC_API_KEY — usando el provider mock.",
      );
      return mockProvider;
    }
    return anthropicProvider;
  }
  return mockProvider;
}
