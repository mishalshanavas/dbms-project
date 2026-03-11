<script setup lang="ts">
import { cn } from '~/lib/utils'

const props = defineProps<{
  variant?: 'default' | 'destructive'
  title?: string
  description?: string
  class?: string
}>()

const variantClasses = {
  default: 'border bg-background text-foreground',
  destructive: 'border-destructive/50 bg-destructive/10 text-destructive',
}
</script>

<template>
  <div
    role="alert"
    :class="cn('relative w-full rounded-lg p-4 text-sm', variantClasses[variant || 'default'], props.class)"
  >
    <h5 v-if="title" class="mb-1 font-medium leading-none tracking-tight">{{ title }}</h5>
    <div v-if="description" class="text-sm opacity-80">{{ description }}</div>
    <slot />
  </div>
</template>
