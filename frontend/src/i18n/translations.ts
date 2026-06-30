// Omni Wake intelligence — EN/ES dictionary.
export type Lang = "en" | "es";

type Entry = { en: string; es: string };

export const STRINGS = {
  // Brand
  appName: { en: "Omni Wake intelligence", es: "Omni Wake intelligence" },
  appTagline: {
    en: "Secure AI Ingestion & Strategic Thought Blueprints",
    es: "Ingesta IA Segura y Planos Estratégicos del Pensamiento",
  },
  ownerLine: {
    en: "A Division of Brick Outdoor Living, Inc.",
    es: "Una división de Brick Outdoor Living, Inc.",
  },

  // Onboarding
  onbTag: { en: "● SECURE INGRESS", es: "● INGRESO SEGURO" },
  onbWelcome: { en: "Welcome, Operator.", es: "Bienvenido, Operador." },
  onbBody: {
    en: "Capture executive thoughts. Synthesise them into Strategic Blueprints. Hold them in Secure Custody.",
    es: "Captura pensamientos ejecutivos. Sintétizalos en Planos Estratégicos. Manténlos en Custodia Segura.",
  },
  onbFullName: { en: "Full Name", es: "Nombre Completo" },
  onbEmail: { en: "Enterprise Email", es: "Correo Empresarial" },
  onbProceed: { en: "AUTHORISE INGRESS", es: "AUTORIZAR INGRESO" },
  onbSkip: { en: "Continue as Tier-1 Operator", es: "Continuar como Operador Tier-1" },

  // Tabs
  tabCapture: { en: "Capture", es: "Capturar" },
  tabBlueprints: { en: "Blueprints", es: "Planos" },
  tabCustody: { en: "Custody", es: "Custodia" },
  tabSettings: { en: "Settings", es: "Ajustes" },

  // Capture
  captureTag: { en: "● THOUGHT CAPTURE", es: "● CAPTURA DE PENSAMIENTO" },
  captureTitle: { en: "Oracle AI Ingestion", es: "Ingesta IA Oracle" },
  captureSubtitle: {
    en: "Capture an executive thought. Optionally tag it. The Oracle will synthesise.",
    es: "Captura un pensamiento ejecutivo. Etíñuetalo opcional. El Oracle sintetizará.",
  },
  captureTitlePlaceholder: { en: "Thought title", es: "Título del pensamiento" },
  captureBodyPlaceholder: {
    en: "Type or paste the body of your thought...",
    es: "Escribe o pega el cuerpo de tu pensamiento...",
  },
  captureTagsPlaceholder: { en: "Tags (comma separated)", es: "Etiquetas (separadas por coma)" },
  captureModeText: { en: "TEXT", es: "TEXTO" },
  captureModeAudio: { en: "AUDIO", es: "AUDIO" },
  captureModeHybrid: { en: "HYBRID", es: "HÍBRIDO" },
  captureSubmit: { en: "INGEST", es: "INGERIR" },
  captureRecord: { en: "RECORD", es: "GRABAR" },
  captureStop: { en: "STOP", es: "DETENER" },
  captureRecHint: {
    en: "Native audio recording requires a device build. The preview captures duration only.",
    es: "La grabación nativa requiere una build de dispositivo. La vista previa sólo registra duración.",
  },
  captureSuccess: { en: "Ingested. Open the Blueprints tab to synthesise.", es: "Ingerido. Abre Planos para sintetizar." },

  // Blueprints
  bpTag: { en: "● STRATEGIC BLUEPRINTS", es: "● PLANOS ESTRATÉGICOS" },
  bpTitle: { en: "Blueprint Gallery", es: "Galería de Planos" },
  bpSub: {
    en: "Oracle-synthesised intelligence from your captured thoughts.",
    es: "Inteligencia sintetizada por Oracle desde tus pensamientos capturados.",
  },
  bpEmpty: { en: "No blueprints yet.", es: "Sin planos aún." },
  bpEmptyHint: {
    en: "Capture thoughts, then synthesise.",
    es: "Captura pensamientos y luego sintetiza.",
  },
  bpSynth: { en: "SYNTHESISE SELECTED", es: "SINTETIZAR SELECCIONADOS" },
  bpSynthHint: { en: "Select up to 12 thoughts.", es: "Selecciona hasta 12 pensamientos." },
  bpSynthInProgress: { en: "Oracle synthesising...", es: "Oracle sintetizando..." },
  bpThoughts: { en: "Recent Thoughts", es: "Pensamientos Recientes" },
  bpClassification: { en: "Classification", es: "Clasificación" },
  bpConfidence: { en: "Confidence", es: "Confianza" },
  bpActionItems: { en: "Action Items", es: "Acciones" },
  bpSummary: { en: "Executive Summary", es: "Resumen Ejecutivo" },
  bpPin: { en: "PIN", es: "FIJAR" },
  bpUnpin: { en: "UNPIN", es: "DESFIJAR" },
  bpDelete: { en: "DELETE", es: "BORRAR" },
  bpSources: { en: "Source Thoughts", es: "Pensamientos Fuente" },

  // Dreamcatcher / Engine selector
  dreamTag: { en: "● DREAMCATCHER • CAPTURING RAW INTENT", es: "● ATRAPASUEÑOS • CAPTURANDO INTENCIÓN" },
  dreamBody: {
    en: "Free-form thought dump. Text, voice, fragments — the kernel weaves it.",
    es: "Volcado libre. Texto, voz, fragmentos — el núcleo lo teje.",
  },
  modeDream: { en: "DREAMCATCHER", es: "ATRAPASUEÑOS" },
  enrichBtn: { en: "✨ ENRICH WITH SEARCH-GROUNDING", es: "✨ ENRIQUECER CON BÚSQUEDA" },
  enriching: { en: "Searching, grounding, distilling…", es: "Buscando, fundamentando, destilando…" },
  enrichSignals: { en: "Key Signals", es: "Señales Clave" },
  enrichQueries: { en: "Suggested Queries", es: "Consultas Sugeridas" },
  engineLabel: { en: "Synthesis Engine", es: "Motor de Síntesis" },
  engineOracle: { en: "ORACLE (CLAUDE)", es: "ORACLE (CLAUDE)" },
  engineGemini: { en: "GEMINI FLASH", es: "GEMINI FLASH" },
  engineDual: { en: "DUAL SYNTHESIS", es: "SÍNTESIS DUAL" },
  dualResult: { en: "Dual Synthesis Result", es: "Resultado Dual" },
  custodyTag: { en: "● SECURE DATA CUSTODY", es: "● CUSTODIA DE DATOS SEGURA" },
  custodyTitle: { en: "Operator Command", es: "Comando del Operador" },
  custodyClearance: { en: "Clearance", es: "Autorización" },
  custodyThoughts: { en: "Captured Thoughts", es: "Pensamientos Capturados" },
  custodyBlueprints: { en: "Synthesised Blueprints", es: "Planos Sintetizados" },
  custodyPinned: { en: "Pinned", es: "Fijados" },
  custodyClassification: { en: "Classification Mix", es: "Mezcla de Clasificación" },
  custodyActivity: { en: "Activity Log", es: "Registro de Actividad" },
  custodySecurity: { en: "Security Posture", es: "Postura de Seguridad" },

  // Settings
  settingsTag: { en: "● SETTINGS", es: "● AJUSTES" },
  settingsTitle: { en: "Operator Profile", es: "Perfil del Operador" },
  settingsLang: { en: "Language", es: "Idioma" },
  settingsBio: { en: "Biometric Lock", es: "Bloqueo Biométrico" },
  settingsBioHint: {
    en: "Require Face ID / fingerprint to unlock Secure Data Custody.",
    es: "Requiere Face ID / huella para desbloquear la Custodia de Datos.",
  },
  vaultKeyFp: { en: "Vault Key Fingerprint", es: "Huella Clave Bóveda" },
  vaultKeyFpHint: {
    en: "AES-256 key bound to this device's Secure Enclave.",
    es: "Clave AES-256 vinculada al Secure Enclave del dispositivo.",
  },
  signOut: { en: "END SESSION", es: "FIN DE SESIÓN" },

  // Kernel
  kernelTag: { en: "● EVOLUTIONARY KERNEL", es: "● NÚCLEO EVOLUTIVO" },
  kernelTitle: { en: "Self-Debugging Core", es: "Núcleo de Auto-Diagnóstico" },
  kernelSub: {
    en: "AI-triaged anomalies. Captured client + server crashes.",
    es: "Anomalías triadas por IA. Capturas de cliente + servidor.",
  },
  kernelOpen: { en: "Open Kernel Console", es: "Abrir Consola del Núcleo" },
  kernelEmpty: {
    en: "No anomalies on record. The kernel is watching.",
    es: "Sin anomalías registradas. El núcleo vigila.",
  },
  kernelResolve: { en: "Mark Resolved", es: "Marcar Resuelto" },
  kernelResolved: { en: "RESOLVED", es: "RESUELTO" },
  kernelOpenIssues: { en: "Open Anomalies", es: "Anomalías Abiertas" },
  kernelTotalIssues: { en: "Total Captured", es: "Total Capturado" },
  kernelAnalyzing: { en: "Analyzing with AI…", es: "Analizando con IA…" },
  kernelLLMDisabled: {
    en: "LLM key missing — traces captured without AI triage.",
    es: "Clave LLM ausente — trazas capturadas sin triaje IA.",
  },
  kernelRootCause: { en: "Root Cause", es: "Causa Raíz" },
  kernelSuggestedFix: { en: "Suggested Fix", es: "Solución Sugerida" },
  kernelSuspectFile: { en: "Suspected File", es: "Archivo Sospechoso" },
  kernelSeverity: { en: "Severity", es: "Severidad" },
  kernelConfidence: { en: "Confidence", es: "Confianza" },

  // Biometric gate
  vaultBioTag: { en: "CUSTODY • LOCKED", es: "CUSTODIA • BLOQUEADA" },
  vaultBioTitle: { en: "Secure Data Custody", es: "Custodia de Datos Segura" },
  vaultBioBody: {
    en: "Biometric authentication required.",
    es: "Se requiere autenticación biométrica.",
  },
  vaultBioMethod: { en: "Face ID / Fingerprint", es: "Face ID / Huella" },
  vaultBioUnlock: { en: "UNLOCK", es: "DESBLOQUEAR" },
  vaultBioPrompt: { en: "Unlock your Secure Data Custody", es: "Desbloquea tu Custodia" },
  vaultBioUnavailable: {
    en: "Biometrics unavailable on this device. Set up Face ID / fingerprint in system settings.",
    es: "Biometría no disponible. Configura Face ID / huella en ajustes.",
  },
  vaultBioWebFallback: {
    en: "Biometric lock is enabled but cannot be enforced on the web preview — it activates on the native build.",
    es: "El bloqueo biométrico está activo pero no se aplica en la vista web — se activa en la build nativa.",
  },
} as const;

type Key = keyof typeof STRINGS;

export function t(key: Key | string, lang: Lang): string {
  const entry = (STRINGS as Record<string, Entry>)[key as string];
  if (!entry) return String(key);
  return entry[lang] ?? entry.en;
}
