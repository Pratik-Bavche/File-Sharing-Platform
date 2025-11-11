"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ShareRedirect({ params }: { params: { code: string } }) {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to receive tab with the share code
    router.push(`/?tab=receive&code=${params.code}`)
  }, [params.code, router])

  return null
}