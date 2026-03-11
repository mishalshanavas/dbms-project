<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="space-y-1">
      <h1 class="text-xl font-bold tracking-tight">Admin</h1>
      <p class="text-sm text-muted-foreground">Manage all items and platform activity</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
    </div>

    <template v-else>
      <!-- Stats row -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div v-for="stat in statsCards" :key="stat.label" class="rounded-xl border p-4">
          <p class="text-xs font-medium text-muted-foreground">{{ stat.label }}</p>
          <p class="mt-1 text-2xl font-bold tracking-tight tabular-nums">{{ stat.value }}</p>
        </div>
      </div>

      <!-- Filter chips -->
      <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
        <button
          v-for="s in statusOptions"
          :key="s.value"
          class="shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer"
          :class="activeStatus === s.value
            ? 'bg-foreground text-background border-foreground'
            : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'"
          @click="setStatus(s.value)"
        >
          {{ s.label }}
        </button>
      </div>

      <!-- Items list — mobile-friendly cards instead of table -->
      <div class="space-y-2">
        <div
          v-for="item in itemsList"
          :key="item.id"
          class="flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 hover:bg-accent"
        >
          <!-- Type indicator -->
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            :class="item.type === 'lost' ? 'bg-lost/10' : 'bg-found/10'"
          >
            <span class="text-[10px] font-bold uppercase"
              :class="item.type === 'lost' ? 'text-lost' : 'text-found'"
            >{{ item.type === 'lost' ? 'L' : 'F' }}</span>
          </div>

          <!-- Content -->
          <NuxtLink :to="`/items/${item.id}`" class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold truncate">{{ item.title }}</h3>
              <UiBadge
                :variant="item.status === 'open' ? 'secondary' : item.status === 'resolved' ? 'success' : 'outline'"
                class="shrink-0"
              >
                {{ item.status }}
              </UiBadge>
            </div>
            <div class="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              <span>{{ item.category }}</span>
              <span>·</span>
              <span>{{ item.user?.name?.split(' ')[0] }}</span>
              <span class="ml-auto font-medium tabular-nums">{{ Number(item.claimCount) }}</span>
            </div>
          </NuxtLink>

          <!-- Actions -->
          <UiDropdownMenu :items="getItemActions(item)">
            <template #trigger>
              <button class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-accent transition-colors cursor-pointer">
                <MoreHorizontal class="h-4 w-4 text-muted-foreground" />
              </button>
            </template>
          </UiDropdownMenu>
        </div>
      </div>

      <div v-if="itemsList.length === 0" class="rounded-xl border py-16 text-center">
        <p class="text-sm text-muted-foreground">No items found</p>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-3">
        <UiButton
          variant="outline"
          size="icon-sm"
          :disabled="pagination.page <= 1"
          @click="fetchAdmin(pagination.page - 1)"
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
          @click="fetchAdmin(pagination.page + 1)"
        >
          <ChevronRight class="h-4 w-4" />
        </UiButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  Loader2, MoreHorizontal, ChevronLeft, ChevronRight,
  Eye, CheckCircle, XCircle, Trash2,
} from 'lucide-vue-next'

definePageMeta({ middleware: ['auth', 'admin'] })

useHead({ title: 'Admin — Lost & Found' })

const { toast } = useToast()

const loading = ref(true)
const activeStatus = ref('')
const itemsList = ref<any[]>([])
const stats = ref<any>({})
const pagination = ref({ page: 1, limit: 50, total: 0, totalPages: 0 })

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'Claimed', value: 'claimed' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
]

const statsCards = computed(() => [
  { label: 'Total Items', value: Number(stats.value?.total ?? 0) },
  { label: 'Open', value: Number(stats.value?.open ?? 0) },
  { label: 'Claimed', value: Number(stats.value?.claimed ?? 0) },
  { label: 'Resolved', value: Number(stats.value?.resolved ?? 0) },
])

function setStatus(s: string) {
  activeStatus.value = s
  fetchAdmin()
}

function getItemActions(item: any) {
  const actions: any[] = [
    { label: 'View', icon: Eye, action: () => navigateTo(`/items/${item.id}`) },
  ]

  if (item.status === 'open') {
    actions.push({ label: 'Mark Resolved', icon: CheckCircle, action: () => updateStatus(item.id, 'resolved') })
    actions.push({ label: 'Close', icon: XCircle, action: () => updateStatus(item.id, 'closed') })
  }
  else if (item.status !== 'resolved' && item.status !== 'closed') {
    actions.push({ label: 'Close', icon: XCircle, action: () => updateStatus(item.id, 'closed') })
  }

  actions.push({ separator: true })
  actions.push({ label: 'Delete', icon: Trash2, action: () => deleteItem(item.id) })

  return actions
}

async function fetchAdmin(page = 1) {
  loading.value = true
  try {
    const params: Record<string, string> = { page: String(page) }
    if (activeStatus.value) params.status = activeStatus.value

    const data = await $fetch<any>('/api/admin/items', { params })
    itemsList.value = data.items
    stats.value = data.stats
    pagination.value = data.pagination
  }
  catch {
    toast({ title: 'Failed to load admin data', variant: 'destructive' })
  }
  finally {
    loading.value = false
  }
}

async function updateStatus(id: string, status: string) {
  try {
    await $fetch(`/api/admin/items/${id}`, {
      method: 'PUT',
      body: { status },
    })
    toast({ title: `Item marked as ${status}` })
    fetchAdmin(pagination.value.page)
  }
  catch (err: any) {
    toast({ title: err?.data?.message || 'Failed to update', variant: 'destructive' })
  }
}

async function deleteItem(id: string) {
  if (!confirm('Are you sure? This cannot be undone.')) return
  try {
    await $fetch(`/api/items/${id}`, { method: 'DELETE' })
    toast({ title: 'Item deleted' })
    fetchAdmin(pagination.value.page)
  }
  catch (err: any) {
    toast({ title: err?.data?.message || 'Failed to delete', variant: 'destructive' })
  }
}

onMounted(() => fetchAdmin())
</script>
