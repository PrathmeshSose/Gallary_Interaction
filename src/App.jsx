import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun, User, Palette, Grid, LayoutGrid } from 'lucide-react'
import { useAppStore } from './store/store'
import Gallery from './components/Gallery'
import Feed from './components/Feed'
import ImageView from './components/ImageView'

function App() {
  const { 
    theme, 
    toggleTheme, 
    user, 
    resetUser, 
    selectedImage, 
    setSelectedImage,
    moodFilter,
    setMoodFilter,
    viewMode,
    setViewMode
  } = useAppStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const moods = [
    { key: 'all', label: 'All', color: 'bg-gray-500' },
    { key: 'nature', label: 'Nature', color: 'bg-green-500' },
    { key: 'urban', label: 'Urban', color: 'bg-blue-500' },
    { key: 'people', label: 'People', color: 'bg-purple-500' },
    { key: 'abstract', label: 'Abstract', color: 'bg-pink-500' },
    { key: 'minimal', label: 'Minimal', color: 'bg-gray-400' },
    { key: 'vibrant', label: 'Vibrant', color: 'bg-orange-500' }
  ]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  FotoOwl Gallery
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Real-time interactions
                </p>
              </div>
            </motion.div>

            {/* Mood Filters */}
            <div className="hidden md:flex items-center gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.key}
                  onClick={() => setMoodFilter(mood.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    moodFilter === mood.key
                      ? `${mood.color} text-white shadow-lg`
                      : 'bg-white/20 text-gray-700 dark:text-gray-300 hover:bg-white/30'
                  }`}
                >
                  {mood.label}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'masonry' : 'grid')}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                {viewMode === 'grid' ? 
                  <LayoutGrid className="w-5 h-5" /> : 
                  <Grid className="w-5 h-5" />
                }
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                {theme === 'dark' ? 
                  <Sun className="w-5 h-5 text-yellow-400" /> : 
                  <Moon className="w-5 h-5 text-gray-700" />
                }
              </button>

              {/* User Avatar */}
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: user.color }}
                >
                  <User className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                  {user.name}
                </span>
                <button
                  onClick={resetUser}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Gallery Section */}
          <div className="lg:col-span-3">
            <Gallery />
          </div>

          {/* Feed Section */}
          <div className="lg:col-span-1">
            <Feed />
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div>
          {console.log('🖼️ Rendering ImageView modal with:', selectedImage)}
          <ImageView 
            image={selectedImage} 
            onClose={() => {
              console.log('🖼️ Closing modal')
              setSelectedImage(null)
            }} 
          />
        </div>
      )}
      {!selectedImage && console.log('🖼️ No selectedImage, modal hidden')}
    </div>
  )
}

export default App