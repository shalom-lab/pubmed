<script setup>
import { ref } from 'vue'

const searchQuery = ref('')
const sortBy = ref('date')
const filterBy = ref('all')

const emit = defineEmits(['search', 'sort', 'filter', 'clear'])

const onSearch = () => {
  emit('search', searchQuery.value)
}

const onSort = () => {
  emit('sort', sortBy.value)
}

const onFilter = () => {
  emit('filter', filterBy.value)
}

const clearSearch = () => {
  searchQuery.value = ''
  emit('clear')
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
    <div class="md:col-span-6">
      <div class="flex">
        <input
          type="text"
          class="flex-1 rounded-l-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search papers..."
          v-model="searchQuery"
          @input="onSearch"
        />
        <button
          class="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors"
          @click="clearSearch"
        >
          Clear
        </button>
      </div>
    </div>
    <div class="md:col-span-3">
      <select
        class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        v-model="sortBy"
        @change="onSort"
      >
        <option value="date">Sort by Date</option>
        <option value="title">Sort by Title</option>
        <option value="authors">Sort by Authors</option>
      </select>
    </div>
    <div class="md:col-span-3">
      <select
        class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        v-model="filterBy"
        @change="onFilter"
      >
        <option value="all">All Papers</option>
        <option value="recent">Last 6 Months</option>
        <option value="year">This Year</option>
      </select>
    </div>
  </div>
</template> 