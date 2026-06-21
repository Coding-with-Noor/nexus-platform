export type ThemeMode = "light" | "dark" | "system"
export type Language = "en" | "es" | "fr" | "de" | "ar"

export type SettingsSection =
  | "profile"
  | "security"
  | "notifications"
  | "language"
  | "appearance"
  | "billing"

export interface NotificationPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  collaborationAlerts: boolean
  meetingReminders: boolean
  messageAlerts: boolean
  marketingEmails: boolean
}

export interface UserPreferences {
  theme: ThemeMode
  language: Language
  notifications: NotificationPreferences
}

const STORAGE_KEY = "business_nexus_preferences"

const defaultPreferences: UserPreferences = {
  theme: "light",
  language: "en",
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    collaborationAlerts: true,
    meetingReminders: true,
    messageAlerts: true,
    marketingEmails: false,
  },
}

export function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { ...defaultPreferences }
    return { ...defaultPreferences, ...JSON.parse(stored) }
  } catch {
    return { ...defaultPreferences }
  }
}

export function savePreferences(prefs: UserPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  root.classList.toggle("dark", isDark)
}

export function initPreferences(): UserPreferences {
  const prefs = loadPreferences()
  applyTheme(prefs.theme)
  return prefs
}

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "ar", label: "العربية" },
]
