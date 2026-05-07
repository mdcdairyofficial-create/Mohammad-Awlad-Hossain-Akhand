export interface Campaign {
  id: string;
  ownerId: string;
  type: string;
  reach?: number;
  validity?: number;
  placements?: string[];
  totalPrice: number;
  location?: string;
  subLocation?: string;
  targetRoles?: string[];
  dailyFrequency?: number;
  duration?: number;
  adTitle?: string;
  adDescription?: string;
  fbLink?: string;
  ytLink?: string;
  otherLink?: string;
  adMediaType?: 'image' | 'video';
  adMediaUrl?: string;
  adMediaPath?: string;
  fbCoverPhotoUrl?: string;
  fbCoverPhotoPath?: string;
  status: 'pending' | 'active' | 'paused' | 'completed';
  paymentMethod?: string;
  paymentStatus: 'pending' | 'completed';
  activatedAt?: any;
  createdAt: any;
  updatedAt?: any;
}

export interface UserProfile {
  points?: number;
  aiQuestionsCount?: number;
  lastAiResetDate?: string;
  lastCheckIn?: any;
  updatedAt?: any;
}
