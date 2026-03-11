<template>
  <div class="mx-auto max-w-lg space-y-6">
    <!-- Header -->
    <div class="space-y-1">
      <h1 class="text-xl font-bold tracking-tight">Report an Item</h1>
      <p class="text-sm text-muted-foreground">Help the community by reporting what you lost or found</p>
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <!-- Type toggle — large pill style -->
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition-all duration-200 cursor-pointer"
          :class="form.type === 'lost'
            ? 'border-lost bg-lost/5 text-lost'
            : 'border-border text-muted-foreground hover:border-foreground/20'"
          @click="form.type = 'lost'"
        >
          <span class="h-2 w-2 rounded-full" :class="form.type === 'lost' ? 'bg-lost' : 'bg-muted-foreground/30'" />
          I Lost Something
        </button>
        <button
          type="button"
          class="flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition-all duration-200 cursor-pointer"
          :class="form.type === 'found'
            ? 'border-found bg-found/5 text-found'
            : 'border-border text-muted-foreground hover:border-foreground/20'"
          @click="form.type = 'found'"
        >
          <span class="h-2 w-2 rounded-full" :class="form.type === 'found' ? 'bg-found' : 'bg-muted-foreground/30'" />
          I Found Something
        </button>
      </div>

      <!-- Image upload — prominent, first -->
      <div class="space-y-2">
        <label class="text-sm font-medium">
          Photo <span class="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div
          class="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 hover:border-foreground/30 overflow-hidden"
          :class="imagePreview ? 'border-foreground/20 p-0' : 'p-8'"
          @click="triggerFileInput"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />

          <template v-if="imagePreview">
            <img :src="imagePreview" alt="Preview" class="w-full max-h-56 object-cover" />
            <button
              type="button"
              class="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border text-muted-foreground hover:text-foreground transition-colors"
              @click.stop="removeImage"
            >
              <X class="h-3.5 w-3.5" />
            </button>
          </template>
          <template v-else>
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
              <ImagePlus class="h-5 w-5 text-muted-foreground" />
            </div>
            <p class="text-sm font-medium">Add a photo</p>
            <p class="text-[11px] text-muted-foreground mt-0.5">Tap to upload · Auto-compressed</p>
          </template>
        </div>
        <p v-if="compressing" class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 class="h-3 w-3 animate-spin" /> Compressing...
        </p>
      </div>

      <!-- Title -->
      <div class="space-y-2">
        <label for="title" class="text-sm font-medium">Title</label>
        <UiInput id="title" v-model="form.title" placeholder="e.g. Blue iPhone 15 Pro" required />
      </div>

      <!-- Category -->
      <div class="space-y-2">
        <label for="category" class="text-sm font-medium">Category</label>
        <UiSelect id="category" v-model="form.category" :options="categoryOptions" required />
      </div>

      <!-- Description -->
      <div class="space-y-2">
        <label for="description" class="text-sm font-medium">Description</label>
        <UiTextarea
          id="description"
          v-model="form.description"
          placeholder="Color, brand, distinguishing features..."
          :rows="3"
          required
        />
      </div>

      <!-- Location & Date row -->
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-2">
          <label for="location" class="text-sm font-medium">Location</label>
          <UiInput id="location" v-model="form.location" placeholder="e.g. Library" required />
        </div>
        <div class="space-y-2">
          <label for="date" class="text-sm font-medium">Date</label>
          <UiInput id="date" v-model="form.date" type="date" required />
        </div>
      </div>

      <!-- Reward -->
      <div class="space-y-2">
        <label for="reward" class="text-sm font-medium">
          Reward <span class="text-muted-foreground font-normal">(optional)</span>
        </label>
        <UiInput id="reward" v-model="form.reward" placeholder="e.g. ₹500 or Coffee treat" />
      </div>

      <!-- Submit -->
      <UiButton type="submit" class="w-full h-12 text-base font-semibold rounded-xl" :disabled="submitting">
        <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
        {{ submitting ? 'Submitting...' : 'Submit Report' }}
      </UiButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ImagePlus, Loader2, X } from 'lucide-vue-next'

definePageMeta({ middleware: 'auth' })

useHead({ title: 'Report Item — Lost & Found' })

const { compressImage } = useImageCompress()
const { toast } = useToast()

const fileInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref('')
const compressedImage = ref('')
const compressing = ref(false)
const submitting = ref(false)

const form = reactive({
  type: 'lost' as 'lost' | 'found',
  title: '',
  description: '',
  category: '',
  location: '',
  date: new Date().toISOString().split('T')[0],
  reward: '',
})

const categoryOptions = [
  { label: 'Select category', value: '' },
  ...CATEGORY_OPTIONS,
]

function triggerFileInput() {
  fileInput.value?.click()
}

async function processFile(file: File) {
  if (!file.type.startsWith('image/')) return
  compressing.value = true
  try {
    const result = await compressImage(file)
    compressedImage.value = result
    imagePreview.value = result
  }
  catch {
    toast({ title: 'Failed to process image', variant: 'destructive' })
  }
  finally {
    compressing.value = false
  }
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function removeImage() {
  compressedImage.value = ''
  imagePreview.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function handleSubmit() {
  if (!form.title.trim() || !form.description.trim() || !form.category || !form.location.trim() || !form.date) {
    toast({ title: 'Please fill all required fields', variant: 'destructive' })
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/items', {
      method: 'POST',
      body: {
        ...form,
        image: compressedImage.value || undefined,
      },
    })
    toast({ title: 'Item reported successfully!' })
    navigateTo('/')
  }
  catch (err: any) {
    toast({
      title: err?.data?.message || 'Failed to submit report',
      variant: 'destructive',
    })
  }
  finally {
    submitting.value = false
  }
}
</script>
