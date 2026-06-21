"use client"

import React from "react"
import { Link } from "react-router-dom"
import { User, Lock, Bell, Globe, Palette, CreditCard, ShieldCheck, Wallet } from "lucide-react"
import { Card, CardHeader, CardBody } from "../../components/ui/Card"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"
import { Avatar } from "../../components/ui/Avatar"
import { useAuth } from "../../context/AuthContext"
import paymentService, { type Wallet as WalletType } from "../../services/paymentService"
import {
  loadPreferences,
  savePreferences,
  applyTheme,
  LANGUAGE_OPTIONS,
  type SettingsSection,
  type ThemeMode,
  type Language,
  type NotificationPreferences,
  type UserPreferences,
} from "../../utils/preferences"
import toast from "react-hot-toast"

const NOTIFICATION_LABELS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: "emailNotifications", label: "Email notifications", description: "Receive updates and alerts via email" },
  { key: "pushNotifications", label: "Push notifications", description: "Browser push alerts for important events" },
  { key: "collaborationAlerts", label: "Collaboration requests", description: "When someone sends or accepts a collaboration request" },
  { key: "meetingReminders", label: "Meeting reminders", description: "Reminders before scheduled meetings" },
  { key: "messageAlerts", label: "New messages", description: "When you receive a new chat message" },
  { key: "marketingEmails", label: "Product updates", description: "News, tips, and platform announcements" },
]

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description: string
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-600"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}

export const SettingsPage: React.FC = () => {
  const { user, isLoading, changePassword, uploadAvatar, updateProfile, enable2FA, disable2FA } = useAuth()
  const [activeSection, setActiveSection] = React.useState<SettingsSection>("profile")
  const [prefs, setPrefs] = React.useState<UserPreferences>(loadPreferences)
  const [wallet, setWallet] = React.useState<WalletType | null>(null)
  const [walletLoading, setWalletLoading] = React.useState(false)

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [bio, setBio] = React.useState("")
  const [currentPwd, setCurrentPwd] = React.useState("")
  const [newPwd, setNewPwd] = React.useState("")
  const [confirmPwd, setConfirmPwd] = React.useState("")
  const [disable2FAPwd, setDisable2FAPwd] = React.useState("")
  const [showDisable2FA, setShowDisable2FA] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [isBusy, setIsBusy] = React.useState(false)

  React.useEffect(() => {
    if (!user) return
    setName(user.name || "")
    setEmail(user.email || "")
    setLocation(user.location || "")
    setBio(user.bio || "")
  }, [user])

  React.useEffect(() => {
    if (activeSection === "billing" && user) {
      setWalletLoading(true)
      paymentService
        .getWallet()
        .then(setWallet)
        .catch(() => toast.error("Failed to load billing info"))
        .finally(() => setWalletLoading(false))
    }
  }, [activeSection, user])

  const navItems: { id: SettingsSection; icon: React.ReactNode; text: string }[] = [
    { id: "profile", icon: <User size={18} />, text: "Profile" },
    { id: "security", icon: <Lock size={18} />, text: "Security" },
    { id: "notifications", icon: <Bell size={18} />, text: "Notifications" },
    { id: "language", icon: <Globe size={18} />, text: "Language" },
    { id: "appearance", icon: <Palette size={18} />, text: "Appearance" },
    { id: "billing", icon: <CreditCard size={18} />, text: "Billing" },
  ]

  const updatePrefs = (updates: Partial<UserPreferences>) => {
    const next = { ...prefs, ...updates }
    setPrefs(next)
    savePreferences(next)
    if (updates.theme) applyTheme(updates.theme)
  }

  const updateNotification = (key: keyof NotificationPreferences, value: boolean) => {
    const notifications = { ...prefs.notifications, [key]: value }
    updatePrefs({ notifications })
  }

  const handleSaveNotifications = () => {
    savePreferences(prefs)
    toast.success("Notification preferences saved")
  }

  const handleSaveLanguage = () => {
    savePreferences(prefs)
    toast.success("Language preference saved")
  }

  const handleSaveAppearance = () => {
    savePreferences(prefs)
    applyTheme(prefs.theme)
    toast.success("Appearance updated")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Please log in to access settings.</p>
      </div>
    )
  }

  const handleSaveProfile = async () => {
    try {
      setIsBusy(true)
      const updates: Record<string, string> = {}
      if (name !== user.name) updates.name = name
      if (email && email !== user.email) updates.email = email
      if ((location || "") !== (user.location || "")) updates.location = location
      if ((bio || "") !== (user.bio || "")) updates.bio = bio

      if (Object.keys(updates).length > 0) {
        await updateProfile(user.id, updates)
      } else if (!selectedFile) {
        toast("No changes to save")
        return
      }

      if (selectedFile) {
        await uploadAvatar?.(selectedFile)
        setSelectedFile(null)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save changes")
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardBody className="p-2">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeSection === item.id
                      ? "text-primary-700 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.text}
                </button>
              ))}
            </nav>
          </CardBody>
        </Card>

        <div className="lg:col-span-3">
          {activeSection === "profile" && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Profile Settings</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar src={previewUrl || user.avatarUrl} alt={user.name} size="xl" />
                  <div>
                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                      Change Photo
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0]
                        if (!file) return
                        setSelectedFile(file)
                        setPreviewUrl(URL.createObjectURL(file))
                        e.currentTarget.value = ""
                      }}
                    />
                    <p className="mt-2 text-sm text-gray-500">JPG, GIF or PNG. Max size 5MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Input label="Role" value={user.role} disabled />
                  <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => { setName(user.name || ""); setEmail(user.email || ""); setLocation(user.location || ""); setBio(user.bio || ""); setSelectedFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={isBusy}>
                    {isBusy ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeSection === "security" && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Security Settings</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="text-primary-600 mt-0.5 shrink-0" size={20} />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {user.twoFactorEnabled ? "Email OTP enabled on each login." : "Add email OTP verification."}
                      </p>
                    </div>
                  </div>
                  {user.twoFactorEnabled ? (
                    showDisable2FA ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <Input label="Confirm Password" type="password" value={disable2FAPwd} onChange={(e) => setDisable2FAPwd(e.target.value)} />
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setShowDisable2FA(false); setDisable2FAPwd("") }}>Cancel</Button>
                          <Button size="sm" onClick={async () => { try { setIsBusy(true); await disable2FA?.(disable2FAPwd); setShowDisable2FA(false); setDisable2FAPwd("") } finally { setIsBusy(false) } }} disabled={isBusy || !disable2FAPwd}>Confirm</Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setShowDisable2FA(true)}>Disable</Button>
                    )
                  ) : (
                    <Button size="sm" onClick={async () => { try { setIsBusy(true); await enable2FA?.() } finally { setIsBusy(false) } }} disabled={isBusy}>Enable</Button>
                  )}
                </div>
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
                  <div className="space-y-4 max-w-md">
                    <Input label="Current Password" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
                    <Input label="New Password" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
                    <Input label="Confirm New Password" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
                    <div className="flex justify-end">
                      <Button onClick={async () => {
                        if (!newPwd || newPwd !== confirmPwd) { toast.error("Passwords do not match"); return }
                        try { setIsBusy(true); await changePassword?.(currentPwd, newPwd); setCurrentPwd(""); setNewPwd(""); setConfirmPwd("") } finally { setIsBusy(false) }
                      }} disabled={isBusy}>
                        {isBusy ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notification Preferences</h2>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Choose how you want to be notified about activity on the platform.
                </p>
                {NOTIFICATION_LABELS.map((item) => (
                  <Toggle
                    key={item.key}
                    checked={prefs.notifications[item.key]}
                    onChange={(v) => updateNotification(item.key, v)}
                    label={item.label}
                    description={item.description}
                  />
                ))}
                <div className="flex justify-end mt-6">
                  <Button onClick={handleSaveNotifications}>Save Preferences</Button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeSection === "language" && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Language</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select your preferred language for the platform interface.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => updatePrefs({ language: lang.value as Language })}
                      className={`px-4 py-3 text-left rounded-lg border-2 transition-colors cursor-pointer ${
                        prefs.language === lang.value
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{lang.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveLanguage}>Save Language</Button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeSection === "appearance" && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Customize how Nexus looks on your device.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {([
                    { value: "light" as ThemeMode, label: "Light", preview: "bg-white border-gray-200" },
                    { value: "dark" as ThemeMode, label: "Dark", preview: "bg-gray-900 border-gray-700" },
                    { value: "system" as ThemeMode, label: "System", preview: "bg-gradient-to-r from-white to-gray-900 border-gray-400" },
                  ]).map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => updatePrefs({ theme: theme.value })}
                      className={`p-4 rounded-lg border-2 transition-colors cursor-pointer text-left ${
                        prefs.theme === theme.value
                          ? "border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <div className={`h-16 rounded-md border mb-3 ${theme.preview}`} />
                      <span className="font-medium text-gray-900 dark:text-white">{theme.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveAppearance}>Apply Theme</Button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeSection === "billing" && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Billing & Wallet</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-primary-700 dark:text-primary-300 font-medium">Current Plan</p>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">Nexus Free</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Full access to collaboration, messaging, and wallet features</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-full">Active</span>
                  </div>
                </div>

                {walletLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                  </div>
                ) : wallet ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Wallet Balance</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">${wallet.balance.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Deposited</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">${wallet.totalDeposited.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Transferred</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">${wallet.totalTransferred.toFixed(2)}</p>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Link to="/wallet">
                    <Button leftIcon={<Wallet size={18} />}>Manage Wallet</Button>
                  </Link>
                  <Button variant="outline" onClick={() => toast("Premium plans coming soon")}>
                    Upgrade Plan
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Payment Method</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Deposits use Stripe sandbox or mock mode. Configure payment methods in the Wallet section.
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
