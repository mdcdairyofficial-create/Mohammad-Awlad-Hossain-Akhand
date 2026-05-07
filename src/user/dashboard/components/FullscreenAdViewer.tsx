import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Timer, Award, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { auth, db } from '../../../firebase';
import { collection, query, where, limit, getDocs, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

import { Campaign } from '../types';

interface FullscreenAdViewerProps {
  language: 'bn' | 'en' | 'hi' | 'ur';
  userType: string;
  onClose: () => void;
  onPointsEarned: (points: number) => void;
}

export const FullscreenAdViewer = ({ language, userType, onClose, onPointsEarned }: FullscreenAdViewerProps) => {
  const [ad, setAd] = useState<Campaign | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const bn = language === 'bn';
  const t = (bnText: string, enText: string) => bn ? bnText : enText;

  useEffect(() => {
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 5000); // 5 seconds before skip option appears

    return () => clearTimeout(skipTimer);
  }, []);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const q = query(
          collection(db, 'campaigns'),
          where('status', '==', 'active'),
          where('targetRoles', 'array-contains', userType),
          limit(1)
        );
        
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const adData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Campaign;
          setAd(adData);
          const duration = adData.duration || 15;
          setTimeLeft(duration);
          setPoints(Math.floor(duration / 5));
        } else {
          // No active ads targeting this user role
          onClose();
        }
      } catch (error) {
        console.error('Error fetching ad:', error);
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchAd();
  }, [userType]);

  useEffect(() => {
    if (!isLoading && ad && timeLeft > 0 && isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading, ad, timeLeft, isPlaying]);

  const handleComplete = async () => {
    if (isCompleted) return;
    setIsCompleted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    if (auth.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          points: increment(points),
          updatedAt: serverTimestamp()
        });
        onPointsEarned(points);
      } catch (error) {
        console.error('Error updating points:', error);
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (isLoading) return null;
  if (!ad) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center">
        {/* Ad Content */}
        <div className="relative w-full h-full max-w-4xl mx-auto overflow-hidden bg-slate-900 group">
          {ad.adMediaType === 'video' ? (
            <video
              ref={videoRef}
              src={ad.adMediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              muted={isMuted}
              playsInline
              onEnded={handleComplete}
            />
          ) : (
            <img 
              src={ad.adMediaUrl} 
              className="w-full h-full object-contain"
              alt={ad.adTitle}
            />
          )}

          {/* Overlays */}
          <div className="absolute top-0 left-0 right-0 p-6 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Timer size={24} className={isPlaying && !isCompleted ? 'animate-pulse' : ''} />
              </div>
              <div className="text-white">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Time Left</p>
                <p className="text-xl font-black">{timeLeft}s</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-2">
                <Award className="text-amber-400" size={18} />
                <span className="text-white font-black text-xs uppercase tracking-widest">
                  {points} Points
                </span>
              </div>
              {!isCompleted ? (
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 bg-rose-600/20 text-rose-500 border border-rose-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                    {t('দেখা হচ্ছে...', 'Watching...')}
                  </div>
                  {canSkip && (
                    <button 
                      onClick={onClose}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      {t('স্কিপ', 'Skip')}
                    </button>
                  )}
                </div>
              ) : (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={onClose}
                  className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-xl active:scale-95"
                >
                  <X size={20} />
                </motion.button>
              )}
            </div>
          </div>

          {/* Video Controls */}
          {ad.adMediaType === 'video' && !isCompleted && (
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={togglePlay}
                className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all"
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
            </div>
          )}

          {/* Ad Info */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <h2 className="text-white text-2xl font-black uppercase tracking-tight mb-2">{ad.adTitle}</h2>
            <p className="text-slate-300 text-sm font-medium max-w-2xl line-clamp-2">{ad.adDescription}</p>
            {ad.fbLink && (
              <a 
                href={ad.fbLink} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg"
              >
                Visit Link
              </a>
            )}
          </div>

          {/* Point Earned Animation */}
          <AnimatePresence>
            {isCompleted && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
              >
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-center border-4 border-amber-400">
                  <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Award size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-indigo-950 dark:text-white uppercase tracking-tight mb-1">
                    {t('অভিনন্দন!', 'CONGRATULATIONS!')}
                  </h3>
                  <p className="text-slate-500 font-bold text-sm tracking-widest uppercase mb-6">
                    {t(`আপনি ${points} পয়েন্ট পেয়েছেন`, `YOU EARNED ${points} POINTS`)}
                  </p>
                  <button 
                    onClick={onClose}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
                  >
                    {t('ঠিক আছে', 'GOT IT')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AnimatePresence>
  );
};
