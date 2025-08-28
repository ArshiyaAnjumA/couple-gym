export interface Couple {
  id: string;
  name?: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface CoupleMember {
  id: string;
  user_id: string;
  couple_id: string;
  role: 'owner' | 'member';
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  joined_at: string;
}

export interface CoupleSettings {
  id: string;
  couple_id: string;
  share_progress_enabled: boolean;
  share_habits_enabled: boolean;
  updated_at: string;
}

export interface CoupleInvite {
  couple_id: string;
  invite_code: string;
  expires_at: string;
}

export interface SharedFeedItem {
  id: string;
  type: 'workout' | 'habit' | 'progress';
  user_name: string;
  content: string;
  created_at: string;
}

export interface CreateCoupleRequest {
  name?: string;
}

export interface UpdateCoupleSettingsRequest {
  share_progress_enabled?: boolean;
  share_habits_enabled?: boolean;
}