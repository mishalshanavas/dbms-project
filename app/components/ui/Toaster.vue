<script setup lang="ts">
import { cn } from '~/lib/utils'
import { X } from 'lucide-vue-next'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

const props = defineProps<{
  toasts: Toast[]
}>()

const emit = defineEmits<{
  dismiss: [id: string]
}>()

const variantClass = {
  default: 'border bg-background text-foreground',
  destructive: 'border-destructive bg-destructive text-destructive-foreground',
  success: 'border-success/30 bg-success/10 text-foreground',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-4 sm:right-4 sm:flex-col sm:w-[380px] gap-2">
      <TransitionGroup
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-x-full opacity-0"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="cn(
            'group pointer-events-auto relative flex w-full items-center justify-between overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-sm',
            variantClass[toast.variant || 'default'],
          )"
        >
          <div class="grid gap-1">
            <div class="text-sm font-semibold">{{ toast.title }}</div>
            <div v-if="toast.description" class="text-xs opacity-70">{{ toast.description }}</div>
          </div>
          <button
            class="ml-4 shrink-0 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-70 hover:!opacity-100 cursor-pointer"
            @click="emit('dismiss', toast.id)"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
