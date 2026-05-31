// English + Spanish translations for One Click Transcript
export type Lang = "en" | "es";

export const STRINGS = {
  // Global
  appName: { en: "One Click Transcript", es: "One Click Transcript" },
  tagline: {
    en: "Tactical academic credential vault",
    es: "Bóveda táctica de credenciales académicas",
  },
  legalFooter: {
    en: "A DIVISION OF BRICK OUTDOOR LIVING, INC.",
    es: "UNA DIVISIÓN DE BRICK OUTDOOR LIVING, INC.",
  },
  continue: { en: "Continue", es: "Continuar" },
  cancel: { en: "Cancel", es: "Cancelar" },
  back: { en: "Back", es: "Atrás" },
  confirm: { en: "Confirm", es: "Confirmar" },
  loading: { en: "Working…", es: "Procesando…" },
  done: { en: "Done", es: "Listo" },
  retry: { en: "Retry", es: "Reintentar" },
  copy: { en: "Copy", es: "Copiar" },
  copied: { en: "Copied", es: "Copiado" },
  delete: { en: "Delete", es: "Eliminar" },
  share: { en: "Share", es: "Compartir" },
  revoke: { en: "Revoke", es: "Revocar" },

  // Onboarding
  welcomeTitle: {
    en: "Verified Student. Secured Vault.",
    es: "Estudiante Verificado. Bóveda Segura.",
  },
  welcomeBody: {
    en: "Retrieve, encrypt, and share your transcripts with military-grade precision.",
    es: "Recupera, cifra y comparte tus expedientes con precisión de grado militar.",
  },
  verifyWithIdMe: { en: "Verify with ID.me", es: "Verificar con ID.me" },
  alreadyVerified: { en: "I'm already verified", es: "Ya estoy verificado" },
  whyVerify: {
    en: "ID.me verification powers the Verified Student watermark applied to every retrieved document.",
    es: "La verificación de ID.me activa la marca de agua de Estudiante Verificado aplicada a cada documento.",
  },

  // ID.me flow
  idMeTitle: { en: "ID.me Identity Bridge", es: "Puente de Identidad ID.me" },
  idMeSubtitle: {
    en: "Confirm the legal identity that will appear on your verified credentials.",
    es: "Confirma la identidad legal que aparecerá en tus credenciales verificadas.",
  },
  legalName: { en: "Legal Full Name", es: "Nombre Legal Completo" },
  studentEmail: { en: "Student Email", es: "Correo Estudiantil" },
  beginVerification: { en: "Begin Verification", es: "Iniciar Verificación" },
  verifying: { en: "Verifying identity…", es: "Verificando identidad…" },
  verifiedTitle: { en: "Identity Verified", es: "Identidad Verificada" },
  verifiedBody: {
    en: "Your Verified Student status is active. All future documents will bear the verified watermark.",
    es: "Tu estado de Estudiante Verificado está activo. Todos los documentos futuros llevarán la marca verificada.",
  },
  enterCommandCenter: {
    en: "Enter Command Center",
    es: "Entrar al Centro de Mando",
  },

  // Dashboard
  commandCenter: { en: "COMMAND CENTER", es: "CENTRO DE MANDO" },
  greetingMorning: { en: "Good morning", es: "Buenos días" },
  greetingAfternoon: { en: "Good afternoon", es: "Buenas tardes" },
  greetingEvening: { en: "Good evening", es: "Buenas noches" },
  verifiedStudent: { en: "VERIFIED STUDENT", es: "ESTUDIANTE VERIFICADO" },
  unverified: { en: "UNVERIFIED", es: "NO VERIFICADO" },
  retrieveTranscript: {
    en: "Retrieve Transcript",
    es: "Recuperar Expediente",
  },
  retrieveSub: {
    en: "Deploy AI liaison to your school portal",
    es: "Despliega el enlace IA a tu portal escolar",
  },
  vaultDocs: { en: "Vault Documents", es: "Documentos en Bóveda" },
  activeLinks: { en: "Active Links", es: "Enlaces Activos" },
  encryption: { en: "Encryption", es: "Cifrado" },
  quickActions: { en: "QUICK ACTIONS", es: "ACCIONES RÁPIDAS" },
  openVault: { en: "Open Vault", es: "Abrir Bóveda" },
  trustDashboard: { en: "Trust Dashboard", es: "Panel de Confianza" },

  // Agent flow
  selectPortal: { en: "Select School Portal", es: "Seleccionar Portal Escolar" },
  selectPortalSub: {
    en: "Choose your institution. The AI liaison will navigate the portal on your behalf.",
    es: "Elige tu institución. El enlace IA navegará el portal por ti.",
  },
  portalCreds: { en: "Portal Credentials", es: "Credenciales del Portal" },
  credsNotice: {
    en: "Credentials are submitted directly to the portal over an encrypted channel and never stored.",
    es: "Las credenciales se envían directamente al portal por canal cifrado y nunca se almacenan.",
  },
  username: { en: "Username / Student ID", es: "Usuario / ID Estudiantil" },
  password: { en: "Password", es: "Contraseña" },
  deployAgent: { en: "Deploy AI Liaison", es: "Desplegar Enlace IA" },
  mfaDuoTitle: { en: "Approve Duo Push", es: "Aprobar Push de Duo" },
  mfaDuoBody: {
    en: "A Duo push has been triggered. Approve it on your phone to allow the agent to continue.",
    es: "Se envió un push de Duo. Apruébalo en tu teléfono para que el agente continúe.",
  },
  mfaSmsTitle: { en: "Enter SMS Code", es: "Ingresar Código SMS" },
  mfaSmsBody: {
    en: "A 6-digit code was sent to your registered phone.",
    es: "Se envió un código de 6 dígitos a tu teléfono.",
  },
  mfaCode: { en: "MFA Code", es: "Código MFA" },
  iApproved: { en: "I approved on my device", es: "Aprobé en mi dispositivo" },
  submitCode: { en: "Submit Code", es: "Enviar Código" },
  agentWorking: { en: "Agent Working", es: "Agente Trabajando" },
  agentWorkingSub: {
    en: "Locating transcript page and downloading…",
    es: "Localizando expediente y descargando…",
  },
  retrievalComplete: { en: "Retrieval Complete", es: "Recuperación Completa" },
  documentVaulted: {
    en: "Document encrypted and stored in vault.",
    es: "Documento cifrado y almacenado en la bóveda.",
  },
  viewDocument: { en: "View Document", es: "Ver Documento" },
  returnToCenter: { en: "Return to Command Center", es: "Volver al Centro" },

  // Vault
  vaultTitle: { en: "Academic Vault", es: "Bóveda Académica" },
  vaultSub: {
    en: "AES-256 encrypted. Stored on device.",
    es: "Cifrado AES-256. Almacenado en el dispositivo.",
  },
  vaultEmpty: {
    en: "Your vault is empty. Retrieve your first transcript to begin.",
    es: "Tu bóveda está vacía. Recupera tu primer expediente para comenzar.",
  },
  retrievedOn: { en: "Retrieved", es: "Recuperado" },

  // Document viewer
  documentViewer: { en: "Document Viewer", es: "Visor de Documento" },
  oneTapShare: { en: "1-Tap Share", es: "Compartir 1-Toque" },
  shareDocument: { en: "Share Document", es: "Compartir Documento" },
  gpa: { en: "GPA", es: "GPA" },
  credits: { en: "Credits", es: "Créditos" },
  institution: { en: "Institution", es: "Institución" },

  // Share
  shareTitle: { en: "Generate Secure Link", es: "Generar Enlace Seguro" },
  shareSub: {
    en: "Self-destructs after time elapsed or view limit reached.",
    es: "Se autodestruye tras tiempo o límite de vistas.",
  },
  recipient: { en: "Recipient Label", es: "Etiqueta del Destinatario" },
  recipientPlaceholder: { en: "e.g. Acme Recruiter", es: "ej. Reclutador Acme" },
  expiresIn: { en: "Expires In (hours)", es: "Expira en (horas)" },
  maxViews: { en: "Max Views", es: "Vistas Máximas" },
  generateLink: { en: "Generate Self-Destruct Link", es: "Generar Enlace Autodestructivo" },
  yourLink: { en: "Your Secure Link", es: "Tu Enlace Seguro" },
  linkCopied: { en: "Link copied to clipboard", es: "Enlace copiado al portapapeles" },
  shareHistory: { en: "Share History", es: "Historial de Compartidos" },
  views: { en: "Views", es: "Vistas" },
  destroyed: { en: "DESTROYED", es: "DESTRUIDO" },
  active: { en: "ACTIVE", es: "ACTIVO" },
  expired: { en: "EXPIRED", es: "EXPIRADO" },

  // Security dashboard
  trustDashboardTitle: {
    en: "Security & Privacy",
    es: "Seguridad y Privacidad",
  },
  encryptionStatus: { en: "Encryption Status", es: "Estado del Cifrado" },
  keyStorage: { en: "Key Storage", es: "Almacenamiento de Claves" },
  identityStatus: { en: "Identity Status", es: "Estado de Identidad" },
  biometricLock: { en: "Biometric Lock", es: "Bloqueo Biométrico" },
  compliance: { en: "Compliance", es: "Cumplimiento" },
  recentActivity: { en: "Recent Activity", es: "Actividad Reciente" },
  enabled: { en: "ENABLED", es: "ACTIVADO" },
  disabled: { en: "DISABLED", es: "DESACTIVADO" },

  // Settings
  settings: { en: "Settings", es: "Ajustes" },
  language: { en: "Language", es: "Idioma" },
  english: { en: "English", es: "Inglés" },
  spanish: { en: "Spanish", es: "Español" },
  account: { en: "Account", es: "Cuenta" },
  identityVerified: { en: "Identity Verified", es: "Identidad Verificada" },
  notVerified: { en: "Not Verified", es: "No Verificado" },
  signOut: { en: "Sign Out (wipe local data)", es: "Cerrar sesión (borrar datos)" },
  confirmSignOut: {
    en: "This will wipe all local data. Continue?",
    es: "Esto borrará todos los datos locales. ¿Continuar?",
  },

  // Tabs
  tabHome: { en: "Center", es: "Centro" },
  tabVault: { en: "Vault", es: "Bóveda" },
  tabSecurity: { en: "Security", es: "Seguridad" },
  tabSettings: { en: "Settings", es: "Ajustes" },

  // Biometric gate
  vaultBioTag: { en: "VAULT • LOCKED", es: "BÓVEDA • BLOQUEADA" },
  vaultBioTitle: {
    en: "Biometric Required",
    es: "Biometría Requerida",
  },
  vaultBioBody: {
    en: "Authenticate with Face ID or fingerprint to decrypt your vault.",
    es: "Autentícate con Face ID o huella digital para descifrar tu bóveda.",
  },
  vaultBioPrompt: {
    en: "Unlock Academic Vault",
    es: "Desbloquear Bóveda Académica",
  },
  vaultBioMethod: { en: "Method", es: "Método" },
  vaultBioUnlock: { en: "Unlock Vault", es: "Desbloquear Bóveda" },
  vaultBioUnavailable: {
    en: "Biometric hardware unavailable on this device — vault is open.",
    es: "Hardware biométrico no disponible — bóveda abierta.",
  },
  vaultBioWebFallback: {
    en: "Biometric lock active in native builds only. Vault is open on web preview.",
    es: "Bloqueo biométrico solo en builds nativas. Bóveda abierta en vista web.",
  },

  // ID.me production bridge
  idMeProdMode: {
    en: "Live ID.me OIDC (sandbox)",
    es: "ID.me OIDC en vivo (sandbox)",
  },
  idMeMockMode: {
    en: "Mock bridge (no live ID.me credentials provisioned)",
    es: "Puente simulado (sin credenciales ID.me en vivo)",
  },
  idMeStartOIDC: {
    en: "Launch ID.me Flow",
    es: "Iniciar Flujo ID.me",
  },
  idMeOIDCCancelled: { en: "Cancelled", es: "Cancelado" },
  idMeOIDCFailed: { en: "Verification failed", es: "Verificación fallida" },

  // Universal Search + Discovery
  universalSearch: {
    en: "Universal School Search",
    es: "Búsqueda Universal de Escuelas",
  },
  searchHint: {
    en: "104 schools mapped • US + International • IPEDS-aligned",
    es: "104 escuelas mapeadas • EE.UU. + Internacional • alineado con IPEDS",
  },
  searchPlaceholder: {
    en: "Search by name, mascot, or acronym…",
    es: "Buscar por nombre, mascota o sigla…",
  },
  noResults: {
    en: "No mapped school matches that name.",
    es: "Ninguna escuela mapeada coincide con ese nombre.",
  },
  cantFind: { en: "Can't find your school?", es: "¿No encuentras tu escuela?" },
  launchDiscovery: {
    en: "Launch AI Discovery Mode",
    es: "Iniciar Modo Descubrimiento IA",
  },
  discoveryTitle: { en: "AI Discovery Mode", es: "Modo Descubrimiento IA" },
  discoverySub: {
    en: "If your school isn't mapped, the AI agent will explore the portal structure in real-time to locate the transcript page.",
    es: "Si tu escuela no está mapeada, el agente IA explorará la estructura del portal en tiempo real para localizar la página del expediente.",
  },
  schoolName: { en: "School Name", es: "Nombre de la Escuela" },
  schoolNamePh: {
    en: "e.g. Reed College",
    es: "ej. Universidad Reed",
  },
  portalUrlOptional: {
    en: "Portal URL (optional)",
    es: "URL del Portal (opcional)",
  },
  beginDiscovery: { en: "Begin Discovery", es: "Iniciar Descubrimiento" },
  filterAll: { en: "All", es: "Todas" },
  filterUS: { en: "US", es: "EE.UU." },
  filterINTL: { en: "International", es: "Internacional" },
  discoveredBadge: {
    en: "DISCOVERED VIA AI",
    es: "DESCUBIERTO POR IA",
  },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, lang: Lang): string {
  const entry = STRINGS[key];
  if (!entry) return String(key);
  return entry[lang] ?? entry.en;
}
