export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user has a persona saved
  const { data: profile } = await supabase
    .from('profiles')
    .select('persona_id')
    .eq('id', user.id)
    .single()

  if (profile?.persona_id) {
    redirect(`/chat?persona=${profile.persona_id}`)
  }

  redirect('/persona')
}
