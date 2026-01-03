import axios from 'axios'

// Get this from https://unsplash.com/developers
const UNSPLASH_ACCESS_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_UNSPLASH_ACCESS_KEY) || 
                           (typeof process !== 'undefined' && process.env?.VITE_UNSPLASH_ACCESS_KEY) || 
                           'xxMmqpUgyNqeZiu2CvLkQcEttx04lwbnHWVfCiYFi5I'

const unsplashApi = axios.create({
  baseURL: 'https://api.unsplash.com',
  headers: {
    Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
  }
})

// Mood-based search queries (unique feature)
const MOOD_QUERIES = {
  all: 'photography',
  nature: 'nature landscape',
  urban: 'city architecture',
  people: 'people portrait',
  abstract: 'abstract art',
  minimal: 'minimal clean',
  vibrant: 'colorful vibrant'
}

export const fetchImages = async (page = 1, mood = 'all', perPage = 12) => {
  console.log('🔍 Fetching images:', { page, mood, perPage })
  console.log('🔑 API Key present:', UNSPLASH_ACCESS_KEY !== 'demo-key')
  
  try {
    const query = MOOD_QUERIES[mood] || MOOD_QUERIES.all
    console.log('📝 Search query:', query)
    
    const response = await unsplashApi.get('/search/photos', {
      params: {
        query,
        page,
        per_page: perPage,
        orientation: 'landscape',
        order_by: 'relevant'
      }
    })
    
    console.log('✅ Unsplash API success:', response.data.results.length, 'images')
    
    return {
      images: response.data.results.map(img => ({
        id: img.id,
        url: img.urls.regular,
        thumb: img.urls.small,
        alt: img.alt_description || 'Gallery image',
        author: img.user.name,
        authorUrl: img.user.links.html,
        downloadUrl: img.links.download,
        mood: mood,
        width: img.width,
        height: img.height,
        color: img.color
      })),
      total: response.data.total,
      totalPages: response.data.total_pages
    }
  } catch (error) {
    console.error('❌ Unsplash API Error:', {
      status: error.response?.status,
      message: error.response?.data?.errors || error.message,
      url: error.config?.url
    })
    
    // Return mock data for development
    console.log('🎭 Using fallback mock data (API Error:', error.response?.status, ')')
    return {
      images: Array.from({ length: perPage }, (_, i) => ({
        id: `mock-${page}-${i}`,
        url: `https://picsum.photos/800/600?random=${page * perPage + i}&t=${Date.now()}`,
        thumb: `https://picsum.photos/400/300?random=${page * perPage + i}&t=${Date.now()}`,
        alt: `Beautiful ${mood} image ${i + 1}`,
        author: `Photographer ${i + 1}`,
        authorUrl: 'https://unsplash.com',
        downloadUrl: `https://picsum.photos/800/600?random=${page * perPage + i}`,
        mood: mood,
        width: 800,
        height: 600,
        color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
      })),
      total: 1000,
      totalPages: 84
    }
  }
}

export const searchImages = async (query, page = 1) => {
  try {
    const response = await unsplashApi.get('/search/photos', {
      params: {
        query,
        page,
        per_page: 12
      }
    })
    
    return response.data.results.map(img => ({
      id: img.id,
      url: img.urls.regular,
      thumb: img.urls.small,
      alt: img.alt_description || query,
      author: img.user.name,
      authorUrl: img.user.links.html
    }))
  } catch (error) {
    console.error('Error searching images:', error)
    return []
  }
}