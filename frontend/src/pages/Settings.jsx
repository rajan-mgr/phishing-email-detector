import { useAuth } from "../context/AuthContext";
import { getAuthUrl } from "../services/api";

export default function Settings() {
  const { user, logout, autoScan, toggleAutoScan } = useAuth();

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <h2 className="text-[24px] md:text-[32px] leading-[1.2] tracking-[-0.01em] font-semibold font-[Geist] text-on-surface">
          Settings
        </h2>
        <p className="text-[16px] leading-[1.5] text-on-surface-variant mt-1">
          Manage your account and scan preferences.
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Connected Account */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-[24px] leading-[1.3] font-semibold font-[Geist] text-on-surface mb-4">
            Connected Account
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
              <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant uppercase">
                Email
              </span>
              <span className="text-[14px] leading-[1.5] text-on-surface">
                {user?.email}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
              <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant uppercase">
                Provider
              </span>
              <span className={`inline-flex px-2.5 py-1 rounded-md text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] ${
                user?.provider === "google"
                  ? "bg-blue-500/10 border border-blue-500/30 text-blue-400"
                  : "bg-blue-600/10 border border-blue-600/30 text-blue-300"
              }`}>
                {user?.provider === "google" ? "Google" : "Microsoft"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant uppercase">
                Connected Since
              </span>
              <span className="text-[14px] leading-[1.5] text-on-surface">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Re-authenticate */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-[24px] leading-[1.3] font-semibold font-[Geist] text-on-surface mb-2">
            Re-authenticate
          </h3>
          <p className="text-[14px] leading-[1.5] text-on-surface-variant mb-4">
            If your token has expired, re-authenticate to continue scanning emails.
          </p>
          <div className="flex gap-3">
            <a
              href={getAuthUrl("google")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-800 text-[12px] leading-[1.2] tracking-[0.02em] font-medium font-[JetBrains_Mono] hover:bg-gray-50 transition-all no-underline hover:scale-[1.02]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </a>
            <a
              href={getAuthUrl("outlook")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0078d4] text-white text-[12px] leading-[1.2] tracking-[0.02em] font-medium font-[JetBrains_Mono] hover:bg-[#106ebe] transition-all no-underline hover:scale-[1.02]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#fff" d="M24 7.5l-.3-.1-9.2-4.4L12 2 9.5 3l-9.2 4.4-.3.1v9l.3.1 9.2 4.4L12 22l2.5-1 9.2-4.4.3-.1v-9zM12 13.5l-7-3.5V6l7 3.5L19 6v4l-7 3.5z"/>
              </svg>
              Microsoft
            </a>
          </div>
        </div>

        {/* Scan Preferences */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-[24px] leading-[1.3] font-semibold font-[Geist] text-on-surface mb-4">
            Scan Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
              <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant uppercase">
                Max emails per scan
              </span>
              <span className="text-[14px] leading-[1.5] text-on-surface">50</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-[12px] leading-[1.2] tracking-[0.05em] font-medium font-[JetBrains_Mono] text-on-surface-variant uppercase block">
                  Auto-scan on login
                </span>
                <span className="text-[14px] leading-[1.5] text-on-surface-variant mt-1 block">
                  Automatically scan inbox when you log in
                </span>
              </div>
              <button
                onClick={toggleAutoScan}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  autoScan ? "bg-primary" : "bg-surface-container-highest"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                    autoScan ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Account - Danger Zone */}
        <div className="glass-panel rounded-xl p-6 border border-error/30">
          <h3 className="text-[24px] leading-[1.3] font-semibold font-[Geist] text-error mb-2">
            Account
          </h3>
          <p className="text-[14px] leading-[1.5] text-on-surface-variant mb-4">
            Disconnect your account. You can re-authenticate at any time.
          </p>
          <button
            onClick={logout}
            className="bg-error/10 border border-error/30 text-error text-[14px] leading-[1.2] tracking-[0.02em] font-medium font-[JetBrains_Mono] px-6 py-2.5 rounded-lg hover:bg-error/20 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">link_off</span>
            Disconnect Account
          </button>
        </div>
      </div>
    </div>
  );
}
