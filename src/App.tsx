/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import SplashScreen from './user/auth/SplashScreen';
import Auth from './user/auth/Auth';
import Dashboard from './user/dashboard/Dashboard';
import AdminDashboard from './admin/AdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';

interface UserProfile {
  id?: number;
  fullName: string;
  email?: string;
  userType: 'lawyer' | 'clerk' | 'client' | 'admin';
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
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('appUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('appUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('appUser');
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      // Fetch latest user profile to keep roles in sync
      fetch(`/api/users/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            let updated = false;
            const newProfile = { ...user };
            
            if (data.userType && data.userType !== user.userType) {
              newProfile.userType = data.userType;
              updated = true;
            }
            
            if (data.subscription_end_date !== user.subscriptionEndDate) {
              newProfile.subscriptionEndDate = data.subscription_end_date;
              updated = true;
            }

            if (data.subscription_package !== user.subscriptionPackage) {
              newProfile.subscriptionPackage = data.subscription_package;
              updated = true;
            }

            if (data.profile_picture !== user.profilePicture) {
              newProfile.profilePicture = data.profile_picture;
              updated = true;
            }

            if (data.ai_questions_count !== user.aiQuestionsCount) {
              newProfile.aiQuestionsCount = data.ai_questions_count;
              updated = true;
            }

            if (data.last_ai_reset_date !== user.lastAiResetDate) {
              newProfile.lastAiResetDate = data.last_ai_reset_date;
              updated = true;
            }
            
            if (updated) {
              setUser(newProfile);
            }
          }
        })
        .catch(err => console.error("Failed to fetch user profile:", err));
    }
  }, [user?.id]);

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
        <AnimatePresence mode="wait">
          {showSplash ? (
            <SplashScreen key="splash" />
          ) : window.location.pathname === '/admin' ? (
            <AdminDashboard currentUser={{ 
              role: user?.userType === 'admin' ? 'admin' : 'client',
              country: user?.country,
              district: user?.district
            }} />
          ) : !user ? (
            <Auth onAuthSuccess={handleAuthSuccess} />
          ) : (
            <Dashboard 
              userId={user.id}
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
                  fullName: 'ব্যবহারকারী', 
                  userType: 'lawyer', 
                  mobile: '01700000000', 
                  district: 'ঢাকা', 
                  country: 'Bangladesh',
                  subscriptionEndDate: oneYearFromNow.toISOString(),
                  subscriptionPackage: 'diamond'
                });
              }
            }}
            className="fixed bottom-24 right-4 bg-white/80 backdrop-blur-sm border border-slate-200 text-[10px] px-2 py-1 rounded-md text-slate-400 z-50 opacity-0 hover:opacity-100 transition-opacity"
          >
            {user ? 'লগ আউট' : 'লগ ইন'}
          </button>
        )}
      </div>
    </ErrorBoundary>
  );
}
