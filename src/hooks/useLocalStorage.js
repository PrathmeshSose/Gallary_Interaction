// Fallback local storage system for real-time interactions
import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../store/store'

// Simple event emitter for cross-tab communication
class LocalEventEmitter {
  constructor() {
    this.listeners = new Map()
    
    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('gallery-')) {
        const eventType = e.key.replace('gallery-', '')
        const data = JSON.parse(e.newValue || '{}')
        this.emit(eventType, data)
      }
    })
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach(callback => callback(data))
  }

  trigger(event, data) {
    // Store in localStorage for cross-tab sync
    localStorage.setItem(`gallery-${event}`, JSON.stringify(data))
    // Emit locally
    this.emit(event, data)
  }
}

const eventEmitter = new LocalEventEmitter()

// Get data from localStorage
const getStoredData = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

// Store data in localStorage
const setStoredData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data))
}

export const useRealtimeInteractions = (imageId) => {
  const [reactions, setReactions] = useState([])
  const [comments, setComments] = useState([])
  const { addActivity } = useAppStore()

  // Load initial data
  useEffect(() => {
    const storedReactions = getStoredData(`reactions-${imageId}`)
    const storedComments = getStoredData(`comments-${imageId}`)
    
    setReactions(storedReactions)
    setComments(storedComments)
    
    console.log('📦 Loaded from storage:', {
      imageId,
      reactions: storedReactions.length,
      comments: storedComments.length
    })
  }, [imageId])

  // Listen for real-time updates
  useEffect(() => {
    const handleReactionUpdate = (data) => {
      if (data.imageId === imageId) {
        setReactions(prev => {
          const updated = [...prev, data]
          setStoredData(`reactions-${imageId}`, updated)
          return updated
        })
      }
    }

    const handleCommentUpdate = (data) => {
      if (data.imageId === imageId) {
        setComments(prev => {
          const updated = [...prev, data]
          setStoredData(`comments-${imageId}`, updated)
          return updated
        })
      }
    }

    eventEmitter.on('reaction-added', handleReactionUpdate)
    eventEmitter.on('comment-added', handleCommentUpdate)

    return () => {
      eventEmitter.off('reaction-added', handleReactionUpdate)
      eventEmitter.off('comment-added', handleCommentUpdate)
    }
  }, [imageId])

  const addReaction = useCallback((emoji, user) => {
    const reaction = {
      id: `reaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      imageId,
      emoji,
      userId: user.id,
      userName: user.name,
      userColor: user.color,
      timestamp: Date.now()
    }

    setReactions(prev => {
      const updated = [...prev, reaction]
      setStoredData(`reactions-${imageId}`, updated)
      return updated
    })

    addActivity({
      type: 'reaction',
      imageId,
      data: { emoji }
    })
  }, [imageId, addActivity])

  const addComment = useCallback(async (text, user) => {
    const comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      imageId,
      text,
      userId: user.id,
      userName: user.name,
      userColor: user.color,
      timestamp: Date.now()
    }

    console.log('💬 Adding comment:', comment)

    // Add to local state and storage
    setComments(prev => {
      const updated = [comment, ...prev] // New comments at top
      setStoredData(`comments-${imageId}`, updated)
      return updated
    })

    // Trigger cross-tab sync
    eventEmitter.trigger('comment-added', comment)

    // Add to activity feed
    addActivity({
      type: 'comment',
      imageId,
      data: { text: text.length > 50 ? text.substring(0, 50) + '...' : text }
    })

    console.log('✅ Comment added successfully')
  }, [imageId, addActivity])

  return {
    reactions,
    comments,
    addReaction,
    addComment,
    loading: false,
    error: null
  }
}

export const useActivityFeed = () => {
  const { recentActivity } = useAppStore()
  
  return {
    activities: recentActivity,
    loading: false,
    error: null
  }
}