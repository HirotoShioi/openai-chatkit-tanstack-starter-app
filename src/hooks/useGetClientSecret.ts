import { mutationOptions } from '@tanstack/react-query'
import { CREATE_SESSION_ENDPOINT, WORKFLOW_ID } from '@/lib/config'

const isDev = import.meta.env.MODE !== 'production'

async function getClientSecret(currentSecret: string | null) {
  if (isDev) {
    console.info('[ChatKitPanel] getClientSecret invoked', {
      currentSecretPresent: Boolean(currentSecret),
      workflowId: WORKFLOW_ID,
      endpoint: CREATE_SESSION_ENDPOINT,
    })
  }

  const response = await fetch(CREATE_SESSION_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflow: { id: WORKFLOW_ID },
      chatkit_configuration: {
        // enable attachments
        file_upload: {
          enabled: true,
        },
      },
    }),
  })
  const json = await response.json()
  return json.client_secret as string
}

export const getClientSecretOptions = mutationOptions({
  mutationFn: getClientSecret,
})
