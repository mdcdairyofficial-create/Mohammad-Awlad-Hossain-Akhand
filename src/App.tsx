/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { onSnapshot, doc } from "firebase/firestore";
import SplashScreen from "./user/auth/SplashScreen";
import Auth from "./user/auth/Auth";
import SocialGate from "./user/auth/SocialGate";
import Dashboard from "./user/dashboard/Dashboard";
import AdminDashboard from "./admin/AdminDashboard";
import ErrorBoundary from "./components/ErrorBoundary";
import { OfflineNotice } from "./components/OfflineNotice";
import type { UserRole } from "./types";

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
}

import { fetchWithAuth } from "./lib/api";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem("appUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [socialCompleted, setSocialCompleted] = useState(() => {
    return localStorage.getItem("socialVerificationCompleted") === "true";
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("payment") === "success") {
      alert("পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!");
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setAuthReady(true);
      
      // If we have a Firebase user but no local app user, attempt to sync/restore
      if (fbUser && !user) {
        console.log("[App] Firebase session found, restoring user profile...");
        try {
          const response = await fetchWithAuth('/api/auth/firebase-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firebaseUid: fbUser.uid,
              email: fbUser.email,
              mobile: fbUser.phoneNumber,
              fullName: fbUser.displayName,
              profilePicture: fbUser.photoURL
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              console.log("[App] Session restored successfully");
              setUser(data.user);
            }
          }
        } catch (err) {
          console.error("[App] Failed to restore session:", err);
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("appUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("appUser");
    }
  }, [user]);

  useEffect(() => {
    if (user?.id && authReady) {
      const fetchProfile = async (retryCount = 0) => {
        if (!navigator.onLine) return;

        try {
          const res = await fetchWithAuth(`/api/users/${user.id}`);
          if (res.status === 404) {
            handleLogout();
            return;
          }
          if (!res.ok) throw new Error(`Status: ${res.status}`);

          const data = await res.json();
          if (data) {
            let updated = false;
            const newProfile = { ...user };
            
            // ... (rest of the profile update logic remains the same)
            
            // (Re-stating logic for conciseness)
            if (data.firebaseUid && data.firebaseUid !== user.firebaseUid) { newProfile.firebaseUid = data.firebaseUid; updated = true; }
            if (data.userType && data.userType !== user.userType) { newProfile.userType = data.userType; updated = true; }
            if (data.subscriptionEndDate !== user.subscriptionEndDate) { newProfile.subscriptionEndDate = data.subscriptionEndDate; updated = true; }
            if (data.subscriptionPackage !== user.subscriptionPackage) { newProfile.subscriptionPackage = data.subscriptionPackage; updated = true; }
            if (data.profilePicture !== user.profilePicture) { newProfile.profilePicture = data.profilePicture; updated = true; }
            if (data.fullName && data.fullName !== user.fullName) { newProfile.fullName = data.fullName; updated = true; }
            if (data.mobile && data.mobile !== user.mobile) { newProfile.mobile = data.mobile; updated = true; }
            if (data.district && data.district !== user.district) { newProfile.district = data.district; updated = true; }
            if (data.policeStation && data.policeStation !== user.policeStation) { newProfile.policeStation = data.policeStation; updated = true; }
            if (data.aiQuestionsCount !== user.aiQuestionsCount) { newProfile.aiQuestionsCount = data.aiQuestionsCount; updated = true; }
            if (data.lastAiResetDate !== user.lastAiResetDate) { newProfile.lastAiResetDate = data.lastAiResetDate; updated = true; }
            if (data.display_data_mb && data.display_data_mb !== user.displayDataMb) { newProfile.displayDataMb = data.display_data_mb; updated = true; }
            if (data.estimated_bill_taka && data.estimated_bill_taka !== user.estimatedBillTaka) { newProfile.estimatedBillTaka = data.estimated_bill_taka; updated = true; }
            if (data.trustScore !== undefined && data.trustScore !== user.trustScore) { newProfile.trustScore = data.trustScore; updated = true; }
            if (data.warningsCount !== undefined && data.warningsCount !== user.warningsCount) { newProfile.warningsCount = data.warningsCount; updated = true; }
            if (data.redBallsCount !== undefined && data.redBallsCount !== user.redBallsCount) { newProfile.redBallsCount = data.redBallsCount; updated = true; }
            if (data.isSuspended !== undefined && data.isSuspended !== user.isSuspended) { newProfile.isSuspended = data.isSuspended; updated = true; }
            if (data.suspensionReason !== undefined && data.suspensionReason !== user.suspensionReason) { newProfile.suspensionReason = data.suspensionReason; updated = true; }

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
    if (!user || !user.firebaseUid) return;
    
    // Real-time synchronization of user's core attributes (Trust style & suspension triggers)
    const userDocRef = doc(db, 'users', user.firebaseUid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUser(prev => {
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
            trustScore: data.trust_score !== undefined ? data.trust_score : 100,
            warningsCount: data.warnings_count !== undefined ? data.warnings_count : 0,
            redBallsCount: data.red_balls_count !== undefined ? data.red_balls_count : 0,
            isSuspended: data.is_suspended || false,
            suspensionReason: data.suspension_reason || '',
          };
          
          Object.entries(fieldsToSync).forEach(([key, value]) => {
            if (value !== undefined && value !== (prev as any)[key]) {
              (newProfile as any)[key] = value;
              updated = true;
            }
          });
          
          if (updated) {
            localStorage.setItem("appUser", JSON.stringify(newProfile));
            return newProfile;
          }
          return prev;
        });
      }
    }, (err) => {
      console.error("[App] Users onSnapshot failed:", err);
    });
    
    return () => unsubscribe();
  }, [user?.firebaseUid]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAuthSuccess = (profile: UserProfile) => {
    setUser(profile);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleUpdateProfile = (updatedProfile: Partial<UserProfile>) => {
    if (user) {
      const newProfile = { ...user, ...updatedProfile };
      setUser(newProfile);
    }
  };

  return (
    <ErrorBoundary>
      <div className="antialiased">
        <OfflineNotice />
        <AnimatePresence mode="wait">
          {showSplash ? (
            <SplashScreen key="splash" />
          ) : window.location.pathname === "/admin" ? (
            <AdminDashboard
              currentUser={{
                role: user?.userType === "admin" ? "admin" : "client",
                country: user?.country,
                district: user?.district,
              }}
            />
          ) : !user ? (
            !socialCompleted ? (
              <SocialGate onComplete={() => setSocialCompleted(true)} />
            ) : (
              <Auth onAuthSuccess={handleAuthSuccess} />
            )
          ) : (
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
              suspensionReason={user.suspensionReason || ''}
              onLogout={handleLogout}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
        </AnimatePresence>

        {/* Demo toggle for authentication - remove in production */}
        {!showSplash && (
          <button
            onClick={() => {
              if (user) handleLogout();
              else {
                const oneYearFromNow = new Date();
                oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                handleAuthSuccess({
                  id: 1,
                  fullName: "ব্যবহারকারী",
                  userType: "lawyer",
                  mobile: "01700000000",
                  district: "ঢাকা",
                  country: "Bangladesh",
                  subscriptionEndDate: oneYearFromNow.toISOString(),
                  subscriptionPackage: "diamond",
                });
              }
            }}
            className="fixed bottom-24 right-4 bg-white/80 backdrop-blur-sm border border-slate-200 text-[10px] px-2 py-1 rounded-md text-slate-400 z-50 opacity-0 hover:opacity-100 transition-opacity"
          >
            {user ? "লগ আউট" : "লগ ইন"}
          </button>
        )}
      </div>
    </ErrorBoundary>
  );
}
