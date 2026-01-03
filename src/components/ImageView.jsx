import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Download, ExternalLink } from 'lucide-react'
import { useAppStore } from '../store/store'
import { useRealtimeInteractions } from '../hooks/useLocalStorage'
import toast from 'react-hot-toast'

const EmojiPicker = ({ onSelect }) => {
  const emojis = ['❤️', '👍', '🔥', '😍', '🤩', '👏', '💯', '🎉', '😊', '🥰', '✨', '🌟']
  
  return (
    <div className="grid grid-cols-6 gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border">
      {emojis.map(emoji => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="text-2xl hover:scale-125 transition-transform p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

const CommentItem = ({ comment }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
  >
    <div 
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
      style={{ backgroundColor: comment.userColor }}
    >
      {comment.userName.charAt(0)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium text-sm text-gray-900 dark:text-white">
          {comment.userName}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(comment.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
        {comment.text}
      </p>
    </div>
  </motion.div>
)

export default function ImageView({ image, onClose }) {
  // Validate image data
  if (!image || !image.id) {
    console.error('❌ Invalid image data:', image)
    onClose()
    return null
  }

  const { user } = useAppStore()
  const { reactions, comments, addReaction, addComment, loading, error } = useRealtimeInteractions(image.id)
  const [commentText, setCommentText] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const commentInputRef = useRef(null)

  console.log('🖼️ ImageView for:', image.id, '- Comments:', comments.length, '- Reactions:', reactions.length)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleAddReaction = async (emoji) => {
    try {
      console.log('❤️ Attempting to add reaction:', emoji)
      await addReaction(emoji, user)
      setShowEmojiPicker(false)
      toast.success(`Added ${emoji} reaction!`)
      console.log('✅ Reaction added successfully')
    } catch (error) {
      console.error('❌ Failed to add reaction:', error)
      toast.error('Failed to add reaction')
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    
    try {
      console.log('💬 Attempting to add comment:', commentText.trim())
      await addComment(commentText.trim(), user)
      setCommentText('')
      toast.success('Comment added!')
      console.log('✅ Comment added successfully')
    } catch (error) {
      console.error('❌ Failed to add comment:', error)
      toast.error('Failed to add comment')
    }
  }

  const reactionCounts = useMemo(() => {
    return reactions.reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1
      return acc
    }, {})
  }, [reactions])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="max-w-6xl w-full max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
            {/* Image Section */}
            <div className="lg:col-span-2 relative bg-black flex items-center justify-center">
              {image.url ? (
                <img
                  src={image.url}
                  alt={image.alt || 'Gallery image'}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error('❌ Image failed to load:', image.url)
                    e.target.src = image.thumb || 'https://via.placeholder.com/800x600?text=Image+Not+Found'
                  }}
                />
              ) : (
                <div className="text-white text-center">
                  <p>Image not available</p>
                </div>
              )}
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image Actions */}
              <div className="absolute bottom-4 left-4 flex gap-2">
                <a
                  href={image.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <Download className="w-5 h-5" />
                </a>
                <a
                  href={image.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Interactions Panel */}
            <div className="flex flex-col h-full max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  {image.alt || 'Gallery Image'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Photo by {image.author}
                </p>
              </div>

              {/* Reactions */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Reactions</h4>
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm transition-colors"
                    >
                      Add Reaction
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute top-full right-0 mt-2 z-10">
                        <EmojiPicker onSelect={handleAddReaction} />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {Object.entries(reactionCounts).map(([emoji, count]) => (
                    <span key={emoji} className="reaction-bubble">
                      {emoji} {count}
                    </span>
                  ))}
                  {Object.keys(reactionCounts).length === 0 && (
                    <p className="text-sm text-gray-500">No reactions yet</p>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-6 pb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Comments ({comments.length})
                  </h4>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 space-y-3">
                  {comments.map(comment => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>

                {/* Comment Form */}
                <form onSubmit={handleAddComment} className="p-6 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        ref={commentInputRef}
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!commentText.trim()}
                        className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}