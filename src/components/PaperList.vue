<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <SearchBar @search="onSearch" @sort="onSort" @filter="onFilter" @clear="clearSearch" />

      <div class="mb-4">
        <span class="text-sm text-gray-600">
          Showing <span v-if="!loading">{{ Math.min(displayLimit, filteredPapers.length) }} of {{ filteredPapers.length }}</span><span v-else>...</span> papers
        </span>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col justify-center items-center py-24 bg-white rounded-lg shadow">
        <svg class="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-lg text-gray-700 font-medium">Loading papers...</span>
      </div>

      <!-- Paper List -->
      <ul v-else-if="filteredPapers.length > 0" class="bg-white rounded-lg shadow divide-y divide-gray-100">
        <li v-for="paper in displayPapers" :key="paper.id"
          class="group py-5 px-4 hover:bg-blue-50 transition cursor-pointer">
          <a :href="'https://pubmed.ncbi.nlm.nih.gov/' + paper.id + '/'" target="_blank" class="block">
            <div class="flex flex-col gap-1">
              <!-- 标题 -->
              <span
                class="text-lg font-bold text-blue-700 group-hover:underline group-hover:text-blue-900 leading-snug">
                {{ paper.title }}
              </span>
              <!-- 期刊和日期 -->
              <span class="text-sm text-gray-500">
                {{ paper.source }} <span class="mx-1">|</span>
                <span class="text-gray-400">{{ formatDate(paper.epubdate) }}</span>
              </span>
              <!-- 作者 -->
              <span class="text-sm text-gray-700 truncate">
                {{ paper.authors ? paper.authors.join(', ') : '' }}
              </span>
              <!-- DOI -->
              <span v-if="paper.doi">
                DOI: {{ paper.doi }}
              </span>
            </div>
          </a>
        </li>
      </ul>

      <!-- Empty State -->
      <div v-else-if="!loading" class="text-center mt-8 p-12 bg-white rounded-lg shadow">
        <h3 class="text-xl font-semibold text-gray-800">No papers found</h3>
        <p class="text-gray-600 mt-2">Try adjusting your search criteria</p>
      </div>

      <!-- Scroll Target for Infinite Scrolling -->
      <div v-show="!loading && displayLimit < filteredPapers.length" ref="scrollTarget" class="h-20 flex justify-center items-center mt-4 pb-12">
        <div class="animate-pulse flex space-x-2 items-center">
            <div class="h-2 w-2 bg-blue-400 rounded-full"></div>
            <div class="h-2 w-2 bg-blue-400 rounded-full"></div>
            <div class="h-2 w-2 bg-blue-400 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { shallowRef, ref, computed, watch, onMounted, onUnmounted } from 'vue'
import SearchBar from './SearchBar.vue'

const props = defineProps({
  filename: {
    type: String,
    required: true
  }
})

// Use shallowRef for massive arrays to avoid deep Reactivity overhead bridging.
const papers = shallowRef([])
const searchQuery = ref('')
const sortBy = ref('date')
const filterBy = ref('all')
const loading = ref(false)

const displayLimit = ref(50)
const scrollTarget = ref(null)
let observer = null

// Reset limit when sort or filter variables change
watch([searchQuery, sortBy, filterBy], () => {
  displayLimit.value = 50
})

const filteredPapers = computed(() => {
  let result = papers.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(paper =>
      (paper.title && paper.title.toLowerCase().includes(query)) ||
      (paper.authors && paper.authors.some(author => author && author.toLowerCase().includes(query))) ||
      (paper.source && paper.source.toLowerCase().includes(query))
    )
  }

  // Apply date filter
  if (filterBy.value !== 'all') {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).getTime()
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime()

    result = result.filter(paper => {
      const pubTime = paper._pubTime
      if (filterBy.value === 'recent') {
        return pubTime >= sixMonthsAgo
      } else if (filterBy.value === 'year') {
        return pubTime >= yearStart
      }
      return true
    })
  }

  // Create a shallow copy for sorting (sort mutates)
  result = [...result]

  // Apply sorting
  result.sort((a, b) => {
    if (sortBy.value === 'date') {
      return (b._sortTime || 0) - (a._sortTime || 0)
    } else if (sortBy.value === 'title') {
      const tA = a.title || ''
      const tB = b.title || ''
      return tA.localeCompare(tB)
    } else if (sortBy.value === 'authors') {
      const authorA = a.authors && a.authors[0] ? a.authors[0] : ''
      const authorB = b.authors && b.authors[0] ? b.authors[0] : ''
      return authorA.localeCompare(authorB)
    }
    return 0
  })

  return result
})

const displayPapers = computed(() => {
  return filteredPapers.value.slice(0, displayLimit.value)
})

const onSearch = (query) => {
  searchQuery.value = query
}

const onSort = (value) => {
  sortBy.value = value
}

const onFilter = (value) => {
  filterBy.value = value
}

const clearSearch = () => {
  searchQuery.value = ''
}

const loadPapers = async () => {
  if (!props.filename) return
  loading.value = true
  papers.value = [] // Clear previous data
  displayLimit.value = 50 // Reset pagination
  
  try {
    const response = await fetch(import.meta.env.BASE_URL + props.filename)
    const data = await response.json()
    
    // Pre-calculate timestamps for fast filtering/sorting
    papers.value = Object.freeze(data.map(paper => {
      const pubTimeInfo = new Date(paper.pubdate).getTime()
      return {
        ...paper,
        _sortTime: new Date(formatDateForSort(paper.epubdate)).getTime(),
        _pubTime: isNaN(pubTimeInfo) ? 0 : pubTimeInfo
      }
    }))
  } catch (error) {
    console.error('Error loading papers:', error)
    papers.value = []
  } finally {
    loading.value = false
  }
}

watch(() => props.filename, loadPapers, { immediate: true })

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    // If the scroll target is visible and we're not loading, load more items
    if (entries[0].isIntersecting && !loading.value) {
      if (displayLimit.value < filteredPapers.value.length) {
        displayLimit.value += 50
      }
    }
  }, { rootMargin: '400px' })

  if (scrollTarget.value) {
    observer.observe(scrollTarget.value)
  }
})

// Keep watching for scrollTarget in case it re-renders
watch(scrollTarget, (newVal) => {
  if (newVal && observer) {
    observer.observe(newVal)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const monthMap = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
  };
  // 匹配 "YYYY MMM DD"
  const match = dateStr.match(/^(\d{4}) (\w{3}) (\d{1,2})$/);
  if (match) {
    const [, year, mon, day] = match;
    return `${year}-${monthMap[mon] || '01'}-${day.padStart(2, '0')}`;
  }
  return dateStr.replace(/ /g, '-');
}

function formatDateForSort(dateStr) {
  if (!dateStr) return '';
  const monthMap = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
  };
  // "YYYY MMM DD"
  let match = dateStr.match(/^(\d{4}) (\w{3}) (\d{1,2})$/);
  if (match) {
    const [, year, mon, day] = match;
    return `${year}-${monthMap[mon] || '01'}-${day.padStart(2, '0')}`;
  }
  // "YYYY MMM"
  match = dateStr.match(/^(\d{4}) (\w{3})$/);
  if (match) {
    const [, year, mon] = match;
    return `${year}-${monthMap[mon] || '01'}-01`;
  }
  // "YYYY"
  match = dateStr.match(/^(\d{4})$/);
  if (match) {
    return `${match[1]}-01-01`;
  }
  return dateStr.replace(/ /g, '-');
}
</script>

<style>
/* No changes to style section */
</style>