import React, { useEffect, useLayoutEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom"
import { Phone, Lock, ArrowRight, ShieldCheck, Loader2, UtensilsCrossed, Car, ShoppingBag, Building2 } from "lucide-react"
import { toast } from "sonner"
import { authAPI } from "@food/api"
import { setUnifiedAuthData, isUnifiedAuthenticated } from "@food/utils/auth"

export default function UnifiedOTPFastLogin({ viewType = "auth" }) {
  const RESEND_COOLDOWN_SECONDS = 60
  const VERIFY_REQUEST_TIMEOUT_MS = 20000
  const FCM_FETCH_TIMEOUT_MS = 12000
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState(1) // 1: Phone, 2: OTP
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const navigate = useNavigate()
  const submitting = useRef(false)
  const selectorThemeSnapshotRef = useRef({ appliedByThisView: false })

  const getWebFcmTokenForLogin = async () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      throw new Error("Browser environment not available for FCM token generation")
    }
    if (!("serviceWorker" in navigator) || typeof Notification === "undefined") {
      throw new Error("This browser does not support push notifications")
    }

    const firebaseConfig = {
      apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY || "").trim(),
      authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "").trim(),
      projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim(),
      storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "").trim(),
      messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
      appId: String(import.meta.env.VITE_FIREBASE_APP_ID || "").trim(),
    }
    const vapidKey = String(import.meta.env.VITE_FIREBASE_VAPID_KEY || "").trim()

    if (!Object.values(firebaseConfig).every(Boolean) || !vapidKey) {
      throw new Error("Firebase web push config missing in Frontend/.env")
    }

    if (Notification.permission === "denied") {
      throw new Error("Notification permission is blocked. Enable notifications and try again.")
    }
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        throw new Error("Notification permission is required for login")
      }
    }

    const [{ getApps, initializeApp }, { getMessaging, getToken, isSupported }] = await Promise.all([
      import("firebase/app"),
      import("firebase/messaging"),
    ])

    const supported = await isSupported().catch(() => false)
    if (!supported) {
      throw new Error("Firebase messaging is not supported in this browser")
    }

    const app = getApps()[0] || initializeApp(firebaseConfig)
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    })

    const normalizedToken = String(token || "").trim()
    if (!normalizedToken || normalizedToken.length < 20) {
      throw new Error("Failed to generate FCM token")
    }

    localStorage.setItem("fcm_web_registered_token_user", normalizedToken)
    return normalizedToken
  }

  // Keep /login/services visually consistent (light) regardless of global app theme.
  // Scope-limited: only active while selector view is mounted.
  useLayoutEffect(() => {
    if (typeof document === "undefined") return
    const html = document.documentElement
    const body = document.body
    const root = document.getElementById("root")
    const snapshot = selectorThemeSnapshotRef.current
    let htmlObserver = null
    let bodyObserver = null
    let rootObserver = null

    const applyPersistedTheme = () => {
      const savedTheme = localStorage.getItem("appTheme") || "light"
      if (savedTheme === "dark") {
        html.classList.add("dark")
        if (body) body.classList.add("dark")
      } else {
        html.classList.remove("dark")
        if (body) body.classList.remove("dark")
      }
    }

    if (viewType !== "selector") {
      if (snapshot.appliedByThisView) applyPersistedTheme()
      snapshot.appliedByThisView = false
      return
    }

    const enforceLight = () => {
      let changed = false
      if (html.classList.contains("dark")) {
        html.classList.remove("dark")
        changed = true
      }
      if (body?.classList.contains("dark")) {
        body.classList.remove("dark")
        changed = true
      }
      if (root?.classList.contains("dark")) {
        root.classList.remove("dark")
        changed = true
      }
      if (changed) snapshot.appliedByThisView = true
    }
    enforceLight()

    // Enforce priority: while selector is open, keep this page in light mode
    // even if any other module tries to re-apply "dark" on <html> or <body>.
    htmlObserver = new MutationObserver(enforceLight)
    htmlObserver.observe(html, { attributes: true, attributeFilter: ["class"] })
    if (body) {
      bodyObserver = new MutationObserver(enforceLight)
      bodyObserver.observe(body, { attributes: true, attributeFilter: ["class"] })
    }
    if (root) {
      rootObserver = new MutationObserver(enforceLight)
      rootObserver.observe(root, { attributes: true, attributeFilter: ["class"] })
    }

    return () => {
      if (htmlObserver) htmlObserver.disconnect()
      if (bodyObserver) bodyObserver.disconnect()
      if (rootObserver) rootObserver.disconnect()
      if (!snapshot.appliedByThisView) return
      applyPersistedTheme()
      snapshot.appliedByThisView = false
    }
  }, [viewType])

  // Check if already logged in on mount - if at login page, redirect to services
  useEffect(() => {
    if (isUnifiedAuthenticated() && viewType === "auth") {
      navigate("/login/services", { replace: true })
    }
  }, [viewType, navigate])

  const normalizedPhone = () => {
    const digits = String(phoneNumber).replace(/\D/g, "").slice(-15)
    return digits.length >= 8 ? digits : ""
  }

  const withTimeout = async (promise, timeoutMs, label) => {
    let timeoutId
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`${label} timed out. Please try again.`))
      }, timeoutMs)
    })
    try {
      return await Promise.race([promise, timeoutPromise])
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const waitForFlutterBridge = async (timeoutMs = 6000) => {
    if (typeof window === "undefined") return false
    if (window.flutter_inappwebview && typeof window.flutter_inappwebview.callHandler === "function") {
      return true
    }

    const startedAt = Date.now()
    while (Date.now() - startedAt < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 120))
      if (window.flutter_inappwebview && typeof window.flutter_inappwebview.callHandler === "function") {
        return true
      }
    }
    return false
  }

  const normalizeBridgeToken = (value) => {
    if (typeof value === "string") return value.trim()
    if (value && typeof value === "object") {
      const candidates = [value.token, value.fcmToken, value.data?.token, value.data?.fcmToken]
      for (const candidate of candidates) {
        const normalized = String(candidate || "").trim()
        if (normalized.length > 20) return normalized
      }
    }
    return String(value || "").trim()
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    const phone = normalizedPhone()
    if (phone.length < 8) {
      toast.error("Please enter a valid phone number (at least 8 digits)")
      return
    }
    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    try {
      const otpSendResponse = await authAPI.sendUnifiedOTP(phoneNumber)
      console.log("[Auth] OTP send response:", otpSendResponse?.data || otpSendResponse)
      setOtpSent(true)
      setOtp("")
      setStep(2)
      setResendTimer(RESEND_COOLDOWN_SECONDS)
      toast.success("OTP sent! Check your phone.")
    } catch (err) {
      console.log("[Auth] OTP send error:", err?.response?.data || err)
      const msg = err?.response?.data?.message || err?.message || "Failed to send OTP."
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const handleResendOTP = async () => {
    const phone = normalizedPhone()
    if (phone.length < 8) {
      toast.error("Please enter a valid phone number (at least 8 digits)")
      return
    }
    if (resendTimer > 0 || submitting.current) return
    submitting.current = true
    setLoading(true)
    try {
      const otpResendResponse = await authAPI.sendUnifiedOTP(phoneNumber)
      console.log("[Auth] OTP resend response:", otpResendResponse?.data || otpResendResponse)
      setOtp("")
      setOtpSent(true)
      setResendTimer(RESEND_COOLDOWN_SECONDS)
      toast.success("OTP resent successfully.")
    } catch (err) {
      console.log("[Auth] OTP resend error:", err?.response?.data || err)
      const msg = err?.response?.data?.message || err?.message || "Failed to resend OTP."
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const handleEditNumber = () => {
    setStep(1)
    setOtp("")
    setResendTimer(0)
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    const phone = normalizedPhone()
    const otpDigits = String(otp).replace(/\D/g, "").slice(0, 4)
    if (otpDigits.length !== 4) {
      toast.error("Please enter the 4-digit OTP")
      return
    }
    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    try {
      let fcmToken = ""
      let platform = "web"
      if (typeof window !== "undefined" && window.flutter_inappwebview) {
        platform = "mobile"
        await waitForFlutterBridge()
        const handlerNames = ["getFcmToken", "getFCMToken", "getPushToken", "getFirebaseToken"]
        for (const handlerName of handlerNames) {
          try {
            const t = await window.flutter_inappwebview.callHandler(handlerName, { module: "user" })
            const normalized = normalizeBridgeToken(t)
            if (normalized.length > 20) {
              fcmToken = normalized
              break
            }
          } catch (_) {}
        }
        if (!fcmToken) {
          throw new Error("Unable to fetch mobile FCM token from app bridge")
        }
      } else {
        fcmToken = await withTimeout(
          getWebFcmTokenForLogin(),
          FCM_FETCH_TIMEOUT_MS,
          "FCM token fetch",
        )
      }

      console.log("[Auth] FCM token for login:", {
        platform,
        length: fcmToken.length,
        preview: `${fcmToken.slice(0, 12)}...`,
      })

      const response = await withTimeout(
        authAPI.verifyUnifiedOTP(phoneNumber, otpDigits, null, null, fcmToken, platform),
        VERIFY_REQUEST_TIMEOUT_MS,
        "OTP verification request",
      )
      console.log("[Auth] OTP verify response:", response?.data || response)
      const data = response?.data?.data || response?.data || {}

      if (!data.accessToken || !data.user) {
        throw new Error("Invalid response from server")
      }

      setUnifiedAuthData(data)
      try {
        await authAPI.saveLoginFcmToken(fcmToken, platform)
      } catch (fcmSaveError) {
        console.warn("[Auth] FCM save route failed after login:", fcmSaveError?.message || fcmSaveError)
      }
      toast.success("Authentication successful!")
      navigate("/login/services")
    } catch (err) {
      const status = err?.response?.status
      let msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Invalid OTP. Please try again."
      if (status === 401) {
        if (/deactivat(ed|e)/i.test(String(msg))) {
          msg = "Your account is deactivated. Please contact support."
        } else {
          msg = "Invalid or expired code, or account not active."
        }
      }
      console.log("[Auth] OTP verify error:", err?.response?.data || err)
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  useEffect(() => {
    if (step !== 2 || resendTimer <= 0) return
    const intervalId = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(intervalId)
  }, [step, resendTimer])

  const formatResendTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const selectionOptions = [
    {
      id: "food",
      name: "Food Delivery",
      description: "Order from the best restaurants around you",
      icon: UtensilsCrossed,
      color: "bg-[#89C741]",
      path: "/food/user",
      delay: 0.1
    },
    {
      id: "taxi",
      name: "Ride Hailing",
      description: "Book safe and reliable rides instantly",
      icon: Car,
      color: "bg-[#F38F24]",
      path: "/taxi/user",
      delay: 0.2
    }
  ]

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col pt-0 overflow-hidden font-sans",
        viewType === "selector" ? "bg-[#FDFDFD]" : "bg-[#FDFDFD] dark:bg-[#0a0a0a]"
      )}
    >
      {/* Dynamic Header */}
      <motion.div
        layout
        className="w-full bg-[#0A1121] rounded-b-[4rem] p-10 pb-16 text-center text-white relative overflow-hidden shadow-2xl"
      >
        {/* Animated Background Orbs with Logo Colors */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#89C741]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -right-20 w-96 h-96 bg-[#F38F24]/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12 }}
            className="w-40 h-40 flex items-center justify-center mb-4 overflow-hidden"
          >
            <img src="/eqosy-logo.png" alt="Eqosy" className="w-full h-full object-contain" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-9xl font-black tracking-tighter mb-4 flex items-center"
          >
            <span className="text-[#89C741]">Eq</span>
            <span className="text-[#F38F24]">osy</span>
          </motion.h1>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "140px" }}
            className="h-1.5 bg-gradient-to-r from-[#89C741] to-[#F38F24] rounded-full mb-6"
          />
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] md:text-xs font-black text-white/60 tracking-[0.3em] uppercase">
            <span>Food</span>
            <span className="text-[#F38F24]">•</span>
            <span>Rides</span>
            <span className="text-[#89C741]">•</span>
            <span>Parcel Delivery</span>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 max-w-[1000px] mx-auto w-full px-6 py-4 flex flex-col justify-start -mt-10 relative z-20">
        <AnimatePresence mode="wait">
          {viewType === "auth" ? (
            <motion.div
              key="auth-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-[480px] mx-auto"
            >
              {/* Premium Auth Card */}
              <div className="bg-white dark:bg-[#151515] rounded-[3.5rem] p-10 md:p-14 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-white/5 relative overflow-hidden">
                
                {/* Subtle card decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#89C741]/5 rounded-full blur-3xl -mr-16 -mt-16" />

                <div className="text-center mb-12 relative z-10">
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
                      Welcome <span className="text-[#89C741]">Back</span>
                    </h2>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em]">
                      Enter your details to continue
                    </p>
                  </motion.div>
                </div>

                <form onSubmit={step === 1 ? handleSendOTP : handleVerifyOTP} className="space-y-10 relative z-10">
                  {step === 1 ? (
                    <div className="space-y-8">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-1 pointer-events-none">
                          <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center group-focus-within:bg-[#89C741]/10 transition-colors">
                            <Phone className="w-5 h-5 text-gray-400 group-focus-within:text-[#89C741]" />
                          </div>
                        </div>
                        <div className="absolute left-14 inset-y-0 flex items-center pointer-events-none">
                          <span className="text-lg font-black text-gray-900 dark:text-white border-r border-gray-100 dark:border-white/10 pr-4">+91</span>
                        </div>
                        <input
                          type="tel"
                          required
                          autoFocus
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          maxLength={10}
                          className="block w-full pl-32 pr-4 py-5 bg-transparent text-gray-900 dark:text-white border-b-2 border-gray-100 dark:border-white/10 focus:border-[#89C741] outline-none transition-all placeholder:text-gray-200 font-black text-2xl tracking-widest"
                          placeholder="00000 00000"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 text-center font-black uppercase tracking-[0.3em]">
                        One-time password will be sent
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5">
                        <div className="w-14 h-14 bg-[#89C741] rounded-2xl flex items-center justify-center shadow-lg shadow-[#89C741]/20">
                          <ShieldCheck className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1 text-left">Verify Phone</p>
                          <p className="text-lg font-black text-gray-900 dark:text-white text-left">+91 {phoneNumber}</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={handleEditNumber} 
                          className="p-3 hover:bg-[#89C741]/10 rounded-xl text-[#89C741] transition-colors"
                        >
                          <Lock className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex justify-between gap-3 px-2">
                        {[0, 1, 2, 3].map((index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="tel"
                            inputMode="numeric"
                            required
                            autoFocus={index === 0}
                            value={otp[index] || ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(-1);
                              if (!val) return;
                              const newOtp = otp.split("");
                              newOtp[index] = val;
                              const combined = newOtp.join("").slice(0, 4);
                              setOtp(combined);
                              if (index < 3 && val) document.getElementById(`otp-${index + 1}`)?.focus();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace" && !otp[index] && index > 0) {
                                document.getElementById(`otp-${index - 1}`)?.focus();
                              }
                            }}
                            className="w-16 h-20 text-center text-3xl font-black bg-gray-50 dark:bg-white/5 border-b-4 border-gray-100 dark:border-white/10 focus:border-[#89C741] rounded-2xl outline-none transition-all text-gray-900 dark:text-white"
                            placeholder="-"
                          />
                        ))}
                      </div>
                      
                      <div className="text-center">
                        {resendTimer > 0 ? (
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                            New Code in <span className="text-[#89C741]">{formatResendTimer(resendTimer)}</span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOTP}
                            className="text-[11px] font-black text-[#89C741] uppercase tracking-[0.3em] hover:opacity-70 transition-opacity"
                          >
                            Resend Verification Code
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-6 rounded-3xl font-black text-xl transition-all relative overflow-hidden shadow-2xl ${
                      loading
                        ? "bg-gray-100 dark:bg-white/10 cursor-not-allowed"
                        : "bg-[#89C741] hover:bg-[#78AC37] text-white hover:shadow-[#89C741]/30 hover:-translate-y-1 active:scale-[0.98]"
                    }`}
                  >
                    {loading ? (
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-white" />
                    ) : (
                      <span className="flex items-center justify-center gap-4 uppercase tracking-[0.1em]">
                        {step === 1 ? "Get Started" : "Verify & Log In"}
                        <ArrowRight className="w-6 h-6" />
                      </span>
                    )}
                  </button>
                </form>
              </div>

              {/* Security Badge */}
              <div className="mt-12 flex items-center justify-center gap-3 opacity-40">
                <ShieldCheck className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                  Secure Encryption Powered by Eqosy
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="selector-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-5xl mx-auto px-4 sm:px-6 pb-6"
            >
              <div className="relative overflow-hidden rounded-[2.25rem] border border-[#0A1121]/5 bg-gradient-to-br from-white via-[#fbfdf8] to-[#fff8f1] px-4 py-8 sm:px-8 sm:py-10 mb-6">
                <div className="absolute -top-16 -left-14 h-44 w-44 rounded-full bg-[#89C741]/15 blur-3xl" />
                <div className="absolute -bottom-24 -right-14 h-52 w-52 rounded-full bg-[#F38F24]/12 blur-3xl" />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-[#89C741]/10 border border-[#89C741]/20 text-[#5c8b24] text-[10px] font-black uppercase tracking-[0.2em] relative z-10"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#89C741]" />
                  Experience the Future
                </motion.div>
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative z-10 text-[2rem] sm:text-5xl md:text-6xl font-black text-gray-900 mb-3 tracking-tight leading-[1.05]"
                >
                  Pick Your <span className="text-[#89C741]">Eqosy</span> <span className="text-[#F38F24]">Service</span>
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="relative z-10 text-gray-600 font-semibold text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
                >
                  Choose one module to continue. Everything is unified for faster access.
                </motion.p>
              </div>

              {/* Sophisticated Service Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                {selectionOptions.map((opt, idx) => {
                  const Icon = opt.icon
                  return (
                    <motion.div
                      key={opt.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1, type: "spring", stiffness: 100 }}
                      onClick={() => navigate(opt.path)}
                      className="group relative"
                    >
                      {/* Glow Effect on Hover */}
                      <div className={cn(
                        "absolute -inset-2 sm:-inset-4 rounded-[2rem] sm:rounded-[4rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl",
                        opt.id === 'food' ? "bg-[#89C741]/10" : "bg-[#F38F24]/10"
                      )} />
                      
                      <div className="relative h-full min-h-[250px] sm:min-h-[320px] bg-white/95 backdrop-blur rounded-[2rem] sm:rounded-[2.6rem] p-4 sm:p-7 border border-gray-100 shadow-[0_18px_40px_-25px_rgba(10,17,33,0.35)] hover:shadow-[0_24px_48px_-22px_rgba(10,17,33,0.35)] transition-all duration-500 hover:-translate-y-2 overflow-hidden cursor-pointer">
                        
                        {/* Background Decorative Element */}
                        <div className={cn(
                          "absolute top-0 right-0 w-36 h-36 sm:w-52 sm:h-52 -mr-12 -mt-12 rounded-full opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-700",
                          opt.color
                        )} />

                        <div className="flex flex-col h-full relative z-10">
                          <div className={cn(
                            "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[1.6rem] flex items-center justify-center mb-5 sm:mb-7 shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-[8deg]",
                            opt.color
                          )}>
                            <Icon className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                          </div>

                          <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                            <h3 className="text-[1.95rem] sm:text-4xl font-black text-gray-900 tracking-tight leading-none group-hover:text-[#89C741] transition-colors duration-300">
                              {opt.name}
                            </h3>
                            <p className="text-gray-500 font-semibold text-xs sm:text-base leading-relaxed">
                              {opt.description}
                            </p>
                          </div>

                          <div className="inline-flex items-center gap-2 sm:gap-4 text-[#6da62f] font-black uppercase tracking-[0.15em] text-[10px] sm:text-xs transition-all duration-300 group-hover:gap-5">
                            <span>Open</span>
                            <div className="w-6 sm:w-10 h-[2px] bg-[#89C741]/20 relative overflow-hidden">
                              <motion.div 
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                className="absolute inset-0 bg-[#89C741]"
                              />
                            </div>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                        </div>

                        {/* Hover Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#89C741]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      </div>
                    </motion.div>
                  )
                })}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}
