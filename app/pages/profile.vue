<template>
  <div class="mx-auto max-w-lg space-y-6">
    <div class="space-y-1">
      <h1 class="text-xl font-bold tracking-tight">Profile</h1>
      <p class="text-sm text-muted-foreground">Update your contact number for claims</p>
    </div>

    <div class="rounded-xl border p-5 space-y-4">
      <div class="space-y-1">
        <p class="text-xs text-muted-foreground">Signed in as</p>
        <p class="text-sm font-semibold truncate">{{ user?.email }}</p>
      </div>

      <div class="space-y-2">
        <label for="phone" class="text-sm font-medium">Phone</label>
        <UiInput
          id="phone"
          v-model="phone"
          placeholder="Enter your phone number"
          :disabled="loading"
        />
        <p class="text-[11px] text-muted-foreground">Optional. This will be visible to item owners when you submit a claim.</p>
      </div>

      <div class="flex justify-end">
        <UiButton :disabled="loading" @click="savePhone">
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          {{ loading ? 'Saving...' : 'Save' }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

useHead({ title: 'Profile — Losty' })

const { user } = useUserSession()
const { toast } = useToast()

const phone = ref('')
const loading = ref(false)

async function fetchProfile() {
  loading.value = true
  try {
    const data = await $fetch<{ phone: string | null }>('/api/user/me')
    phone.value = data.phone || ''
  }
  catch {
    toast({ title: 'Failed to load profile', variant: 'destructive' })
  }
  finally {
    loading.value = false
  }
}

async function savePhone() {
  loading.value = true
  try {
    const result = await $fetch<{ phone: string | null }>('/api/user/phone', {
      method: 'PUT',
      body: { phone: phone.value },
    })
    phone.value = result.phone || ''
    if (user.value) user.value.phone = phone.value || null
    toast({ title: 'Profile updated' })
  }
  catch (err: any) {
    toast({ title: err?.data?.message || 'Failed to update profile', variant: 'destructive' })
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>
