<template>
  <div class="space-y-5">
    <!-- Search bar — prominent, OLX-style -->
    <div class="relative">
      <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <UiInput
        v-model="searchQuery"
        placeholder="Search for items..."
        class="h-12 pl-10 text-base rounded-xl"
      />
    </div>

    <!-- Horizontal scrollable filter chips -->
    <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
      <!-- Type chips -->
      <button
        v-for="t in typeOptions"
        :key="t.value"
        class="shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer"
        :class="activeType === t.value
          ? 'bg-foreground text-background border-foreground'
          : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'"
        @click="setType(t.value)"
      >
        {{ t.label }}
      </button>

      <div class="h-5 w-px shrink-0 bg-border" />

      <!-- Category chips -->
      <button
        v-for="cat in allCategoryChips"
        :key="cat.value"
        class="shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer"
        :class="activeCategory === cat.value
          ? 'bg-foreground text-background border-foreground'
          : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'"
        @click="setCategory(cat.value)"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      <div v-for="i in 8" :key="i" class="rounded-xl border overflow-hidden">
        <div class="aspect-[4/3] img-skeleton" />
        <div class="p-3 space-y-2">
          <div class="h-3 w-3/4 rounded bg-muted" />
          <div class="h-2.5 w-1/2 rounded bg-muted" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="itemsList.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Package class="h-7 w-7 text-muted-foreground" />
      </div>
      <p class="text-base font-semibold">No items found</p>
      <p class="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
      <UiButton size="sm" class="mt-4" @click="navigateTo('/report')">
        <Plus class="h-4 w-4" />
        Report Item
      </UiButton>
    </div>

    <!-- Items grid — OLX-style compact cards -->
    <div v-else class="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      <NuxtLink
        v-for="item in itemsList"
        :key="item.id"
        :to="`/items/${item.id}`"
        class="group"
      >
        <div class="rounded-xl border bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <!-- Image -->
          <div class="relative aspect-[4/3] bg-muted overflow-hidden">
            <img
              v-if="item.hasImage"
              :src="`/api/items/${item.id}/image`"
              :alt="item.title"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div v-else class="flex h-full w-full items-center justify-center">
              <Package class="h-8 w-8 text-muted-foreground/30" />
            </div>
            <!-- Type badge overlay -->
            <span
              class="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              :class="item.type === 'lost'
                ? 'bg-lost/90 text-white'
                : 'bg-found/90 text-white'"
            >
              {{ item.type }}
            </span>
            <!-- Reward indicator -->
            <span v-if="item.reward" class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-warning/90">
              <Gift class="h-3 w-3 text-white" />
            </span>
          </div>

          <!-- Content -->
          <div class="p-3 space-y-1.5">
            <h3 class="text-sm font-semibold leading-tight line-clamp-1">{{ item.title }}</h3>
            <p class="text-[11px] text-muted-foreground line-clamp-1 flex items-center gap-1">
              <MapPin class="h-3 w-3 shrink-0" />
              {{ item.location?.name || '' }}
            </p>
            <div class="flex items-center justify-between pt-0.5">
              <span class="text-[10px] text-muted-foreground">{{ item.date }}</span>
              <UiAvatar :src="item.user?.avatar || undefined" :alt="item.user?.name" size="sm" class="!h-5 !w-5 !text-[8px]" />
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-3 pt-2">
      <UiButton
        variant="outline"
        size="icon-sm"
        :disabled="pagination.page <= 1"
        @click="goToPage(pagination.page - 1)"
      >
        <ChevronLeft class="h-4 w-4" />
      </UiButton>
      <span class="text-xs font-medium text-muted-foreground tabular-nums">
        {{ pagination.page }} / {{ pagination.totalPages }}
      </span>
      <UiButton
        variant="outline"
        size="icon-sm"
        :disabled="pagination.page >= pagination.totalPages"
        @click="goToPage(pagination.page + 1)"
      >
        <ChevronRight class="h-4 w-4" />
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, Plus, MapPin, Gift, Loader2, Package, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { watchDebounced } from '@vueuse/core'
import type { CategorySummary, ItemListEntry } from '~~/shared/types/items'

definePageMeta({ middleware: 'auth' })

useHead({ title: 'Feed — Lost & Found' })

const searchQuery = ref('')
const activeType = ref('')
const activeCategory = ref('')
const loading = ref(true)
const itemsList = ref<ItemListEntry[]>([])
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 })
const categoriesList = ref<CategorySummary[]>([])

const typeOptions = [
  { label: 'All', value: '' },
  { label: 'Lost', value: 'lost' },
  { label: 'Found', value: 'found' },
]

const allCategoryChips = computed(() => [
  { label: 'All', value: '' },
  ...categoriesList.value.map((cat) => ({ label: cat.name, value: cat.id })),
])

function setType(t: string) {
  activeType.value = t
  fetchItems()
}

function setCategory(c: string) {
  activeCategory.value = c
  fetchItems()
}

async function fetchItems(page = 1) {
  loading.value = true
  try {
    const params: Record<string, string> = { page: String(page) }
    if (activeType.value) params.type = activeType.value
    if (activeCategory.value) params.categoryId = activeCategory.value
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()

    const data = await $fetch<{ items: ItemListEntry[], pagination: typeof pagination.value }>('/api/items', { params })
    itemsList.value = data.items
    pagination.value = data.pagination
  }
  catch (e) {
    console.error('Failed to fetch items:', e)
  }
  finally {
    loading.value = false
  }
}

function goToPage(page: number) {
  fetchItems(page)
}

async function fetchCategories() {
  try {
    categoriesList.value = await $fetch<CategorySummary[]>('/api/categories')
  }
  catch {
    categoriesList.value = []
  }
}

onMounted(async () => {
  await fetchCategories()
  fetchItems()
})

watchDebounced(searchQuery, () => fetchItems(), { debounce: 350 })
</script>
