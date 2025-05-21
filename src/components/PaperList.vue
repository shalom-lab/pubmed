<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <SearchBar @search="onSearch" @sort="onSort" @filter="onFilter" @clear="clearSearch" />

      <div class="mb-4">
        <span class="text-sm text-gray-600">
          Showing {{ filteredPapers.length }} of {{ papers.length }} papers
        </span>
      </div>

      <ul class="bg-white rounded-lg shadow divide-y divide-gray-100">
        <li
          v-for="paper in filteredPapers"
          :key="paper.id"
          class="group py-5 px-4 hover:bg-blue-50 transition cursor-pointer"
        >
          <a
            :href="'https://pubmed.ncbi.nlm.nih.gov/' + paper.id + '/'"
            target="_blank"
            class="block"
          >
            <div class="flex flex-col gap-1">
              <!-- 标题 -->
              <span class="text-lg font-bold text-blue-700 group-hover:underline group-hover:text-blue-900 leading-snug">
                {{ paper.title }}
              </span>
              <!-- 期刊和日期 -->
              <span class="text-sm text-gray-500">
                {{ paper.source }} <span class="mx-1">|</span>
                <span class="text-gray-400">{{ formatDate(paper.pubdate) }}</span>
              </span>
              <!-- 作者 -->
              <span class="text-sm text-gray-700 truncate">
                {{ paper.authors.join(', ') }}
              </span>
              <!-- DOI -->
              <span v-if="paper.doi" class="text-xs text-gray-400">
                DOI: 
                <a
                  :href="'https://doi.org/' + paper.doi.replace(/^doi:/i, '').replace(/^\\s+|\\s+$/g, '')"
                  target="_blank"
                  class="hover:underline hover:text-blue-600"
                >{{ paper.doi }}</a>
              </span>
            </div>
          </a>
        </li>
      </ul>

      <div v-if="filteredPapers.length === 0" class="text-center mt-8">
        <h3 class="text-xl font-semibold text-gray-800">No papers found</h3>
        <p class="text-gray-600 mt-2">Try adjusting your search criteria</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SearchBar from './SearchBar.vue'

const props = defineProps({
  filename: {
    type: String,
    required: true
  }
})

const router = useRouter()
const papers = ref([])
const searchQuery = ref('')
const sortBy = ref('date')
const filterBy = ref('all')

const formatFileName = (fileName) => {
  return fileName.replace('.json', '').replace(/_/g, ' ')
}

const filteredPapers = computed(() => {
  let result = [...papers.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(paper =>
      paper.title.toLowerCase().includes(query) ||
      paper.authors.some(author => author.toLowerCase().includes(query)) ||
      paper.source.toLowerCase().includes(query)
    )
  }

  // Apply date filter
  if (filterBy.value !== 'all') {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getMonth() - 6)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    result = result.filter(paper => {
      const paperDate = new Date(paper.pubdate)
      if (filterBy.value === 'recent') {
        return paperDate >= sixMonthsAgo
      } else if (filterBy.value === 'year') {
        return paperDate >= yearStart
      }
      return true
    })
  }

  // Apply sorting
  result.sort((a, b) => {
    if (sortBy.value === 'date') {
      return new Date(b.pubdate) - new Date(a.pubdate)
    } else if (sortBy.value === 'title') {
      return a.title.localeCompare(b.title)
    } else if (sortBy.value === 'authors') {
      return a.authors[0].localeCompare(b.authors[0])
    }
    return 0
  })

  return result
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
  try {
    const response = await fetch(`/${props.filename}`)
    papers.value = await response.json()
  } catch (error) {
    console.error('Error loading papers:', error)
    papers.value = []
  }
}

watch(() => props.filename, loadPapers, { immediate: true })

function formatDate(dateStr) {
  if (!dateStr) return ''
  // 兼容只有年份或年月的情况
  const parts = dateStr.split(/[- /.]/)
  const year = parts[0]
  const month = parts[1] ? parts[1].padStart(2, '0') : '01'
  const day = parts[2] ? parts[2].padStart(2, '0') : '01'
  return `${year}-${month}-${day}`
}
</script>

<style>
/* No changes to style section */
</style>