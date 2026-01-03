import { motion } from 'framer-motion'
import { Activity, MessageCircle, Heart, Clock } from 'lucide-react'
import { useActivityFeed } from '../hooks/useLocalStorage'
import { useAppStore } from '../store/store'

const ActivityItem = ({ activity, index }) => {
  const { setSelectedImage } = useAppStore()
  
  const getActivityIcon = (type) => {
    switch (type) {
      case 'reaction':
        return <Heart className="w-4 h-4 text-red-500" />
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getActivityText = (activity) => {
    try {
      const data = JSON.parse(activity.data || '{}')
      
      switch (activity.type) {
        case 'reaction':
          return `reacted ${data.emoji} to an image`
        case 'comment':
          return `commented: "${data.text}"`
        default:
          return 'performed an action'
      }
    } catch (error) {
      console.error('Error parsing activity data:', error)
      return 'performed an action'
    }
  }

  const handleClick = () => {
    // In a real app, you'd fetch the image data by ID
    // For now, we'll just show a toast
    console.log('Navigate to image:', activity.imageId)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
        style={{ backgroundColor: activity.userColor }}
      >
        {activity.userName.charAt(0)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getActivityIcon(activity.type)}
          <span className="font-medium text-sm text-gray-900 dark:text-white">
            {activity.userName}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
          {getActivityText(activity)}
        </p>
        
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>
            {new Date(activity.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default function Feed() {
  const { activities, loading, error } = useActivityFeed()
  
  console.log('📰 Feed render:', { 
    activitiesCount: activities.length, 
    loading, 
    error: error?.message 
  })

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
          Activity Feed
        </h3>
        <p className="text-red-500 text-sm">Failed to load activity feed</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            Live Activity
          </h3>
          {activities.length > 0 && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs rounded-full">
              {activities.length}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Real-time interactions across all images
        </p>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          </div>
        ) : activities.length > 0 ? (
          <div className="p-3 space-y-1">
            {activities.map((activity, index) => (
              <ActivityItem 
                key={activity.id} 
                activity={activity} 
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              No activity yet
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Start interacting with images to see real-time activity here!
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Live updates</span>
        </div>
      </div>
    </div>
  )
}