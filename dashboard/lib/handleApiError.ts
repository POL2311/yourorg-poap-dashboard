import toast from 'react-hot-toast'

export function handleApiError(error: any, fallbackMessage = 'Something went wrong') {
  console.error(error)
  const message = error?.response?.data?.error || fallbackMessage
  toast.error(message)
}
