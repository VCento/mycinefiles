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
    readyTitle: "Tu Cinefile está listo",
    readyText: "Esto explica demasiado. Míralo completo o comparte el enlace.",
    readyCta: "Ver mi Cinefile",
    logout: "Cerrar sesión",
  },

  create: {
    // Step indicator across the whole creation flow. "Tu Cinefile" is the
    // Sprint-3 generate step — labeled but inert this sprint.
    progress: {
      label: (step: number, total: number) => `Paso ${step} de ${total}`,
      steps: ["Títulos", "Duelos", "Momentos", "Tu Cinefile"],
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
    // Shared step navigation.
    nav: {
      next: "Siguiente",
      back: "Volver",
      toDuels: "Siguiente: Duelos",
      toMoments: "Siguiente: Momentos",
      toTitles: "Volver a Títulos",
      backToDuels: "Volver a Duelos",
    },
    // Step 2 — quick A/B duels.
    duels: {
      title: "Duelos rápidos",
      subtitle:
        "Sin pensarlo mucho: ¿con cuál te quedas? No hay respuestas correctas, solo las tuyas.",
      saving: "Guardando…",
      loading: "Cargando tus respuestas…",
      loadError: "No pudimos cargar tus respuestas guardadas.",
      retry: "Reintentar",
      error: "No pudimos guardar ese duelo. Intenta de nuevo.",
      progress: (done: number, total: number) =>
        `${done} de ${total} respondidos`,
      allDone: "¡Listo! Respondiste todos. Sigamos con los momentos.",
      // prompt = the header of each duel; options = its two choices.
      items: {
        tension_vs_humor: {
          prompt: "En una buena historia prefiero…",
          options: { tension: "Tensión", humor: "Humor" },
        },
        happy_vs_impactful: {
          prompt: "El final que me gana es…",
          options: {
            final_feliz: "Final feliz",
            final_impactante: "Final impactante",
          },
        },
        realism_vs_fantasy: {
          prompt: "Me atrapa más…",
          options: { realismo: "Realismo", fantasia: "Fantasía" },
        },
        good_vs_complex: {
          prompt: "Quiero personajes…",
          options: {
            personajes_buenos: "Buenos",
            personajes_complejos: "Complejos",
          },
        },
        light_vs_intense: {
          prompt: "Hoy me pide el cuerpo…",
          options: { liviano: "Algo liviano", intenso: "Algo intenso" },
        },
        simple_vs_thinky: {
          prompt: "Prefiero una historia…",
          options: {
            historia_simple: "Simple",
            historia_pensar: "Que me haga pensar",
          },
        },
        warmth_vs_darkness: {
          prompt: "Me mueve más…",
          options: {
            calidez: "Calidez emocional",
            oscuridad_elegante: "Oscuridad elegante",
          },
        },
      } as Record<
        string,
        { prompt: string; options: Record<string, string> }
      >,
    },
    // Step 3 — mark the moments that hit.
    moments: {
      title: "Los momentos que te marcaron",
      subtitle:
        "De lo que te gustó, ¿qué escena se te quedó dentro? Elige una de la lista o escribe la tuya, y ponle una emoción.",
      empty: {
        title: "Aún no hay nada que marcar",
        text: "Primero reacciona con «Me gusta», «Me encanta» o «Me marcó» a algunos títulos. Esas son las escenas que vas a marcar aquí.",
        cta: "Volver a Títulos",
      },
      curatedPrompt: "Elige un momento",
      freeToggle: "Escribir el mío",
      freeLabel: "Tu momento",
      freePlaceholder: "La escena que se te quedó dentro, en una frase…",
      emotionPrompt: "¿Qué emoción te dejó?",
      save: "Guardar momento",
      saving: "Guardando…",
      saved: "Momento guardado",
      edit: "Editar",
      pickBoth: "Marca un momento y elige una emoción para guardar.",
      error: "No pudimos guardar ese momento. Intenta de nuevo.",
      generate: "Generar mi Cinefile",
      generateNote: "El último paso: deja que la IA lea todo esto.",
    },
    // Step 4 — generate the Cinefile (Sprint 3).
    generate: {
      title: "Tu Cinefile",
      subtitle:
        "Ya tenemos material. Ahora la IA lo lee todo — reacciones, duelos, momentos — y escribe quién eres cuando apagas la luz.",
      summary: (titles: number, duels: number, moments: number) =>
        `${titles === 1 ? "1 título" : `${titles} títulos`}, ${duels} ${duels === 1 ? "duelo" : "duelos"}, ${moments === 1 ? "1 momento" : `${moments} momentos`}`,
      button: "Generar mi Cinefile",
      regenerate: "Actualizar mi carta",
      regenerateNote:
        "Ya tienes un Cinefile. Generar de nuevo lo reemplaza con una lectura fresca de tu material.",
      // The fun loading ritual: rotating while the AI thinks.
      ritual: [
        "Analizando tus traumas cinematográficos…",
        "Detectando tu villano interior…",
        "Calculando tu tolerancia al drama…",
        "Buscando la escena que te dejó raro…",
        "Midiendo cuánta oscuridad aceptas un domingo…",
      ],
      guardTitle: "Nos falta un poco de material",
      guardPositives:
        "Reacciona positivamente («Me gusta», «Me encanta» o «Me marcó») a al menos 3 títulos.",
      guardRejections:
        "Marca al menos un título que NO sea para ti — el contraste también te define.",
      guardCta: "Volver a Títulos",
      failed:
        "No pudimos generar tu perfil ahora, tu avance está guardado. Intenta de nuevo en un momento.",
      rateLimited:
        "Generaste hace muy poco. Dale un respiro a la IA y vuelve a intentar en un rato.",
    },
    emotions: {
      adrenalina: "Adrenalina",
      angustia: "Angustia",
      motivacion: "Motivación",
      incomodidad: "Incomodidad",
      fascinacion: "Fascinación",
      tristeza: "Tristeza",
      euforia: "Euforia",
      rabia: "Rabia",
      nostalgia: "Nostalgia",
      ternura: "Ternura",
      paz: "Paz",
      vacio: "Vacío",
      esperanza: "Esperanza",
    } as Record<string, string>,
  },

  // The Cinefile itself: card labels + the 13 trait dimension labels.
  cinefile: {
    cardWordmark: "CINEFILES",
    cardTagline: "El perfil según lo que te marcó",
    traitsHeading: "Tus dimensiones",
    traitLabels: {
      intensidad_emocional: "Intensidad emocional",
      tolerancia_oscuridad: "Tolerancia a la oscuridad",
      humor: "Humor",
      romanticismo: "Romanticismo",
      fantasia: "Fantasía",
      realismo: "Realismo",
      complejidad_narrativa: "Complejidad narrativa",
      nostalgia: "Nostalgia",
      adrenalina: "Adrenalina",
      sensibilidad_estetica: "Sensibilidad estética",
      curiosidad_intelectual: "Curiosidad intelectual",
      calidez: "Calidez",
      apertura_incomodidad: "Apertura a lo incómodo",
    } as Record<string, string>,
  },

  // /me — the private full profile.
  me: {
    ready: "Tu Cinefile está listo. Esto explica demasiado.",
    copyLink: "Copiar enlace",
    copied: "Enlace copiado",
    update: "Actualizar mi Cinefile",
    sections: {
      deepSummary: "Tu lectura completa",
      formula: "Tu fórmula",
      strengths: "Fortalezas",
      blindSpots: "Puntos ciegos",
    },
    recs: {
      title: "Para ti",
      subtitle: "Lo que tu Cinefile pide a gritos.",
      match: (n: number) => `${n}% afinidad`,
      empty: "Aún no hay recomendaciones. Genera tu Cinefile para recibirlas.",
    },
    empty: {
      title: "Todavía no hay Cinefile",
      text: "Completa el recorrido — títulos, duelos, momentos — y genera tu perfil.",
      cta: "Crear mi Cinefile",
    },
  },

  // /p/[slug] — the public share page (card-level content only).
  publicProfile: {
    intro: (name: string) => `El Cinefile de ${name}`,
    copyLink: "Copiar enlace",
    copied: "Enlace copiado",
    cta: "Crear mi propio Cinefile",
    notFound: {
      title: "Este Cinefile no existe (todavía)",
      text: "El enlace puede estar mal escrito, o su dueño aún no lo generó.",
      cta: "Crear el mío",
    },
  },

  // /compare/[slugA]/[slugB] — public comparison page + /me entry form.
  compare: {
    // Entry form on /me.
    entry: {
      title: "Comparar",
      subtitle:
        "Pega el enlace del Cinefile de alguien (o su código) y mira qué tanto se parecen.",
      placeholder: "Enlace o código de un Cinefile…",
      submit: "Comparar",
      invalid:
        "Eso no parece un Cinefile. Pega el enlace completo o el código que va después de /p/.",
    },
    intro: "Dos Cinefiles, frente a frente",
    vs: "vs",
    scoreLabel: "de compatibilidad",
    // Verdict tiers by score range, DESCENDING by `min` (last one must be 0).
    // Warm tone, never a loser, never clinical.
    verdicts: [
      {
        min: 90,
        title: "Almas gemelas cinematográficas",
        text: "Ven las mismas películas y les duelen las mismas escenas. Esto se cuida.",
      },
      {
        min: 75,
        title: "Muy compatibles, con chispa",
        text: "Coinciden en lo importante y discuten en lo divertido. La mejor combinación para un sofá.",
      },
      {
        min: 60,
        title: "Química inesperada",
        text: "No parecen del mismo mundo, pero algo hace clic. Esas son las mejores historias.",
      },
      {
        min: 40,
        title: "Opuestos que se atraen",
        text: "Cada uno le abre al otro una puerta que solo no habría cruzado. Aprovechen.",
      },
      {
        min: 0,
        title: "De planetas distintos (y eso está bien)",
        text: "Sus universos casi no se tocan. Motivo perfecto para intercambiar recomendaciones.",
      },
    ],
    sections: {
      closest: "Donde más se parecen",
      farthest: "Donde chocan (con estilo)",
      titles: "Títulos que comparten",
      tags: "Sus estilos, lado a lado",
    },
    titlesEmpty:
      "Ningún título en común (todavía). Ahí hay una conversación pendiente.",
    tagsShared: "Los estilos que comparten se encienden.",
    // Same slug on both sides — a feature, not an error.
    self: {
      title: "Compararte contigo mismo da 100%. Obvio.",
      text: "Mejor pásale tu enlace a alguien y comparen de verdad.",
      cta: "Crear mi propio Cinefile",
    },
    copyLink: "Copiar enlace",
    copied: "Enlace copiado",
    cta: "Crear mi propio Cinefile",
    notFound: {
      title: "Esta comparación no existe (todavía)",
      text: "Alguno de los dos enlaces está mal escrito, o su dueño aún no generó su Cinefile.",
      cta: "Crear el mío",
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
