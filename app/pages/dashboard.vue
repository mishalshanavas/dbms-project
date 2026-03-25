<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="space-y-1">
      <h1 class="text-xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-sm text-muted-foreground">Your reported items and claims</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
    </div>

    <template v-else>
      <!-- Tabs -->
      <UiTabs
        v-model="activeTab"
        :tabs="[
          { label: 'My Items', value: 'items', count: myItems.length },
          { label: 'My Claims', value: 'claims', count: myClaims.length },
        ]"
      >
        <!-- My Items Tab -->
        <div v-if="activeTab === 'items'">
          <div v-if="myItems.length === 0" class="flex flex-col items-center py-20 text-center">
            <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Package class="h-6 w-6 text-muted-foreground" />
            </div>
            <p class="text-base font-semibold">No items yet</p>
            <p class="mt-1 text-sm text-muted-foreground">Report a lost or found item to get started</p>
            <UiButton size="sm" class="mt-4" @click="navigateTo('/report')">
              <Plus class="h-4 w-4" />
              Report Item
            </UiButton>
          </div>

          <div v-else class="space-y-2">
            <NuxtLink
              v-for="item in myItems"
              :key="item.id"
              :to="`/items/${item.id}`"
              class="flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 hover:bg-accent group"
            >
              <!-- Type indicator -->
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                :class="item.type === 'lost' ? 'bg-lost/10' : 'bg-found/10'"
              >
                <span class="text-[10px] font-bold uppercase"
                  :class="item.type === 'lost' ? 'text-lost' : 'text-found'"
                >{{ item.type === 'lost' ? 'L' : 'F' }}</span>
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-semibold truncate">{{ item.title }}</h3>
                  <UiBadge
                    :variant="item.status === 'open' ? 'secondary' : item.status === 'resolved' ? 'success' : 'outline'"
                    class="shrink-0"
                  >
                    {{ item.status }}
                  </UiBadge>
                </div>
                <div class="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span class="flex items-center gap-1">
                    <MapPin class="h-3 w-3" />
                    {{ item.location }}
                  </span>
                  <span>{{ item.date }}</span>
                  <span class="ml-auto font-medium tabular-nums">{{ Number(item.claimCount) }} claims</span>
                </div>
              </div>

              <ChevronRight class="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
            </NuxtLink>
          </div>
        </div>

        <!-- My Claims Tab -->
        <div v-if="activeTab === 'claims'">
          <div v-if="myClaims.length === 0" class="flex flex-col items-center py-20 text-center">
            <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <MessageSquare class="h-6 w-6 text-muted-foreground" />
            </div>
            <p class="text-base font-semibold">No claims yet</p>
            <p class="mt-1 text-sm text-muted-foreground">Claims you make on items will appear here</p>
          </div>

          <div v-else class="space-y-2">
            <NuxtLink
              v-for="claim in myClaims"
              :key="claim.id"
              :to="`/items/${claim.item?.id}`"
              class="flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 hover:bg-accent group"
            >
              <!-- Status indicator -->
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                :class="claim.status === 'accepted' ? 'bg-success/10' : claim.status === 'rejected' ? 'bg-destructive/10' : 'bg-muted'"
              >
                <Check v-if="claim.status === 'accepted'" class="h-4 w-4 text-success" />
                <X v-else-if="claim.status === 'rejected'" class="h-4 w-4 text-destructive" />
                <Clock v-else class="h-4 w-4 text-muted-foreground" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-semibold truncate">{{ claim.item?.title }}</h3>
                  <UiBadge
                    :variant="claim.status === 'accepted' ? 'success' : claim.status === 'rejected' ? 'destructive' : 'secondary'"
                    class="shrink-0"
                  >
                    {{ claim.status }}
                  </UiBadge>
                </div>
                <p class="text-xs text-muted-foreground line-clamp-1 mt-0.5">{{ claim.message }}</p>
              </div>

              <div class="flex flex-col items-end gap-1 shrink-0">
                <span class="text-[10px] text-muted-foreground">{{ formatDate(claim.createdAt) }}</span>
                <ChevronRight class="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
              </div>
            </NuxtLink>
          </div>
        </div>
      </UiTabs>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Loader2, Package, Plus, MapPin, ChevronRight, MessageSquare, Check, X, Clock } from 'lucide-vue-next'
import type { DashboardClaim, DashboardItem } from '~~/shared/types/items'

definePageMeta({ middleware: 'auth' })

useHead({ title: 'Dashboard — Lost & Found' })

const { toast } = useToast()

const loading = ref(true)
const activeTab = ref('items')
const myItems = ref<DashboardItem[]>([])
const myClaims = ref<DashboardClaim[]>([])

async function fetchDashboard() {
  loading.value = true
  try {
    const data = await $fetch<{ items: DashboardItem[], claims: DashboardClaim[] }>('/api/user/dashboard')
    myItems.value = data.items
    myClaims.value = data.claims
  }
  catch {
    toast({ title: 'Failed to load dashboard', variant: 'destructive' })
  }
  finally {
    loading.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

onMounted(() => fetchDashboard())
</script>
