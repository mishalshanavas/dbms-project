<template>
  <div class="flex min-h-dvh items-center justify-center bg-background px-4">
    <div class="w-full max-w-[360px] space-y-8">
      <!-- Logo & heading -->
      <div class="text-center space-y-1.5">
        <h1 class="text-2xl font-bold tracking-tight">Losty</h1>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Sahrdaya College community platform
        </p>
      </div>

      <!-- Sign in card -->
      <div class="space-y-5">
        <div class="text-center space-y-1">
          <h2 class="text-base font-semibold">Welcome</h2>
          <p class="text-xs text-muted-foreground">Sign in with your college account to continue</p>
        </div>

        <a
          href="/auth/google"
          class="flex h-12 w-full items-center justify-center gap-3 rounded-xl border bg-card text-sm font-medium transition-all duration-200 hover:bg-accent active:scale-[0.98]"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>

        <p class="text-center text-[11px] text-muted-foreground">
          Only <span class="font-semibold text-foreground">@sahrdaya.ac.in</span> accounts
        </p>
      </div>

      <!-- Error -->
      <UiAlert v-if="error" variant="destructive">
        <div class="flex items-start gap-2">
          <AlertCircle class="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p class="text-sm font-medium">Authentication failed</p>
            <p class="text-xs opacity-80">{{ errorMessage }}</p>
          </div>
        </div>
      </UiAlert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'

definePageMeta({ layout: false })

useHead({ title: 'Sign In — Losty' })

const route = useRoute()
const error = computed(() => route.query.error)
const errorMessage = computed(() => {
  if (error.value === 'auth_failed') return 'Sign in failed. Make sure you are using a @sahrdaya.ac.in account.'
  return 'An unexpected error occurred. Please try again.'
})

const { loggedIn } = useUserSession()
if (loggedIn.value) {
  navigateTo('/')
}
</script>
