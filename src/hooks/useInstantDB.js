import { init } from '@instantdb/react'

// Get this from https://instantdb.com/
const APP_ID = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_INSTANTDB_APP_ID) || 
               (typeof process !== 'undefined' && process.env?.VITE_INSTANTDB_APP_ID) || 
               'ceee85d5-7996-484c-962c-b01b9e96bafe'

// Initialize InstantDB
console.log('🔌 Initializing InstantDB with App ID:', APP_ID)
export const db = init({ appId: APP_ID })

// Schema for our real-time data
export const schema = {
  reactions: {
    id: 'string',
    imageId: 'string',
    emoji: 'string',
    userId: 'string',
    userName: 'string',
    userColor: 'string',
    timestamp: 'number'
  },
  comments: {
    id: 'string',
    imageId: 'string',
    text: 'string',
    userId: 'string',
    userName: 'string',
    userColor: 'string',
    timestamp: 'number'
  },
  activities: {
    id: 'string',
    type: 'string', // 'reaction' | 'comment'
    imageId: 'string',
    userId: 'string',
    userName: 'string',
    userColor: 'string',
    data: 'string', // JSON stringified data
    timestamp: 'number'
  }
}

// Custom hook for real-time interactions
export const useRealtimeInteractions = (imageId) => {
  console.log('🔄 Setting up real-time for image:', imageId)
  
  const { data: reactions, error: reactionsError } = db.useQuery({
    reactions: {
      $: {
        where: {
          imageId: imageId
        }
      }
    }
  })

  const { data: comments, error: commentsError } = db.useQuery({
    comments: {
      $: {
        where: {
          imageId: imageId
        },
        order: {
          timestamp: 'desc'
        }
      }
    }
  })

  const addReaction = async (emoji, user) => {
    const now = Date.now()
    const reactionId = `reaction-${now}-${Math.random().toString(36).substr(2, 9)}`
    
    console.log('❤️ Adding reaction:', { emoji, user: user.name, imageId, reactionId })
    
    await db.transact([
      db.tx.reactions[reactionId].update({
        id: reactionId,
        imageId,
        emoji,
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        timestamp: now
      }),
      db.tx.activities[`activity-${now}-${Math.random().toString(36).substr(2, 5)}`].update({
        id: `activity-${now}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'reaction',
        imageId,
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        data: JSON.stringify({ emoji }),
        timestamp: now
      })
    ])
  }

  const addComment = async (text, user) => {
    const now = Date.now()
    const commentId = `comment-${now}-${Math.random().toString(36).substr(2, 9)}`
    
    console.log('💬 Adding comment:', { text: text.substring(0, 20) + '...', user: user.name, imageId, commentId })
    
    try {
      const result = await db.transact([
        db.tx.comments[commentId].update({
          id: commentId,
          imageId,
          text,
          userId: user.id,
          userName: user.name,
          userColor: user.color,
          timestamp: now
        }),
        db.tx.activities[`activity-${now}-${Math.random().toString(36).substr(2, 5)}`].update({
          id: `activity-${now}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'comment',
          imageId,
          userId: user.id,
          userName: user.name,
          userColor: user.color,
          data: JSON.stringify({ text: text.length > 50 ? text.substring(0, 50) + '...' : text }),
          timestamp: now
        })
      ])
      console.log('✅ Comment transaction result:', result)
    } catch (error) {
      console.error('❌ Error adding comment:', error)
      throw error
    }
  }

  return {
    reactions: reactions?.reactions || [],
    comments: comments?.comments || [],
    addReaction,
    addComment,
    loading: !reactions || !comments,
    error: reactionsError || commentsError
  }
}

// Hook for global activity feed
export const useActivityFeed = () => {
  console.log('📰 Setting up activity feed')
  
  const { data, error } = db.useQuery({
    activities: {
      $: {
        order: {
          timestamp: 'desc'
        },
        limit: 50
      }
    }
  })

  console.log('📊 Activity feed data:', data?.activities?.length || 0, 'activities')

  return {
    activities: data?.activities || [],
    loading: !data,
    error
  }
}