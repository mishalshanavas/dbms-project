interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

const toasts = ref<ToastItem[]>([])

export function useToast() {
  function toast(opts: Omit<ToastItem, 'id'>) {
    const id = Math.random().toString(36).slice(2)
    toasts.value.push({ ...opts, id })
    setTimeout(() => dismiss(id), 4000)
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, toast, dismiss }
}
