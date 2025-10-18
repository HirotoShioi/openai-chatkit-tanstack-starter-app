import { useCallback, useRef, useState } from 'react'
import { ChatKit, useChatKit } from '@openai/chatkit-react'
import { useMutation } from '@tanstack/react-query'
import { ErrorOverlay } from './ErrorOverlay'
import type { ColorScheme } from '@/hooks/useColorScheme'
import {
  GREETING,
  PLACEHOLDER_INPUT,
  STARTER_PROMPTS,
  WORKFLOW_ID,
  getThemeConfig,
} from '@/lib/config'
import { getClientSecretOptions } from '@/hooks/useGetClientSecret'

export type FactAction = {
  type: 'save'
  factId: string
  factText: string
}

type ChatKitPanelProps = {
  theme: ColorScheme
  onWidgetAction: (action: FactAction) => Promise<void>
  onResponseEnd: () => void
  onThemeRequest: (scheme: ColorScheme) => void
}

const isDev = import.meta.env.MODE !== 'production'


export function ChatKitPanel({
  theme,
  onWidgetAction,
  onResponseEnd,
  onThemeRequest,
}: ChatKitPanelProps) {
  const processedFacts = useRef(new Set<string>())
  const [widgetInstanceKey, setWidgetInstanceKey] = useState(0)


  const isWorkflowConfigured = Boolean(
    WORKFLOW_ID && !WORKFLOW_ID.startsWith('wf_replace'),
  )

  const handleResetChat = useCallback(() => {
    processedFacts.current.clear()
    setWidgetInstanceKey((prev) => prev + 1)
  }, [])

  const { mutateAsync: getClientSecret, isPending: isGettingSession, error: sessionError } =
    useMutation({
      ...getClientSecretOptions,
      onError: (error) => {
        if (isDev) {
          console.error('[ChatKitPanel] getClientSecret error', error)
        }
      },
    })

  const chatkit = useChatKit({
    api: { getClientSecret },
    theme: {
      colorScheme: theme,
      ...getThemeConfig(theme),
    },
    startScreen: {
      greeting: GREETING,
      prompts: STARTER_PROMPTS,
    },
    composer: {
      placeholder: PLACEHOLDER_INPUT,
      attachments: {
        // Enable attachments
        enabled: true,
      },
    },
    threadItemActions: {
      feedback: false,
    },
    onClientTool: (invocation: {
      name: string
      params: Record<string, unknown>
    }) => {
      if (invocation.name === 'switch_theme') {
        const requested = invocation.params.theme
        if (requested === 'light' || requested === 'dark') {
          if (isDev) {
            console.debug('[ChatKitPanel] switch_theme', requested)
          }
          onThemeRequest(requested)
          return { success: true }
        }
        return { success: false }
      }

      if (invocation.name === 'record_fact') {
        const id = String(invocation.params.fact_id ?? '')
        const text = String(invocation.params.fact_text ?? '')
        if (!id || processedFacts.current.has(id)) {
          return { success: true }
        }
        processedFacts.current.add(id)
        void onWidgetAction({
          type: 'save',
          factId: id,
          factText: text.replace(/\s+/g, ' ').trim(),
        })
        return { success: true }
      }

      return { success: false }
    },
    onResponseEnd: () => {
      onResponseEnd()
    },
    onResponseStart: () => {
    },
    onThreadChange: () => {
      processedFacts.current.clear()
    },
    onError: ({ error }: { error: unknown }) => {
      // Note that Chatkit UI handles errors for your users.
      // Thus, your app code doesn't need to display errors on UI.
      console.error('ChatKit error', error)
    },
  })


  if (isDev) {
    console.debug('[ChatKitPanel] render state', {
      isGettingSession: isGettingSession,
      hasControl: Boolean(chatkit.control),
      hasError: Boolean(),
      workflowId: WORKFLOW_ID,
    })
  }

  const content = () => {
    if (!isWorkflowConfigured) {
      return <ErrorOverlay
        error="Please set VITE_PUBLIC_CHATKIT_WORKFLOW_ID in your .env.local file."
        onRetry={null}
      />
    }
    return (
      <>
        {isGettingSession && (<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-slate-900/70">
          Loading assistant session...
        </div>)
        }
        <ChatKit
          key={widgetInstanceKey}
          control={chatkit.control}
          className={
            isGettingSession
              ? 'pointer-events-none opacity-0'
              : 'block h-full w-full'
          }
        />
        <ErrorOverlay
          error={sessionError?.message || null}
          onRetry={handleResetChat}
          retryLabel="Restart chat"
        />
      </>
    )
  }

  return (
    <div className="relative pb-8 flex h-[90vh] w-full rounded-2xl flex-col overflow-hidden bg-white shadow-sm transition-colors dark:bg-slate-900">
      {content()}
    </div>
  )
}
