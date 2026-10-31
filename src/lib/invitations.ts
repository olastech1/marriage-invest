/**
 * Email invitations: remembered when sent, so that when the person signs up
 * they appear in the inviter's chats as "joined through your invite".
 */

import { prisma } from '@/lib/db'
import { buildThreadId, createChatMessage } from '@/lib/chat'

export async function recordInvitation(inviterId: string, email: string) {
  const clean = email.trim().toLowerCase()
  if (!inviterId || !clean) return
  await prisma.invitation
    .upsert({ where: { inviterId_email: { inviterId, email: clean } }, update: {}, create: { inviterId, email: clean } })
    .catch((err) => console.error('[invitations] record failed', err))
}

/** A new member joined: add them to each inviter's chats and tell the inviter */
export async function welcomeInvitedMember(user: { id: string; name: string; email: string }) {
  const invites = await prisma.invitation.findMany({ where: { email: user.email.toLowerCase(), acceptedAt: null } }).catch(() => [])
  for (const invite of invites) {
    if (invite.inviterId === user.id) continue
    await prisma.invitation.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } })
    // Each in the other's chat list
    for (const [ownerId, contactId] of [[invite.inviterId, user.id], [user.id, invite.inviterId]]) {
      await prisma.contact
        .upsert({ where: { ownerId_contactId: { ownerId, contactId } }, update: {}, create: { ownerId, contactId } })
        .catch(() => {})
    }
    await createChatMessage({
      data: {
        threadId: buildThreadId(invite.inviterId, user.id),
        senderId: 'system_union_verify',
        senderName: 'Union Verify',
        recipientId: invite.inviterId,
        text: `${user.name} joined Union Verify through your invite. Say hello!`,
        timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
        type: 'invite_joined',
      },
    }).catch((err) => console.error('[invitations] chat card failed', err))
    await prisma.notification
      .create({
        data: {
          userId: invite.inviterId,
          title: `${user.name} joined through your invite`,
          message: 'They are in your chats now.',
          type: 'SUCCESS',
          link: `/chat?recipientId=${encodeURIComponent(user.id)}&name=${encodeURIComponent(user.name)}`,
        },
      })
      .catch(() => {})
  }
}
