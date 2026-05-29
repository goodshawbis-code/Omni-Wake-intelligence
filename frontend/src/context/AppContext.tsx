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

type User = {
  user_id: string;
  device_id?: string | null;
  id_me_verified: boolean;
  id_me_full_name?: string | null;
  id_me_verified_at?: string | null;
  language: Lang;
  biometric_lock: boolean;
  created_at: string;
};

type Ctx = {
  user: User | null;
  lang: Lang;
  loading: boolean;
  setLang: (l: Lang) => Promise<void>;
  setUser: (u: User) => void;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  setBiometric: (v: boolean) => Promise<void>;
};

const AppContext = createContext<Ctx | null>(null);

const USER_ID_KEY = "oct.user_id";
const LANG_KEY = "oct.lang";

function ensureDeviceId(): Promise<string> {
  return storage
    .secureGet<string>("oct.device_id", "")
    .then((id) => {
      if (id && typeof id === "string" && id.length > 0) return id;
      const gen =
        "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      storage.secureSet("oct.device_id", gen);
      return gen;
    });
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [lang, setLangState] = useState<Lang>("en");
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    // Safety net: if anything hangs (storage/fetch), still flip loading off.
    const safety = setTimeout(() => setLoading(false), 4000);
    try {
      console.log("[oct] bootstrap start");
      const storedLang = await storage.getItem<string>(LANG_KEY, "");
      if (storedLang === "en" || storedLang === "es") {
        setLangState(storedLang);
      }

      const deviceId = await ensureDeviceId();
      console.log("[oct] device", deviceId);
      const res = await api.post<User>("/users/bootstrap", {
        device_id: deviceId,
      });
      console.log("[oct] bootstrap response", !!res);
      if (res) {
        setUserState(res);
        await storage.secureSet(USER_ID_KEY, res.user_id);
        if (
          res.language &&
          (res.language === "en" || res.language === "es") &&
          !storedLang
        ) {
          setLangState(res.language);
        }
      }
    } catch (e) {
      console.warn("[oct] bootstrap failed", e);
    } finally {
      clearTimeout(safety);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const setLang = async (l: Lang) => {
    setLangState(l);
    await storage.setItem(LANG_KEY, l);
    if (user) {
      try {
        const updated = await api.post<User>("/users/settings", {
          user_id: user.user_id,
          language: l,
        });
        if (updated) setUserState(updated);
      } catch (e) {
        console.warn("lang sync failed", e);
      }
    }
  };

  const refreshUser = useCallback(async () => {
    if (!user) return;
    const fresh = await api.get<User>(`/users/${user.user_id}`);
    if (fresh) setUserState(fresh);
  }, [user]);

  const signOut = async () => {
    await storage.secureRemove(USER_ID_KEY);
    await storage.secureRemove("oct.device_id");
    setUserState(null);
    await bootstrap();
  };

  const setBiometric = async (v: boolean) => {
    if (!user) return;
    const updated = await api.post<User>("/users/settings", {
      user_id: user.user_id,
      biometric_lock: v,
    });
    if (updated) setUserState(updated);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        lang,
        loading,
        setLang,
        setUser: setUserState,
        refreshUser,
        signOut,
        setBiometric,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
