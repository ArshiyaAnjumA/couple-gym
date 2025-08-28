import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { MMKV } from 'react-native-mmkv';
import { apiService } from '../services/api';
import { Couple, CoupleMember, CoupleSettings, CoupleInvite, SharedFeedItem, CreateCoupleRequest, UpdateCoupleSettingsRequest } from '../types/couple';

const storage = new MMKV();

interface CoupleState {
  couple: Couple | null;
  members: CoupleMember[];
  settings: CoupleSettings | null;
  inviteCode: string | null;
  sharedFeed: SharedFeedItem[];
  isLoading: boolean;
  error: string | null;
}

interface CoupleActions {
  fetchCoupleInfo: () => Promise<void>;
  createCouple: (coupleData: CreateCoupleRequest) => Promise<void>;
  generateInvite: () => Promise<string>;
  acceptInvite: (code: string) => Promise<void>;
  updateSettings: (settings: UpdateCoupleSettingsRequest) => Promise<void>;
  fetchSharedFeed: () => Promise<void>;
  leaveCouple: () => Promise<void>;
  clearError: () => void;
  clearCoupleData: () => void;
}

type CoupleStore = CoupleState & CoupleActions;

export const useCoupleStore = create<CoupleStore>()(
  immer((set, get) => {
    // Load initial state from MMKV
    let initialCouple: Couple | null = null;
    let initialSettings: CoupleSettings | null = null;
    
    try {
      const storedCouple = storage.getString('couple.info');
      if (storedCouple) {
        initialCouple = JSON.parse(storedCouple);
      }
      
      const storedSettings = storage.getString('couple.settings');
      if (storedSettings) {
        initialSettings = JSON.parse(storedSettings);
      }
    } catch (error) {
      console.error('Error loading persisted couple data:', error);
    }

    return {
      // Initial state
      couple: initialCouple,
      members: [],
      settings: initialSettings,
      inviteCode: null,
      sharedFeed: [],
      isLoading: false,
      error: null,

      // Actions
      fetchCoupleInfo: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // First check if user has a couple
          const couples = await apiService.request<Couple[]>('/couples');
          
          if (couples.length > 0) {
            const couple = couples[0]; // User should only be in one couple
            
            // Fetch couple members and settings
            const [members, settings] = await Promise.all([
              apiService.request<CoupleMember[]>(`/couples/${couple.id}/members`),
              apiService.request<CoupleSettings>(`/couples/${couple.id}/settings`),
            ]);

            // Persist to MMKV
            storage.set('couple.info', JSON.stringify(couple));
            storage.set('couple.settings', JSON.stringify(settings));
            
            set((state) => {
              state.couple = couple;
              state.members = members;
              state.settings = settings;
              state.isLoading = false;
            });
          } else {
            set((state) => {
              state.couple = null;
              state.members = [];
              state.settings = null;
              state.isLoading = false;
            });
          }
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to fetch couple info';
            state.isLoading = false;
          });
        }
      },

      createCouple: async (coupleData: CreateCoupleRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const newCouple = await apiService.request<Couple>('/couples', {
            method: 'POST',
            body: JSON.stringify(coupleData),
          });

          // Fetch the complete couple info after creation
          await get().fetchCoupleInfo();
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to create couple';
            state.isLoading = false;
          });
          throw error;
        }
      },

      generateInvite: async () => {
        const { couple } = get();
        if (!couple) {
          throw new Error('No couple found');
        }

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const invite = await apiService.request<CoupleInvite>(`/couples/${couple.id}/invite`, {
            method: 'POST',
          });

          set((state) => {
            state.inviteCode = invite.invite_code;
            state.isLoading = false;
          });

          return invite.invite_code;
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to generate invite';
            state.isLoading = false;
          });
          throw error;
        }
      },

      acceptInvite: async (code: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await apiService.request(`/couples/accept?code=${encodeURIComponent(code)}`, {
            method: 'POST',
          });

          // Fetch the complete couple info after accepting invite
          await get().fetchCoupleInfo();
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to accept invite';
            state.isLoading = false;
          });
          throw error;
        }
      },

      updateSettings: async (settingsData: UpdateCoupleSettingsRequest) => {
        const { couple } = get();
        if (!couple) {
          throw new Error('No couple found');
        }

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const updatedSettings = await apiService.request<CoupleSettings>(`/couples/${couple.id}/settings`, {
            method: 'PATCH',
            body: JSON.stringify(settingsData),
          });

          // Persist to MMKV
          storage.set('couple.settings', JSON.stringify(updatedSettings));

          set((state) => {
            state.settings = updatedSettings;
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to update settings';
            state.isLoading = false;
          });
          throw error;
        }
      },

      fetchSharedFeed: async () => {
        const { couple, settings } = get();
        if (!couple || !settings) return;

        try {
          const feed = await apiService.request<SharedFeedItem[]>(`/couples/${couple.id}/feed`);
          
          set((state) => {
            state.sharedFeed = feed;
          });
        } catch (error: any) {
          console.error('Failed to fetch shared feed:', error);
          // Don't set error state for feed - it's not critical
        }
      },

      leaveCouple: async () => {
        const { couple } = get();
        if (!couple) return;

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await apiService.request(`/couples/${couple.id}/leave`, {
            method: 'POST',
          });

          // Clear couple data
          get().clearCoupleData();
          
          set((state) => {
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to leave couple';
            state.isLoading = false;
          });
          throw error;
        }
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      clearCoupleData: () => {
        storage.delete('couple.info');
        storage.delete('couple.settings');
        
        set((state) => {
          state.couple = null;
          state.members = [];
          state.settings = null;
          state.inviteCode = null;
          state.sharedFeed = [];
        });
      },
    };
  })
);