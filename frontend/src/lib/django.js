function getCookie(name) {
  if (!document.cookie) return null
  const cookies = document.cookie.split(";")
  for (const cookie of cookies) {
    const trimmed = cookie.trim()
    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.slice(name.length + 1))
    }
  }
  return null
}

export function getCSRFToken() {
  return getCookie("csrftoken") || ""
}
