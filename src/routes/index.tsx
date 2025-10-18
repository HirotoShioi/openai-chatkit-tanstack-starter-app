import { createFileRoute } from '@tanstack/react-router'

import { useCallback } from 'react'
import type { FactAction } from '@/components/ChatKitPanel'
import { ChatKitPanel } from '@/components/ChatKitPanel'
import { useColorScheme } from '@/hooks/useColorScheme'

export const Route = createFileRoute('/')({
  ssr: false,
  component: Home,
})

function Home() {
  const { scheme, setScheme } = useColorScheme()

  const handleWidgetAction = useCallback(async (action: FactAction) => {
    if (import.meta.env.MODE !== 'production') {
      console.info('[ChatKitPanel] widget action', action)
    }
  }, [])

  const handleResponseEnd = useCallback(() => {
    if (import.meta.env.MODE !== 'production') {
      console.debug('[ChatKitPanel] response end')
    }
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-end bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-5xl">
        <ChatKitPanel
          theme={scheme}
          onWidgetAction={handleWidgetAction}
          onResponseEnd={handleResponseEnd}
          onThemeRequest={setScheme}
        />
      </div>
    </main>
  )
}
