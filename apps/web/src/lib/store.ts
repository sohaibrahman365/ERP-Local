import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: {
    id: string;
    email: string;
    fullName: string;
    role?: string;
    tenantId: string;
  } | null;
  tenant: {
    id: string;
    name: string;
    plan: string;
  } | null;
  accessToken: string | null;
  setAuth: (user: AuthState["user"], tenant: AuthState["tenant"], accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      setAuth: (user, tenant, accessToken) => {
        localStorage.setItem("accessToken", accessToken);
        set({ user, tenant, accessToken });
      },
      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("wise-auth");
        set({ user: null, tenant: null, accessToken: null });
        window.location.href = "/login";
      },
    }),
    { name: "wise-auth" }
  )
);
