import { notFound } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase"
import { ListenerProfileClient } from "./client"

interface PageProps {
  params: {
    id: string
  }
}

export default async function ListenerProfilePage({ params }: PageProps) {
  const supabase = createSupabaseServerClient()

  // Fetch listener profile
  const { data: listener, error } = await supabase
    .from("listeners")
    .select(`
      user_id,
      bio,
      expertise,
      rating,
      is_active,
      created_at,
      profiles!listeners_user_id_fkey (
        id,
        name,
        avatar_url
      )
    `)
    .eq("user_id", params.id)
    .eq("is_active", true)
    .single()

  if (error || !listener) {
    notFound()
  }

  const listenerData = {
    id: listener.user_id,
    name: listener.profiles?.name || "Anonymous",
    avatar_url: listener.profiles?.avatar_url,
    bio: listener.bio,
    expertise: listener.expertise,
    rating: listener.rating,
    is_active: listener.is_active,
    created_at: listener.created_at,
  }

  return <ListenerProfileClient listener={listenerData} />
}
