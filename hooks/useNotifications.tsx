export function useNotifications() {
  const notifications: any[] = []
  function prioritizeNotifications() {
    return notifications
  }
  function personalizeNotifications() {
    return notifications
  }
  return { notifications, prioritizeNotifications, personalizeNotifications }
}
