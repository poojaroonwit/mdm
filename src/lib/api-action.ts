import toast from 'react-hot-toast'

type SuccessMessage<TData> = string | ((data: TData | undefined) => string)

interface RunApiActionOptions<TData = unknown> {
  request: () => Promise<Response>
  successMessage?: SuccessMessage<TData>
  errorMessage?: string
  onSuccess?: (data: TData | undefined, response: Response) => void | Promise<void>
  onError?: (error: Error) => void | Promise<void>
  toastOnSuccess?: boolean
  toastOnError?: boolean
}

function getMessage<TData>(message: SuccessMessage<TData> | undefined, data: TData | undefined) {
  if (!message) return undefined
  return typeof message === 'function' ? message(data) : message
}

function getErrorMessage(data: unknown) {
  if (!data || typeof data !== 'object') return undefined

  const record = data as Record<string, unknown>
  const value = record.error ?? record.message
  return typeof value === 'string' && value.trim() ? value : undefined
}

async function readResponseData<TData>(response: Response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return (await response.json()) as TData
  }

  return undefined
}

export async function runApiAction<TData = unknown>({
  request,
  successMessage,
  errorMessage = 'Request failed',
  onSuccess,
  onError,
  toastOnSuccess = true,
  toastOnError = true,
}: RunApiActionOptions<TData>) {
  try {
    const response = await request()
    const data = await readResponseData<TData>(response)

    if (!response.ok) {
      throw new Error(getErrorMessage(data) || errorMessage)
    }

    const resolvedSuccessMessage = getMessage(successMessage, data)
    if (toastOnSuccess && resolvedSuccessMessage) {
      toast.success(resolvedSuccessMessage)
    }

    await onSuccess?.(data, response)
    return { ok: true as const, data, response }
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(errorMessage)

    if (toastOnError) {
      toast.error(normalizedError.message || errorMessage)
    }

    await onError?.(normalizedError)
    return { ok: false as const, error: normalizedError }
  }
}
