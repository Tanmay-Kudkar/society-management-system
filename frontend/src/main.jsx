import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";
import { AuthProvider, SettingsProvider } from "./context";
import App from "./App.jsx";
import "leaflet/dist/leaflet.css";
import "./styles/global.css";

function applyInitialThemeClass() {
  if (typeof window === "undefined") return;

  const storedTheme = localStorage.getItem("theme");
  const legacyTheme = localStorage.getItem("societyhub-theme");
  const mode = storedTheme || legacyTheme || "system";
  const prefersDark = window.matchMedia?.(
    "(prefers-color-scheme: dark)",
  )?.matches;
  const resolvedTheme =
    mode === "system" ? (prefersDark ? "dark" : "light") : mode;

  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(resolvedTheme === "dark" ? "dark" : "light");
}

function enablePerformanceModeWhenNeeded() {
  if (typeof window === "undefined") return;

  const reducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;
  const reducedData = window.matchMedia?.(
    "(prefers-reduced-data: reduce)",
  )?.matches;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  const smallScreen = window.innerWidth <= 768;
  const deviceMemory = navigator.deviceMemory || 0;
  const cpuCores = navigator.hardwareConcurrency || 0;

  const lowSpecDevice =
    (deviceMemory > 0 && deviceMemory <= 4) || (cpuCores > 0 && cpuCores <= 4);

  const shouldEnablePerfMode = Boolean(
    reducedMotion ||
    reducedData ||
    lowSpecDevice ||
    (coarsePointer && smallScreen),
  );

  if (shouldEnablePerfMode) {
    document.documentElement.classList.add("perf-lite");
    document.body.classList.add("perf-lite");
  }
}

enablePerformanceModeWhenNeeded();
applyInitialThemeClass();

function isBackendUnavailableError(error) {
  if (!error) return false;
  if (error?.response?.status) return false;

  const code = String(error?.code || "").toUpperCase();
  if (code === "ERR_NETWORK" || code === "ECONNABORTED" || code === "ETIMEDOUT") {
    return true;
  }

  const message = String(error?.message || "");
  return /failed to fetch|network error|connection refused|err_connection_refused|load failed/i.test(message);
}

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Only fire for mutations that don't have their own onError
      if (!mutation.options.onError) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong";
        window.dispatchEvent(
          new CustomEvent("global-mutation-error", { detail: msg }),
        );
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on client-side errors (bad request/auth/validation)
        const status = error?.response?.status;
        if (status >= 400 && status < 500) return false;
        // Keep trying while backend is unavailable so pages stay in loading state.
        if (isBackendUnavailableError(error)) return true;
        // Retry transient failures only a few times
        return failureCount < 3;
      },

      retryDelay: (attemptIndex, error) =>
        isBackendUnavailableError(error)
          ? 500
          : Math.min(1000 * 2 ** attemptIndex, 15000),
      
      // Auto-recover when backend comes back: poll failed queries every 0.5s.
      
      refetchInterval: (_data, query) =>
        query?.state?.status === "error" ? 500 : false,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>,
);
