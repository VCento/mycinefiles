/**
 * Centralized Spanish UI copy. Single source of truth for all user-facing text.
 * Safe to import from client and server components (no secrets).
 */
export const copy = {
  brand: {
    wordmark: "MyCinefiles",
    cardName: "tu Cinefile",
  },

  landing: {
    tagline:
      "Tu perfil según las películas, series y escenas que te marcaron.",
    howItWorksTitle: "Cómo funciona",
    steps: [
      {
        n: "1",
        title: "Elige lo que ves",
        text: "Busca películas, series y documentales que te importan.",
      },
      {
        n: "2",
        title: "Haz doble click en lo que te marcó",
        text: "Reacciona y marca las escenas que se te quedaron dentro.",
      },
      {
        n: "3",
        title: "Recibe tu perfil y compáralo",
        text: "Genera tu Cinefile y compáralo con quien quieras.",
      },
    ],
    ctaPrimary: "Crear mi Cinefile",
    ctaSecondary: "Ya tengo cuenta",
  },

  register: {
    title: "Crea tu Cinefile",
    subtitle: "Sin email. Sin spam. Solo guarda tu usuario y clave.",
    fields: {
      displayName: "Nombre visible",
      username: "Usuario",
      password: "Clave",
    },
    submit: "Crear mi Cinefile",
    haveAccount: "Ya tengo cuenta",
    recovery: {
      title: "Guarda tu código de recuperación",
      explanation:
        "Guarda este código. Como no usamos email, es la única forma de recuperar tu cuenta.",
      confirm: "Ya lo guardé",
      copied: "Copiado",
      copy: "Copiar código",
    },
  },

  login: {
    title: "Entra a tu Cinefile",
    subtitle: "Usa el usuario y la clave que creaste.",
    fields: {
      username: "Usuario",
      password: "Clave",
    },
    submit: "Entrar",
    noAccount: "Crear mi Cinefile",
  },

  app: {
    greeting: (name: string) => `Hola, ${name}`,
    emptyTitle: "Tu Cinefile está en blanco",
    emptyText:
      "Todavía no marcaste nada. Pronto vas a poder buscar títulos y empezar a construir tu perfil.",
    logout: "Cerrar sesión",
  },

  errors: {
    generic: "Algo salió mal. Intenta de nuevo.",
    invalidCredentials: "Usuario o clave incorrectos.",
    usernameTaken: "Ese usuario ya está en uso.",
    rateLimited: "Demasiados intentos. Espera un momento e intenta de nuevo.",
    validation: "Revisa los datos e intenta de nuevo.",
  },
} as const;
