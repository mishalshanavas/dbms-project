<template>
  <div>
    <!-- Tab triggers -->
    <div class="flex items-center gap-1 rounded-lg bg-secondary p-1">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="relative flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer"
        :class="modelValue === tab.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
        @click="$emit('update:modelValue', tab.value)"
      >
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="ml-1.5 inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
          :class="modelValue === tab.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'"
        >{{ tab.count }}</span>
      </button>
    </div>

    <!-- Tab content -->
    <div class="pt-5">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Tab {
  label: string
  value: string
  count?: number
}

defineProps<{
  tabs: Tab[]
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
