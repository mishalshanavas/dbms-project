<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Package class="h-7 w-7 text-muted-foreground" />
      </div>
      <p class="text-base font-semibold">Item not found</p>
      <p class="mt-1 text-sm text-muted-foreground">This item may have been removed</p>
      <UiButton variant="outline" size="sm" class="mt-4" @click="navigateTo('/')">Back to Feed</UiButton>
    </div>

    <template v-else-if="item">
      <!-- Back button -->
      <button class="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" @click="navigateTo('/')">
        <ArrowLeft class="h-4 w-4" />
        Back
      </button>

      <div class="grid gap-6 lg:grid-cols-5">
        <!-- Main content — left 3 cols -->
        <div class="lg:col-span-3 space-y-5">
          <!-- Hero image -->
          <div v-if="item.image" class="overflow-hidden rounded-xl border bg-muted">
            <img :src="`/api/items/${item.id}/image`" :alt="item.title" class="w-full object-contain max-h-[420px]" />
          </div>

          <!-- Type + Status badges -->
          <div class="flex flex-wrap items-center gap-2">
            <UiBadge :variant="item.type === 'lost' ? 'lost' : 'found'">
              {{ item.type }}
            </UiBadge>
            <UiBadge variant="outline">{{ item.category }}</UiBadge>
            <UiBadge
              :variant="item.status === 'open' ? 'secondary' : item.status === 'resolved' ? 'success' : 'outline'"
            >
              {{ item.status }}
            </UiBadge>
          </div>

          <!-- Title -->
          <h1 class="text-2xl font-bold tracking-tight leading-tight">{{ item.title }}</h1>

          <!-- Meta row -->
          <div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span class="flex items-center gap-1.5">
              <MapPin class="h-4 w-4" />
              {{ item.location }}
            </span>
            <span class="flex items-center gap-1.5">
              <Calendar class="h-4 w-4" />
              {{ item.date }}
            </span>
            <span v-if="item.reward" class="flex items-center gap-1.5 text-warning font-medium">
              <Gift class="h-4 w-4" />
              {{ item.reward }}
            </span>
          </div>

          <!-- Description -->
          <div class="rounded-xl bg-muted/50 p-4">
            <p class="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{{ item.description }}</p>
          </div>

          <!-- Posted by -->
          <div class="flex items-center gap-3 rounded-xl border p-4">
            <UiAvatar :src="item.user?.avatar || undefined" :alt="item.user?.name" size="md" />
            <div class="min-w-0">
              <p class="text-sm font-semibold truncate">{{ item.user?.name }}</p>
              <p class="text-xs text-muted-foreground truncate">{{ item.user?.email }}</p>
            </div>
          </div>
        </div>

        <!-- Sidebar — right 2 cols -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Claim action -->
          <div v-if="canClaim" class="rounded-xl border p-5 space-y-3">
            <h3 class="text-sm font-semibold">Claim this item</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              {{ item.type === 'lost' ? 'Did you find this item? Let the owner know.' : 'Is this your item? Submit a claim.' }}
            </p>
            <UiButton class="w-full" @click="claimDialogOpen = true">
              <MessageSquare class="h-4 w-4" />
              Submit Claim
            </UiButton>
          </div>

          <!-- Already claimed -->
          <div v-if="alreadyClaimed" class="flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/5 p-4">
            <Check class="h-4 w-4 text-success shrink-0" />
            <p class="text-sm text-success font-medium">You've submitted a claim</p>
          </div>

          <!-- Details card -->
          <div class="rounded-xl border p-5 space-y-4">
            <h3 class="text-sm font-semibold">Details</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Claims</span>
                <span class="font-semibold tabular-nums">{{ item.claimCount }}</span>
              </div>
              <div class="h-px bg-border" />
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Status</span>
                <span class="font-semibold capitalize">{{ item.status }}</span>
              </div>
              <div class="h-px bg-border" />
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Posted</span>
                <span class="font-semibold">{{ formatDate(item.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Owner/Admin actions -->
          <template v-if="isOwner || user?.isAdmin">
            <div class="rounded-xl border p-5 space-y-3">
              <h3 class="text-sm font-semibold">Manage</h3>
              <div class="space-y-2">
                <UiButton variant="outline" class="w-full justify-start" @click="showClaims = !showClaims">
                  <Users class="h-4 w-4" />
                  {{ showClaims ? 'Hide' : 'View' }} Claims ({{ item.claimCount }})
                </UiButton>
                <UiButton v-if="item.status === 'open'" variant="outline" class="w-full justify-start" @click="closeItem">
                  <XCircle class="h-4 w-4" />
                  Close Item
                </UiButton>
                <UiButton variant="ghost" class="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5" @click="deleteItem">
                  <Trash2 class="h-4 w-4" />
                  Delete
                </UiButton>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Claims list -->
      <div v-if="showClaims && (isOwner || user?.isAdmin)" class="mt-8 space-y-4">
        <h2 class="text-lg font-bold">Claims</h2>

        <div v-if="claimsLoading" class="flex justify-center py-10">
          <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
        </div>

        <div v-else-if="claimsList.length === 0" class="rounded-xl border py-12 text-center">
          <p class="text-sm text-muted-foreground">No claims yet</p>
        </div>

        <div v-else class="space-y-3">
          <div v-for="claim in claimsList" :key="claim.id" class="rounded-xl border p-4 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-2.5 min-w-0">
                <UiAvatar :src="claim.claimer?.avatar || undefined" :alt="claim.claimer?.name" size="sm" />
                <div class="min-w-0">
                  <p class="text-sm font-semibold truncate">{{ claim.claimer?.name }}</p>
                  <p class="text-xs text-muted-foreground truncate">{{ claim.claimer?.email }}</p>
                </div>
              </div>
              <UiBadge
                :variant="claim.status === 'accepted' ? 'success' : claim.status === 'rejected' ? 'destructive' : 'secondary'"
              >
                {{ claim.status }}
              </UiBadge>
            </div>

            <p class="text-sm leading-relaxed text-foreground/80">{{ claim.message }}</p>
            <p v-if="claim.contactInfo" class="text-xs text-muted-foreground flex items-center gap-1">
              📞 {{ claim.contactInfo }}
            </p>

            <div v-if="claim.status === 'pending'" class="flex gap-2 pt-1">
              <UiButton size="sm" @click="updateClaim(claim.id, 'accepted')">Accept</UiButton>
              <UiButton variant="outline" size="sm" @click="updateClaim(claim.id, 'rejected')">Reject</UiButton>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Claim Dialog -->
    <UiDialog v-model:open="claimDialogOpen" title="Submit a Claim">
      <form class="space-y-4" @submit.prevent="submitClaim">
        <div class="space-y-2">
          <label class="text-sm font-medium">Message</label>
          <UiTextarea
            v-model="claimForm.message"
            placeholder="Describe why you're claiming this item..."
            :rows="4"
            required
          />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">
            Contact info <span class="text-muted-foreground font-normal">(optional)</span>
          </label>
          <UiInput
            v-model="claimForm.contactInfo"
            placeholder="Phone number or where to meet"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <UiButton variant="outline" type="button" @click="claimDialogOpen = false">Cancel</UiButton>
          <UiButton type="submit" :disabled="claimSubmitting">
            <Loader2 v-if="claimSubmitting" class="h-4 w-4 animate-spin" />
            Submit
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft, MapPin, Calendar, Gift, Loader2, Package,
  MessageSquare, Check, Users, XCircle, Trash2,
} from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

const pageTitle = computed(() => item.value?.title ? `${item.value.title} — Lost & Found` : 'Item — Lost & Found')
useHead({ title: pageTitle })

const route = useRoute()
const { user } = useUserSession()
const { toast } = useToast()

const loading = ref(true)
const error = ref(false)
const item = ref<any>(null)
const showClaims = ref(false)
const claimsList = ref<any[]>([])
const claimsLoading = ref(false)
const alreadyClaimed = ref(false)

// Claim form
const claimDialogOpen = ref(false)
const claimSubmitting = ref(false)
const claimForm = reactive({ message: '', contactInfo: '' })

const isOwner = computed(() => item.value?.user?.id === user.value?.id)
const canClaim = computed(() => {
  if (!item.value) return false
  return item.value.status === 'open' && !isOwner.value && !alreadyClaimed.value
})

async function fetchItem() {
  loading.value = true
  try {
    const data = await $fetch<any>(`/api/items/${route.params.id}`)
    item.value = data
    alreadyClaimed.value = data.alreadyClaimed ?? false
  }
  catch {
    error.value = true
  }
  finally {
    loading.value = false
  }
}

async function fetchClaims() {
  claimsLoading.value = true
  try {
    const data = await $fetch<any[]>(`/api/items/${route.params.id}/claims`)
    claimsList.value = data
    alreadyClaimed.value = data.some((c: any) => c.claimer?.id === user.value?.id)
  }
  catch {
    console.error('Failed to fetch claims')
  }
  finally {
    claimsLoading.value = false
  }
}

watch(showClaims, (v) => {
  if (v && claimsList.value.length === 0) fetchClaims()
})

async function submitClaim() {
  if (!claimForm.message.trim()) return
  claimSubmitting.value = true
  try {
    await $fetch(`/api/items/${route.params.id}/claim`, {
      method: 'POST',
      body: { message: claimForm.message.trim(), contactInfo: claimForm.contactInfo.trim() || undefined },
    })
    toast({ title: 'Claim submitted!' })
    claimDialogOpen.value = false
    alreadyClaimed.value = true
    item.value.claimCount++
    claimForm.message = ''
    claimForm.contactInfo = ''
    if (showClaims.value) fetchClaims()
  }
  catch (err: any) {
    toast({ title: err?.data?.message || 'Failed to submit claim', variant: 'destructive' })
  }
  finally {
    claimSubmitting.value = false
  }
}

async function updateClaim(claimId: string, status: 'accepted' | 'rejected') {
  try {
    await $fetch(`/api/items/${route.params.id}/claims/${claimId}`, {
      method: 'PUT',
      body: { status },
    })
    toast({ title: `Claim ${status}` })
    fetchClaims()
    if (status === 'accepted') {
      item.value.status = 'resolved'
    }
  }
  catch (err: any) {
    toast({ title: err?.data?.message || 'Failed to update claim', variant: 'destructive' })
  }
}

async function closeItem() {
  try {
    await $fetch(`/api/items/${route.params.id}`, {
      method: 'PUT',
      body: { status: 'closed' },
    })
    item.value.status = 'closed'
    toast({ title: 'Item closed' })
  }
  catch (err: any) {
    toast({ title: err?.data?.message || 'Failed to close item', variant: 'destructive' })
  }
}

async function deleteItem() {
  if (!confirm('Are you sure you want to delete this item?')) return
  try {
    await $fetch(`/api/items/${route.params.id}`, { method: 'DELETE' })
    toast({ title: 'Item deleted' })
    navigateTo('/')
  }
  catch (err: any) {
    toast({ title: err?.data?.message || 'Failed to delete', variant: 'destructive' })
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => {
  fetchItem()
})
</script>
