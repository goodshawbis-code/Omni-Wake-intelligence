import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { storage } from "@/src/utils/storage";
import { Lang } from "@/src/i18n/translations";
import { api } from "@/src/api/client";

export type Operator = {
  operator_id: string;
  device_id?: string | null;
  email?: string | null;
  full_name?: string | null;
  clearance_level: string;
  ingress_verified: boolean;
  ingress_verified_at?: string | null;
  biometric_lock: boolean;
  language: Lang;
  created_at: string;
};

type Ctx = {
  operator: Operator | null;
  // Back-compat alias for components that still read "user"
  user: Operator | null;
  lang: Lang;
  loading: boolean;
  setLang: (l: Lang) => Promise<void>;
  setOperator: (o: Operator) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  setBiometric: (v: boolean) => Promise<void>;
};

const AppContext = createContext<Ctx | null>(null);

const OP_ID_KEY = "omw.operator_id";
const LANG_KEY = "omw.lang";
const DEVICE_KEY = "omw.device_id";

async function ensureDeviceId(): Promise<string> {
  const id = await storage.secureGet<string>(DEVICE_KEY, "");
  if (id && typeof id === "string" && id.length > 0) return id;
  const gen = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  await storage.secureSet(DEVICE_KEY, gen);
  return gen;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [operator, setOpState] = useState<Operator | null>(null);
  const [lang, setLangState] = useState<Lang>("en");
  const [loading, setLoading] = useState(false);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    const safety = setTimeout(() => setLoading(false), 3000);
    try {
      console.log("[omw] bootstrap start");
      const storedLang = await storage.getItem<string>(LANG_KEY, "");
      if (storedLang === "en" || storedLang === "es") setLangState(storedLang);
      const deviceId = await ensureDeviceId();
      console.log("[omw] device", deviceId);
      const res = await api.post<Operator>("/ingress/bootstrap", { device_id: deviceId });
      console.log("[omw] bootstrap response", !!res);
      if (res) {
        setOpState(res);
        await storage.secureSet(OP_ID_KEY, res.operator_id);
        if (res.language === "en" || res.language === "es") {
          if (!storedLang) setLangState(res.language);
        }
      }
    } catch (e) {
      console.warn("[omw] bootstrap failed", e);
    } finally {
      clearTimeout(safety);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const setLang = useCallback(async (l: Lang) => {
    setLangState(l);
    await storage.setItem(LANG_KEY, l);
    if (operator) {
      const res = await api.post<Operator>("/ingress/settings", {
        operator_id: operator.operator_id,
        language: l,
      });
      if (res) setOpState(res);
    }
  }, [operator]);

  const setOperator = useCallback((o: Operator) => setOpState(o), []);

  const refresh = useCallback(async () => {
    if (!operator) return;
    // No dedicated /me route; we rebootstrap which is idempotent
    const deviceId = await ensureDeviceId();
    const res = await api.post<Operator>("/ingress/bootstrap", { device_id: deviceId });
    if (res) setOpState(res);
  }, [operator]);

  const signOut = useCallback(async () => {
    await storage.secureRemove(OP_ID_KEY);
    await storage.secureRemove(DEVICE_KEY);
    setOpState(null);
    setLoading(true);
    bootstrap();
  }, [bootstrap]);

  const setBiometric = useCallback(async (v: boolean) => {
    if (!operator) return;
    const res = await api.post<Operator>("/ingress/settings", {
      operator_id: operator.operator_id,
      biometric_lock: v,
    });
    if (res) setOpState(res);
  }, [operator]);

  return (
    <AppContext.Provider
      value={{
        operator,
        user: operator,
        lang,
        loading,
        setLang,
        setOperator,
        refresh,
        signOut,
        setBiometric,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
