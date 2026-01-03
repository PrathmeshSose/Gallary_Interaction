import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Eye } from 'lucide-react'
import { fetchImages } from '../utils/unsplash'
import { useAppStore } from '../store/store'
import { useRealtimeInteractions } from '../hooks/useLocalStorage'

const ImageCard = ({ image, index }) => {
  const { setSelectedImage, user } = useAppStore()
  const { reactions, addReaction } = useRealtimeInteractions(image.id)
  
  const reactionCounts = useMemo(() => {
    const counts = {}
    reactions.forEach(r => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1
    })
    return counts
  }, [reactions])

  const handleImageClick = useCallback(() => {
    console.log('🖼️ Image clicked:', image.id, image)
    if (image && image.id) {
      setSelectedImage(image)
    }
  }, [image, setSelectedImage])

  const handleQuickReaction = useCallback((emoji, e) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('❤️ Quick reaction clicked:', emoji)
    addReaction(emoji, user)
  }, [addReaction, user])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="relative overflow-hidden">
        <div 
          className="cursor-pointer"
          onClick={handleImageClick}
        >
          <img
            src={image.thumb}
            alt={image.alt}
            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        
        {/* Hover Overlay - Outside clickable area */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none">
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {['❤️', '👍', '🔥'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={(e) => handleQuickReaction(emoji, e)}
                    className="reaction-bubble hover:scale-110 transition-transform cursor-pointer select-none bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-lg"
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleImageClick()
                }}
                className="flex items-center gap-2 text-white text-sm bg-black/30 px-2 py-1 rounded"
                type="button"
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            by {image.author}
          </span>
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: image.color }}
          />
        </div>

        {/* Reactions Display */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <span key={emoji} className="reaction-bubble text-xs">
                {emoji} {count}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function Gallery() {
  const { moodFilter, viewMode, selectedImage } = useAppStore()
  const [page, setPage] = useState(1)
  const [allImages, setAllImages] = useState([])
  const { ref, inView } = useInView({ threshold: 0 })



  console.log('🖼️ Gallery render - selectedImage:', selectedImage)

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['images', moodFilter, page],
    queryFn: () => {
      console.log('🔄 React Query fetching images for:', { moodFilter, page })
      return fetchImages(page, moodFilter)
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Handle data updates
  useEffect(() => {
    if (data?.images) {
      console.log('✅ Data received:', data.images.length, 'images')
      setAllImages(prev => {
        if (page === 1) {
          return data.images
        } else {
          const existingIds = new Set(prev.map(img => img.id))
          const newImages = data.images.filter(img => !existingIds.has(img.id))
          return [...prev, ...newImages]
        }
      })
    }
  }, [data, page])

  // Reset images when mood filter changes
  useEffect(() => {
    setPage(1)
    setAllImages([])
  }, [moodFilter])

  const loadMoreImages = useCallback(() => {
    if (data?.totalPages > page && !isFetching) {
      setPage(prev => prev + 1)
    }
  }, [data?.totalPages, page, isFetching])

  const hasMoreImages = data?.totalPages > page

  if (isLoading && allImages.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Loading Gallery...
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Show mock images if no real images loaded
  if (allImages.length === 0 && !isLoading) {
    const mockImages = Array.from({ length: 12 }, (_, i) => ({
      id: `demo-${i}`,
      url: `https://picsum.photos/800/600?random=${i}`,
      thumb: `https://picsum.photos/400/300?random=${i}`,
      alt: `Demo image ${i + 1}`,
      author: `Photographer ${i + 1}`,
      authorUrl: 'https://unsplash.com',
      downloadUrl: `https://picsum.photos/800/600?random=${i}`,
      mood: moodFilter,
      width: 800,
      height: 600,
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    }))
    
    setAllImages(mockImages)
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load images. Using demo mode.</p>
        <p className="text-sm text-gray-500 mt-2">Error: {error.message}</p>
      </div>
    )
  }

  // Debug info
  console.log('📊 Gallery state:', { 
    allImagesCount: allImages.length, 
    isLoading, 
    hasData: !!data, 
    page, 
    moodFilter 
  })

  return (
    <div className="space-y-6">
      {/* Gallery Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gallery
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({moodFilter === 'all' ? 'All moods' : moodFilter})
          </span>
        </h2>
        <div className="text-sm text-gray-500">
          {allImages.length} of {data?.total || 0} images loaded
        </div>
      </div>

      {/* Images Grid */}
      <div className={`grid gap-4 ${
        viewMode === 'masonry' 
          ? 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4' 
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }`}>
        {allImages.length > 0 ? (
          allImages.map((image, index) => (
            <ImageCard key={image.id} image={image} index={index} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No images to display</p>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasMoreImages && (
        <div className="flex justify-center py-8">
          <button
            onClick={loadMoreImages}
            disabled={isFetching}
            type="button"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isFetching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Loading...
              </>
            ) : (
              <>
                Load More Images
                <span className="text-sm opacity-75">({allImages.length} of {data?.total})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* End Message */}
      {!hasMoreImages && allImages.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            🎉 You've seen all {allImages.length} images in this category!
          </p>
        </div>
      )}
    </div>
  )
}