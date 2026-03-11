<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <UiToaster :toasts="toasts" @dismiss="dismiss" />
</template>

<script setup lang="ts">
const { toasts, dismiss } = useToast()
</script>
