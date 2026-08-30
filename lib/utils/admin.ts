export function isAdminEmail(email: string): boolean {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? ''
  if (!raw) return false
  return raw.split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase())
}
