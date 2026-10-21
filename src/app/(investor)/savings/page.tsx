import { redirect } from 'next/navigation'

// Joint savings (deposits, reciprocation, balances) live on the Save page
export default function SavingsRedirectPage() {
  redirect('/save')
}
