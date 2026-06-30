import { z } from "zod";

/**
 * Input validation schemas. `.strict()` rejects unknown fields so callers can't
 * smuggle extra data into a server action.
 */

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "El nombre visible es muy corto.")
      .max(40, "El nombre visible es muy largo."),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "El usuario debe tener al menos 3 caracteres.")
      .max(24, "El usuario es muy largo.")
      .regex(
        /^[a-z0-9_]+$/,
        "Solo letras minúsculas, números y guion bajo.",
      ),
    password: z
      .string()
      .min(8, "La clave debe tener al menos 8 caracteres.")
      .max(72, "La clave es muy larga."), // bcrypt truncates beyond 72 bytes
  })
  .strict();

export const loginSchema = z
  .object({
    username: z.string().trim().toLowerCase().min(1).max(24),
    password: z.string().min(1).max(72),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
