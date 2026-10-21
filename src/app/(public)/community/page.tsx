import NotOpenYet from '@/components/public/NotOpenYet'

export const metadata = { title: 'Community giving' }

export default function CommunityPage() {
  return (
    <NotOpenYet
      title="Community giving"
      body="We don't have any partner causes yet, so donations aren't open. When a verified charity partners with Union Verify, it will be listed here."
    />
  )
}
