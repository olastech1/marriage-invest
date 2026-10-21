import NotOpenYet from '@/components/public/NotOpenYet'

export const metadata = { title: 'Wedding cash registry' }

export default function RegistryPage() {
  return (
    <NotOpenYet
      title="Wedding cash registry"
      body="Cash gift registries aren't open yet. When they are, couples will be able to share a registry link so guests can send gifts to their joint vault."
    />
  )
}
