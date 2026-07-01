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
      "Todavía no marcaste nada. Busca títulos que te importan y empieza a construir tu perfil.",
    emptyCta: "Empezar mi Cinefile",
    logout: "Cerrar sesión",
  },

  create: {
    // Step indicator across the whole creation flow (only step 1 ships in 2A).
    progress: {
      label: (step: number, total: number) => `Paso ${step} de ${total}`,
      steps: ["Títulos", "Momentos", "Tu Cinefile"],
    },
    intro: {
      title: "Empecemos por lo que viste",
      subtitle:
        "Busca películas, series y documentales que te importan. Reacciona y dinos por qué. Con eso vamos armando tu Cinefile.",
      cta: "Buscar títulos",
      back: "Volver",
    },
    search: {
      heading: "Busca un título",
      placeholder: "Una película, serie o documental…",
      idle: "Empieza a escribir para buscar títulos.",
      searching: "Buscando…",
      noResults: (q: string) => `No encontramos nada para «${q}».`,
      added: "Ya en tu lista",
      react: "Reaccionar",
      posterPlaceholder: "Sin póster",
      error: "No pudimos buscar ahora. Intenta de nuevo.",
    },
    mediaType: {
      movie: "Película",
      tv: "Serie",
      documentary: "Documental",
    } as Record<string, string>,
    reactions: {
      prompt: "¿Qué sentiste?",
      options: {
        me_gusta: "Me gusta",
        me_encanta: "Me encanta",
        me_marco: "Me marcó",
        no_es_para_mi: "No es para mí",
        la_odio: "La odié",
      } as Record<string, string>,
    },
    reasons: {
      prompt: "¿Por qué?",
      optionalNote: "Opcional, pero ayuda a afinar tu perfil.",
      options: {
        personajes: "Los personajes",
        historia: "La historia",
        tension: "La tensión",
        humor: "El humor",
        estetica: "La estética",
        musica: "La música",
        mundo: "El mundo",
        romance: "El romance",
        oscuridad: "La oscuridad",
        inteligencia: "La inteligencia",
        nostalgia: "La nostalgia",
        me_hizo_sentir: "Me hizo sentir algo",
        me_atrapo: "No sé, simplemente me atrapó.",
      } as Record<string, string>,
    },
    panel: {
      heading: (title: string) => `Tu reacción a ${title}`,
      save: "Guardar",
      saving: "Guardando…",
      cancel: "Cancelar",
      pickReaction: "Elige una reacción para guardar.",
    },
    selection: {
      title: "Tu selección",
      empty: "Todavía no agregaste nada. Busca un título arriba para empezar.",
      count: (n: number) => (n === 1 ? "1 título" : `${n} títulos`),
      reasonsLabel: "Por:",
      remove: "Quitar",
    },
  },

  errors: {
    generic: "Algo salió mal. Intenta de nuevo.",
    invalidCredentials: "Usuario o clave incorrectos.",
    usernameTaken: "Ese usuario ya está en uso.",
    rateLimited: "Demasiados intentos. Espera un momento e intenta de nuevo.",
    validation: "Revisa los datos e intenta de nuevo.",
  },
} as const;
