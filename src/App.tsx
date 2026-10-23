/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { onSnapshot, doc, query, collection, where } from "firebase/firestore";
import Auth from "./user/auth/Auth";
import ErrorBoundary from "./components/ErrorBoundary";
import { OfflineNotice } from "./components/OfflineNotice";
import type { UserRole } from "./types";
import { safeGetJson, safeSetJson, safeRemoveItem } from "./utils/safeStorage";

import PublicNavbar from "./components/PublicNavbar";
import LandingPage from "./pages/LandingPage";
import Blog from "./pages/Blog";
import LegalPages from "./pages/LegalPages";

// Directly import Dashboard so logged-in users see the UI on frame 1 without any buffering spinner
import Dashboard from "./user/dashboard/Dashboard";
const AdminDashboard = lazy(() => import("./admin/AdminDashboard"));
const YoutubeGate = lazy(() => import("./user/auth/YoutubeGate"));
const FacebookGate = lazy(() => import("./user/auth/FacebookGate"));
const TelegramGate = lazy(() => import("./user/auth/TelegramGate"));
const MagicCaseTracker = lazy(() => import("./user/cases/MagicCaseTracker"));

interface UserProfile {
  id?: number;
  firebaseUid?: string;
  fullName: string;
  email?: string;
  userType: UserRole;
  mobile: string;
  district: string;
  country: string;
  referralCode?: string;
  subscriptionEndDate?: string;
  subscriptionPackage?: string;
  profilePicture?: string;
  aiQuestionsCount?: number;
  lastAiResetDate?: string;
  points?: number;
  displayDataMb?: string;
  estimatedBillTaka?: number;
  chamberAddress?: string;
  officeHours?: string;
  barAssociation?: string;
  membershipId?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  policeStation?: string;
  trustScore?: number;
  warningsCount?: number;
  redBallsCount?: number;
  isSuspended?: boolean;
  suspensionReason?: string;
  isAdvertiser?: boolean;
}

import { fetchWithAuth } from "./lib/api";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(() => {
    return safeGetJson<UserProfile | null>("appUser", null);
  });
  const userRef = useRef<UserProfile | null>(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const [youtubeCompleted, setYoutubeCompleted] = useState(() => {
    return localStorage.getItem("youtubeVerifiedCompleted") === "true";
  });
  const [facebookCompleted, setFacebookCompleted] = useState(() => {
    return localStorage.getItem("facebookVerifiedCompleted") === "true";
  });
  const [telegramCompleted, setTelegramCompleted] = useState(() => {
    return localStorage.getItem("telegramVerifiedCompleted") === "true";
  });

  const [showFacebookGate, setShowFacebookGate] = useState(() => {
    return localStorage.getItem("facebookVerifiedCompleted") !== "true";
  });

  const [showTelegramGate, setShowTelegramGate] = useState(() => {
    return localStorage.getItem("telegramVerifiedCompleted") !== "true";
  });

  const isTrackingRoute = typeof window !== "undefined" && (
    window.location.pathname.startsWith("/track") ||
    window.location.pathname.startsWith("/case/") ||
    new URLSearchParams(window.location.search).has("track") ||
    new URLSearchParams(window.location.search).has("caseId") ||
    new URLSearchParams(window.location.search).has("case")
  );

  const initialTrackId = (() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get("track") || params.get("caseId") || params.get("case") || params.get("id");
    if (paramId) return paramId;
    if (window.location.pathname.startsWith("/track/")) {
      const part = window.location.pathname.replace(/^\/track\//, "").split("/")[0];
      if (part) return decodeURIComponent(part);
    }
    if (window.location.pathname.startsWith("/case/")) {
      const part = window.location.pathname.replace(/^\/case\//, "").split("/")[0];
      if (part) return decodeURIComponent(part);
    }
    return null;
  })();

  const [isTrackingScreen, setIsTrackingScreen] = useState<boolean>(isTrackingRoute);
  const [trackCaseId, setTrackCaseId] = useState<string | null>(initialTrackId);

  // If user visits /register or /join while logged in, show an account switcher notice
  const [visitedReferralWhileLoggedIn, setVisitedReferralWhileLoggedIn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const isRegPath = window.location.pathname.includes('/register') || window.location.pathname.includes('/join') || window.location.pathname.includes('/signup');
    const hasRef = new URLSearchParams(window.location.search).has('ref');
    return (isRegPath || hasRef) && !!safeGetJson("appUser", null);
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref") || urlParams.get("referral") || urlParams.get("referredBy") || urlParams.get("referred_by");
    if (refCode) {
      localStorage.setItem("pending_referral_code", refCode.trim());
      sessionStorage.setItem("pending_referral_code", refCode.trim());
    }

    if (urlParams.get("payment") === "success") {
      alert("পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!");
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Auto-login from WhatsApp Magic Link
    const magicAuth = urlParams.get("magicAuth") === "1" || (urlParams.get("role") === "client" && (urlParams.get("phone") || urlParams.get("track")));
    const phone = urlParams.get("phone");
    const name = urlParams.get("name");
    const trackParam = urlParams.get("track") || urlParams.get("caseId") || urlParams.get("case");

    if (magicAuth && phone) {
      let cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('880')) {
        cleanPhone = '0' + cleanPhone.substring(3);
      } else if (cleanPhone.startsWith('88') && cleanPhone.length === 13) {
        cleanPhone = '0' + cleanPhone.substring(2);
      }

      if (cleanPhone.length >= 6) {
        const clientName = name ? decodeURIComponent(name) : 'মক্কেল (ক্লায়েন্ট)';
        const viewMode = urlParams.get("view");
        
        // Auto-provision client user profile with instant access
        const clientUser: UserProfile = {
          id: Date.now(),
          fullName: clientName,
          mobile: cleanPhone,
          userType: 'client',
          district: 'ঢাকা',
          country: 'বাংলাদেশ',
          points: 50,
          trustScore: 100
        };

        // Bypass all social gates for direct magic link clients
        localStorage.setItem("appUser", JSON.stringify(clientUser));
        localStorage.setItem("youtubeVerifiedCompleted", "true");
        localStorage.setItem("facebookVerifiedCompleted", "true");
        localStorage.setItem("telegramVerifiedCompleted", "true");
        setYoutubeCompleted(true);
        setFacebookCompleted(true);
        setTelegramCompleted(true);
        setShowFacebookGate(false);
        setShowTelegramGate(false);
        setUser(clientUser);

        if (trackParam) {
          localStorage.setItem("pending_claim_case", String(trackParam));
          if (viewMode === 'dashboard') {
            setTrackCaseId(null);
          } else {
            setTrackCaseId(trackParam);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setAuthReady(true);

      const currentUser = userRef.current;
      if (fbUser) {
        // If we have a Firebase user but no local app user, attempt to sync/restore
        if (!currentUser) {
          console.log("[App] Firebase session found, restoring user profile...");
          try {
            const pendingRef = localStorage.getItem("pending_referral_code") || sessionStorage.getItem("pending_referral_code") || undefined;
            const response = await fetchWithAuth("/api/auth/firebase-sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                firebaseUid: fbUser.uid,
                email: fbUser.email,
                mobile: fbUser.phoneNumber,
                fullName: fbUser.displayName,
                profilePicture: fbUser.photoURL,
                userType: sessionStorage.getItem("registrationUserType") || undefined,
                referredBy: pendingRef
              }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                console.log("[App] Session restored successfully");
                setUser({
                  ...data.user,
                  referralCode: data.user.referralCode || data.user.referral_code || ''
                });
              }
            }
          } catch (err) {
            console.error("[App] Failed to restore session:", err);
          }
        }
      } else {
        // If there is no active Firebase session, but we have a client state with firebaseUid,
        // only clear local user if online and not during a temporary offline state
        if (currentUser && currentUser.firebaseUid && (typeof navigator === 'undefined' || navigator.onLine)) {
          console.log("[App] No active Firebase session, logging out local user...");
          safeRemoveItem("appUser");
          setUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && user.email && user.email.toLowerCase() === 'mdcdairy.official@gmail.com' && user.userType !== 'super_admin') {
      const updatedUser = { ...user, userType: 'super_admin' as const };
      setUser(updatedUser);
      safeSetJson("appUser", updatedUser);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      safeSetJson("appUser", user);
    } else {
      safeRemoveItem("appUser");
    }
  }, [user]);

  useEffect(() => {
    // Only fetch profile from the backend if they have an active Firebase session.
    // If user.firebaseUid is missing, they are in developer/bypass mode, so we skip backend sync.
    if (user?.id && user?.firebaseUid && authReady) {
      if (!auth.currentUser) {
        console.warn("[App] authReady is true but auth.currentUser is null. Skipping profile fetch.");
        return;
      }

      const fetchProfile = async (retryCount = 0) => {
        if (!navigator.onLine) return;

        try {
          const res = await fetchWithAuth(`/api/users/${user.id}`);
          if (res.status === 401 || res.status === 404) {
            // Only logout if there is no active Firebase auth session
            if (!auth.currentUser) {
              console.warn(`[App] Profile fetch returned ${res.status} and no active Firebase auth session. Logging out local user...`);
              localStorage.removeItem("appUser");
              setUser(null);
              return;
            }
            console.warn(`[App] Profile fetch returned ${res.status}, keeping active session.`);
            return;
          }
          if (!res.ok) throw new Error(`Status: ${res.status}`);

          const data = await res.json();
          if (data) {
            let updated = false;
            const newProfile = { ...user };

            // ... (rest of the profile update logic remains the same)

            // (Re-stating logic for conciseness)
            if (data.firebaseUid && data.firebaseUid !== user.firebaseUid) {
              newProfile.firebaseUid = data.firebaseUid;
              updated = true;
            }
            if (data.userType && data.userType !== user.userType) {
              newProfile.userType = data.userType;
              updated = true;
            }
            if (data.subscriptionEndDate !== user.subscriptionEndDate) {
              newProfile.subscriptionEndDate = data.subscriptionEndDate;
              updated = true;
            }
            if (data.subscriptionPackage !== user.subscriptionPackage) {
              newProfile.subscriptionPackage = data.subscriptionPackage;
              updated = true;
            }
            if (data.profilePicture !== user.profilePicture) {
              newProfile.profilePicture = data.profilePicture;
              updated = true;
            }
            if (data.fullName && data.fullName !== user.fullName) {
              newProfile.fullName = data.fullName;
              updated = true;
            }
            if (data.mobile && data.mobile !== user.mobile) {
              newProfile.mobile = data.mobile;
              updated = true;
            }
            if (data.district && data.district !== user.district) {
              newProfile.district = data.district;
              updated = true;
            }
            if (
              data.policeStation &&
              data.policeStation !== user.policeStation
            ) {
              newProfile.policeStation = data.policeStation;
              updated = true;
            }
            if (data.aiQuestionsCount !== user.aiQuestionsCount) {
              newProfile.aiQuestionsCount = data.aiQuestionsCount;
              updated = true;
            }
            if (data.lastAiResetDate !== user.lastAiResetDate) {
              newProfile.lastAiResetDate = data.lastAiResetDate;
              updated = true;
            }
            if (
              data.display_data_mb &&
              data.display_data_mb !== user.displayDataMb
            ) {
              newProfile.displayDataMb = data.display_data_mb;
              updated = true;
            }
            if (
              data.estimated_bill_taka &&
              data.estimated_bill_taka !== user.estimatedBillTaka
            ) {
              newProfile.estimatedBillTaka = data.estimated_bill_taka;
              updated = true;
            }
            if (
              data.trustScore !== undefined &&
              data.trustScore !== user.trustScore
            ) {
              newProfile.trustScore = data.trustScore;
              updated = true;
            }
            if (
              data.warningsCount !== undefined &&
              data.warningsCount !== user.warningsCount
            ) {
              newProfile.warningsCount = data.warningsCount;
              updated = true;
            }
            if (
              data.redBallsCount !== undefined &&
              data.redBallsCount !== user.redBallsCount
            ) {
              newProfile.redBallsCount = data.redBallsCount;
              updated = true;
            }
            if (
              data.isSuspended !== undefined &&
              data.isSuspended !== user.isSuspended
            ) {
              newProfile.isSuspended = data.isSuspended;
              updated = true;
            }
            if (
              data.suspensionReason !== undefined &&
              data.suspensionReason !== user.suspensionReason
            ) {
              newProfile.suspensionReason = data.suspensionReason;
              updated = true;
            }
            if (
              data.isAdvertiser !== undefined &&
              data.isAdvertiser !== user.isAdvertiser
            ) {
              newProfile.isAdvertiser = data.isAdvertiser;
              updated = true;
            } else if (
              data.is_advertiser !== undefined &&
              data.is_advertiser !== user.isAdvertiser
            ) {
              newProfile.isAdvertiser = data.is_advertiser;
              updated = true;
            }

            if (updated) {
              setUser(newProfile);
            }
          }
        } catch (err) {
          console.error(
            `Attempt ${retryCount + 1}: Failed to fetch user profile:`,
            err,
          );
          if (retryCount < 2) {
            setTimeout(() => fetchProfile(retryCount + 1), 2000);
          }
        }
      };

      fetchProfile();
    }
  }, [user?.id, authReady]);

  useEffect(() => {
    if (!authReady || !auth.currentUser || !user || !user.firebaseUid) return;

    // Real-time synchronization of user's core attributes (Trust style & suspension triggers)
    const q = query(collection(db, "users"), where("firebase_uid", "==", user.firebaseUid));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const snapshot = querySnapshot.docs[0];
          const data = snapshot.data();
          setUser((prev) => {
            if (!prev) return null;

            let updated = false;
            const newProfile = { ...prev };

            const fieldsToSync = {
              fullName: data.name,
              email: data.email,
              mobile: data.mobile,
              userType: data.user_type,
              district: data.district,
              country: data.country,
              referralCode: data.referral_code,
              subscriptionEndDate: data.subscription_end_date,
              subscriptionPackage: data.subscription_package,
              profilePicture: data.profile_picture,
              aiQuestionsCount: data.ai_questions_count,
              lastAiResetDate: data.last_ai_reset_date,
              points: data.points,
              trustScore:
                data.trust_score !== undefined ? data.trust_score : 100,
              warningsCount:
                data.warnings_count !== undefined ? data.warnings_count : 0,
              redBallsCount:
                data.red_balls_count !== undefined ? data.red_balls_count : 0,
              isSuspended: data.is_suspended || false,
              suspensionReason: data.suspension_reason || "",
              isAdvertiser: data.is_advertiser || data.isAdvertiser || false,
            };

            Object.entries(fieldsToSync).forEach(([key, value]) => {
              if (value !== undefined && value !== (prev as any)[key]) {
                (newProfile as any)[key] = value;
                updated = true;
              }
            });

            if (updated) {
              safeSetJson("appUser", newProfile);
              return newProfile;
            }
            return prev;
          });
        }
      },
      (err: any) => {
        if (err?.message?.includes("Quota exceeded") || err?.code === "resource-exhausted") {
          console.warn("[App] Firestore quota exceeded in onSnapshot listener, continuing with cached session.");
        } else {
          console.warn("[App] Users query onSnapshot offline notice:", err?.message || err);
        }
      },
    );

    return () => unsubscribe();
  }, [user?.firebaseUid, authReady]);


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const trackParam = urlParams.get("track") || urlParams.get("caseId") || urlParams.get("case");
    if (trackParam && (location.pathname === "/" || location.pathname === "/login")) {
      navigate(`/track?track=${encodeURIComponent(trackParam)}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleAuthSuccess = (profile: UserProfile) => {
    setUser(profile);
    safeSetJson("appUser", profile);
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Firebase signOut failed:", e);
    }
    setUser(null);
    safeRemoveItem("appUser");
    navigate("/login");
  };

  const handleUpdateProfile = (updatedProfile: Partial<UserProfile>) => {
    if (user) {
      const newProfile = { ...user, ...updatedProfile };
      setUser(newProfile);
    }
  };

  return (
    <ErrorBoundary>
      <div className="antialiased min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <OfflineNotice />

        <div className="w-full flex-1 flex flex-col">
          <Suspense
            fallback={
              <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-4">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
                <span className="text-slate-400 text-sm font-medium tracking-wide">লোড হচ্ছে...</span>
              </div>
            }
          >
            <Routes>
              {/* Public Landing & Features */}
              <Route
                path="/"
                element={
                  <div className="min-h-screen bg-slate-950 flex flex-col">
                    <PublicNavbar
                      isLoggedIn={!!user}
                      onGoToPortal={() => navigate(user ? "/dashboard" : "/login")}
                    />
                    <main className="flex-1">
                      <LandingPage isLoggedIn={!!user} />
                    </main>
                  </div>
                }
              />
              <Route
                path="/features"
                element={
                  <div className="min-h-screen bg-slate-950 flex flex-col">
                    <PublicNavbar
                      isLoggedIn={!!user}
                      onGoToPortal={() => navigate(user ? "/dashboard" : "/login")}
                    />
                    <main className="flex-1">
                      <LandingPage isLoggedIn={!!user} />
                    </main>
                  </div>
                }
              />

              {/* Public Legal Blog (12 legal awareness articles for public + AdSense) */}
              <Route
                path="/blog"
                element={
                  <div className="min-h-screen bg-slate-950 flex flex-col">
                    <PublicNavbar
                      isLoggedIn={!!user}
                      onGoToPortal={() => navigate(user ? "/dashboard" : "/login")}
                    />
                    <main className="flex-1">
                      <Blog />
                    </main>
                  </div>
                }
              />

              {/* Public Privacy Policy (with Google AdSense cookie disclosure) */}
              <Route
                path="/privacy"
                element={
                  <div className="min-h-screen bg-slate-950 flex flex-col">
                    <PublicNavbar
                      isLoggedIn={!!user}
                      onGoToPortal={() => navigate(user ? "/dashboard" : "/login")}
                    />
                    <main className="flex-1">
                      <LegalPages initialTab="privacy" />
                    </main>
                  </div>
                }
              />

              {/* Public Terms of Service */}
              <Route
                path="/terms"
                element={
                  <div className="min-h-screen bg-slate-950 flex flex-col">
                    <PublicNavbar
                      isLoggedIn={!!user}
                      onGoToPortal={() => navigate(user ? "/dashboard" : "/login")}
                    />
                    <main className="flex-1">
                      <LegalPages initialTab="terms" />
                    </main>
                  </div>
                }
              />

              {/* Public Refund Policy */}
              <Route
                path="/refund"
                element={
                  <div className="min-h-screen bg-slate-950 flex flex-col">
                    <PublicNavbar
                      isLoggedIn={!!user}
                      onGoToPortal={() => navigate(user ? "/dashboard" : "/login")}
                    />
                    <main className="flex-1">
                      <LegalPages initialTab="refund" />
                    </main>
                  </div>
                }
              />

              {/* Public Case Tracker */}
              <Route
                path="/track"
                element={
                  <MagicCaseTrackerWrapper
                    isLoggedIn={!!user}
                    onGoToAuth={() => navigate("/login")}
                    onGoToDashboard={() => navigate("/dashboard")}
                  />
                }
              />
              <Route
                path="/track/:caseId"
                element={
                  <MagicCaseTrackerWrapper
                    isLoggedIn={!!user}
                    onGoToAuth={() => navigate("/login")}
                    onGoToDashboard={() => navigate("/dashboard")}
                  />
                }
              />
              <Route
                path="/case/:caseId"
                element={
                  <MagicCaseTrackerWrapper
                    isLoggedIn={!!user}
                    onGoToAuth={() => navigate("/login")}
                    onGoToDashboard={() => navigate("/dashboard")}
                  />
                }
              />

              {/* Admin Dashboard */}
              <Route
                path="/admin"
                element={
                  <Suspense
                    fallback={
                      <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
                        <span className="text-slate-400 text-sm font-medium tracking-wide">লোড হচ্ছে...</span>
                      </div>
                    }
                  >
                    <AdminDashboard
                      currentUser={{
                        role: user?.userType === "admin" ? "admin" : "client",
                        country: user?.country,
                        district: user?.district,
                      }}
                    />
                  </Suspense>
                }
              />

              {/* Login / Portal Route */}
              <Route
                path="/login"
                element={
                  user ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <div className="min-h-screen bg-slate-950 flex flex-col">
                      <PublicNavbar
                        isLoggedIn={false}
                        onGoToPortal={() => navigate("/login")}
                      />
                      <main className="flex-1">
                        <Auth onAuthSuccess={handleAuthSuccess} />
                      </main>
                    </div>
                  )
                }
              />
              <Route path="/register" element={<Navigate to="/login" replace />} />
              <Route path="/signup" element={<Navigate to="/login" replace />} />
              <Route path="/join" element={<Navigate to="/login" replace />} />

              {/* Protected Dashboards (Lawyer, Mohuri, Client, Advertiser) */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedDashboard
                    user={user}
                    youtubeCompleted={youtubeCompleted}
                    setYoutubeCompleted={setYoutubeCompleted}
                    showFacebookGate={showFacebookGate}
                    setShowFacebookGate={setShowFacebookGate}
                    setFacebookCompleted={setFacebookCompleted}
                    showTelegramGate={showTelegramGate}
                    setShowTelegramGate={setShowTelegramGate}
                    setTelegramCompleted={setTelegramCompleted}
                    visitedReferralWhileLoggedIn={visitedReferralWhileLoggedIn}
                    setVisitedReferralWhileLoggedIn={setVisitedReferralWhileLoggedIn}
                    handleLogout={handleLogout}
                    handleUpdateProfile={handleUpdateProfile}
                  />
                }
              />

              {/* Fallback to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>


      </div>
    </ErrorBoundary>
  );
}

interface ProtectedDashboardProps {
  user: UserProfile | null;
  youtubeCompleted: boolean;
  setYoutubeCompleted: (val: boolean) => void;
  showFacebookGate: boolean;
  setShowFacebookGate: (val: boolean) => void;
  setFacebookCompleted: (val: boolean) => void;
  showTelegramGate: boolean;
  setShowTelegramGate: (val: boolean) => void;
  setTelegramCompleted: (val: boolean) => void;
  visitedReferralWhileLoggedIn: boolean;
  setVisitedReferralWhileLoggedIn: (val: boolean) => void;
  handleLogout: () => void;
  handleUpdateProfile: (p: Partial<UserProfile>) => void;
}

function ProtectedDashboard({
  user,
  youtubeCompleted,
  setYoutubeCompleted,
  showFacebookGate,
  setShowFacebookGate,
  setFacebookCompleted,
  showTelegramGate,
  setShowTelegramGate,
  setTelegramCompleted,
  visitedReferralWhileLoggedIn,
  setVisitedReferralWhileLoggedIn,
  handleLogout,
  handleUpdateProfile,
}: ProtectedDashboardProps) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!youtubeCompleted) {
    return (
      <YoutubeGate
        onComplete={() => {
          localStorage.setItem("youtubeVerifiedCompleted", "true");
          setYoutubeCompleted(true);
        }}
      />
    );
  }

  if (showFacebookGate) {
    return (
      <FacebookGate
        onComplete={() => {
          localStorage.setItem("facebookVerifiedCompleted", "true");
          setFacebookCompleted(true);
          setShowFacebookGate(false);
        }}
      />
    );
  }

  if (showTelegramGate) {
    return (
      <TelegramGate
        onComplete={() => {
          localStorage.setItem("telegramVerifiedCompleted", "true");
          setTelegramCompleted(true);
          setShowTelegramGate(false);
        }}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100">
      {visitedReferralWhileLoggedIn && (
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 border-b border-indigo-500/30 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-lg relative z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              <strong>রেফারেল লিংক ওপেন করা হয়েছে:</strong> আপনি বর্তমানে <strong>{user?.fullName}</strong> হিসেবে সাইন-ইন আছেন। নতুন একাউন্ট রেজিস্টার করতে চাইলে লগআউট করুন।
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-lg font-bold transition-all shadow-sm cursor-pointer"
            >
              লগআউট করে নতুন একাউন্ট খুলুন
            </button>
            <button
              onClick={() => setVisitedReferralWhileLoggedIn(false)}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
      <Dashboard
        userId={user.id}
        firebaseUid={user.firebaseUid}
        userType={user.userType}
        userName={user.fullName}
        userEmail={user.email}
        userMobile={user.mobile}
        userDistrict={user.district}
        userCountry={user.country}
        referralCode={user.referralCode}
        subscriptionEndDate={user.subscriptionEndDate}
        subscriptionPackage={user.subscriptionPackage}
        profilePicture={user.profilePicture}
        aiQuestionsCount={user.aiQuestionsCount}
        lastAiResetDate={user.lastAiResetDate}
        points={user.points}
        displayDataMb={user.displayDataMb}
        estimatedBillTaka={user.estimatedBillTaka}
        chamberAddress={user.chamberAddress}
        officeHours={user.officeHours}
        barAssociation={user.barAssociation}
        membershipId={user.membershipId}
        facebookUrl={user.facebookUrl}
        linkedinUrl={user.linkedinUrl}
        userPoliceStation={user.policeStation}
        trustScore={user.trustScore !== undefined ? user.trustScore : 100}
        warningsCount={user.warningsCount || 0}
        redBallsCount={user.redBallsCount || 0}
        isSuspended={user.isSuspended || false}
        suspensionReason={user.suspensionReason || ""}
        isAdvertiser={user.isAdvertiser || false}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
      />
    </div>
  );
}

function MagicCaseTrackerWrapper({
  isLoggedIn,
  onGoToAuth,
  onGoToDashboard,
}: {
  isLoggedIn: boolean;
  onGoToAuth: () => void;
  onGoToDashboard: () => void;
}) {
  const { caseId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const trackQuery = searchParams.get("track") || searchParams.get("caseId") || searchParams.get("case") || caseId || "";

  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
          <span className="text-slate-400 text-sm font-medium tracking-wide">লোড হচ্ছে...</span>
        </div>
      }
    >
      <MagicCaseTracker
        trackQuery={trackQuery}
        isLoggedIn={isLoggedIn}
        onGoToAuth={onGoToAuth}
        onGoToDashboard={onGoToDashboard}
      />
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
