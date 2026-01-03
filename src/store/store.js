import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Generate unique user identity
const generateUser = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
  const adjectives = ['Creative', 'Artistic', 'Vibrant', 'Curious', 'Inspired', 'Dreamy', 'Bold']
  const nouns = ['Explorer', 'Visionary', 'Creator', 'Wanderer', 'Artist', 'Dreamer', 'Pioneer']
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`,
    color: colors[Math.floor(Math.random() * colors.length)],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
  }
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      // User state
      user: generateUser(),
      
      // Theme state
      theme: 'light',
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
      
      // Gallery state
      selectedImage: null,
      setSelectedImage: (image) => set({ selectedImage: image }),
      
      // Filter state (unique feature)
      moodFilter: 'all', // all, nature, urban, people, abstract
      setMoodFilter: (mood) => set({ moodFilter: mood }),
      
      // View mode (unique feature)
      viewMode: 'grid', // grid, masonry, carousel
      setViewMode: (mode) => set({ viewMode: mode }),
      
      // Activity tracking
      recentActivity: [],
      addActivity: (activity) => set((state) => {
        const newActivity = {
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          userId: state.user.id,
          userName: state.user.name,
          userColor: state.user.color,
          type: activity.type,
          imageId: activity.imageId,
          data: JSON.stringify(activity.data)
        }
        
        console.log('📊 Adding activity to feed:', newActivity)
        
        return {
          recentActivity: [
            newActivity,
            ...state.recentActivity.slice(0, 49) // Keep last 50 activities
          ]
        }
      }),
      
      // Interaction state
      interactions: new Map(),
      updateInteraction: (imageId, type, data) => set((state) => {
        const newInteractions = new Map(state.interactions)
        const current = newInteractions.get(imageId) || { reactions: {}, comments: [] }
        
        if (type === 'reaction') {
          current.reactions[data.emoji] = (current.reactions[data.emoji] || 0) + 1
        } else if (type === 'comment') {
          current.comments.push(data)
        }
        
        newInteractions.set(imageId, current)
        return { interactions: newInteractions }
      }),
      
      // Reset user (for testing)
      resetUser: () => set({ user: generateUser() })
    }),
    {
      name: 'fotoowl-gallery-store',
      partialize: (state) => ({ 
        user: state.user, 
        theme: state.theme,
        moodFilter: state.moodFilter,
        viewMode: state.viewMode
      })
    }
  )
)