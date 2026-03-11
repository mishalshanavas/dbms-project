<script setup lang="ts">
import { cn } from '~/lib/utils'

const props = defineProps<{
  src?: string
  alt?: string
  fallback?: string
  class?: string
  size?: 'sm' | 'md' | 'lg'
}>()

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
}

const imgError = ref(false)
const initials = computed(() => {
  if (props.fallback) return props.fallback
  if (props.alt) return props.alt.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return '?'
})
</script>

<template>
  <span :class="cn('relative flex shrink-0 overflow-hidden rounded-full bg-muted items-center justify-center', sizeClasses[size || 'md'], props.class)">
    <img
      v-if="src && !imgError"
      :src="src"
      :alt="alt || ''"
      class="aspect-square h-full w-full object-cover"
      @error="imgError = true"
    />
    <span v-else class="font-medium text-muted-foreground">{{ initials }}</span>
  </span>
</template>
