<script setup>
import { ref, onMounted } from 'vue'
import PaperList from '../components/PaperList.vue'

const files = ref([])
const currentFile = ref('')


onMounted(async () => {
  try {
    const response = await fetch(import.meta.env.BASE_URL + 'index.json')
    files.value = await response.json()
    console.log(files.value)
    if (files.value.length > 0) {
      currentFile.value = files.value[0].filename
    }
  } catch (error) {
    console.error('Error loading file list:', error)
  }
})

const selectFile = (file) => {
  console.log(file.filename)
  currentFile.value = file.filename
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-blue-600 text-white shadow-md">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold">PubMed Watcher</h1>
          <!-- 右侧 GitHub 链接 -->
          <a href="https://github.com/shalom-lab/pubmed" target="_blank"
            class="flex items-center gap-1 px-3 py-1 rounded hover:bg-blue-500 transition" title="View on GitHub">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.018.005 2.045.138 3.003.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222v3.293c0 .322.218.694.825.576C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span class="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </nav>
    <div class="container mx-auto px-4 py-8">
      <div class="flex flex-col md:flex-row gap-6">
        <div class="md:w-1/4">
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold mb-4">Topics</h2>
            <ul>
              <li v-for="(file,index) in files" :key="index">
                <button class="w-full text-left px-2 py-1 rounded hover:bg-blue-100"
                  :class="{ 'bg-blue-200 font-bold': currentFile === file.filename }" @click="selectFile(file)">
                  {{ index + 1 }}.{{ file.name }} 
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div class="md:w-3/4">
          <PaperList v-if="currentFile" :filename="currentFile" />
        </div>
      </div>
    </div>
  </div>
</template>