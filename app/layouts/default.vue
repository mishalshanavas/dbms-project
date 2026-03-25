<template>
  <div class="min-h-dvh bg-background text-foreground">
    <!-- Top navbar — clean, minimal -->
    <header class="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl">
      <div class="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
        <!-- Left: Logo -->
        <NuxtLink to="/" class="font-semibold tracking-tight text-base">
          Losty
        </NuxtLink>

        <!-- Center: Desktop nav links -->
        <nav v-if="loggedIn" class="hidden md:flex items-center gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-accent"
            active-class="!text-foreground !bg-accent"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <!-- Right: Actions -->
        <div class="flex items-center gap-1.5">
          <!-- Theme toggle -->
          <button
            class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-accent cursor-pointer"
            @click="toggleColorMode"
          >
            <ClientOnly>
              <Sun v-if="isDark" class="h-[18px] w-[18px]" />
              <Moon v-else class="h-[18px] w-[18px]" />
              <template #fallback>
                <span class="h-[18px] w-[18px]" />
              </template>
            </ClientOnly>
          </button>

          <template v-if="loggedIn">
            <!-- Report button — desktop -->
            <UiButton size="sm" class="hidden sm:inline-flex" @click="navigateTo('/report')">
              <Plus class="h-4 w-4" />
              Report
            </UiButton>

            <!-- User dropdown -->
            <UiDropdownMenu :items="userMenu">
              <template #trigger>
                <button class="flex items-center rounded-lg p-1 transition-colors hover:bg-accent cursor-pointer">
                  <UiAvatar :src="user?.avatar || undefined" :alt="user?.name" size="sm" />
                </button>
              </template>
            </UiDropdownMenu>
          </template>

          <template v-else>
            <UiButton size="sm" @click="navigateTo('/login')">Sign in</UiButton>
          </template>
        </div>
      </div>
    </header>

    <!-- Mobile bottom nav — OLX style -->
    <nav v-if="loggedIn" class="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/90 backdrop-blur-xl md:hidden pb-[env(safe-area-inset-bottom)]">
      <div class="mx-auto grid h-16 max-w-md grid-cols-4 items-center px-2">
        <NuxtLink
          v-for="link in mobileLinks"
          :key="link.to"
          :to="link.to"
          class="flex flex-col items-center gap-1 py-1 text-muted-foreground transition-all duration-200"
          active-class="!text-foreground"
        >
          <component :is="link.icon" class="h-5 w-5" />
          <span class="text-[10px] font-medium leading-none">{{ link.label }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Content -->
    <main class="mx-auto max-w-screen-xl px-4 py-5 sm:py-8 pb-24 md:pb-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { Sun, Moon, Plus, Home, PlusCircle, LayoutDashboard, Shield, LogOut, User } from 'lucide-vue-next'

const { loggedIn, user, clear } = useUserSession()
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

function toggleColorMode() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const navLinks = computed(() => {
  const links = [
    { label: 'Feed', to: '/' },
    { label: 'Report', to: '/report' },
    { label: 'Dashboard', to: '/dashboard' },
  ]
  if (user.value?.isAdmin) {
    links.push({ label: 'Admin', to: '/admin' })
  }
  return links
})

const mobileLinks = computed(() => {
  const links = [
    { label: 'Feed', to: '/', icon: Home },
    { label: 'Report', to: '/report', icon: PlusCircle },
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  ]
  if (user.value?.isAdmin) {
    links.push({ label: 'Admin', to: '/admin', icon: Shield })
  }
  return links
})

const userMenu = computed(() => [
  { label: user.value?.email || '', disabled: true },
  { separator: true },
  { label: 'Profile', icon: User, action: () => navigateTo('/profile') },
  { label: 'Dashboard', icon: LayoutDashboard, action: () => navigateTo('/dashboard') },
  ...(user.value?.isAdmin ? [{ label: 'Admin', icon: Shield, action: () => navigateTo('/admin') }] : []),
  { separator: true },
  { label: 'Sign out', icon: LogOut, action: async () => { await clear(); navigateTo('/login') } },
])
</script>
