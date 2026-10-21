import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Sends a signed-in member to their own public profile
export default async function ProfileRedirectPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/profile')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  })
  redirect(user?.username ? `/u/${user.username}` : '/settings')
}
