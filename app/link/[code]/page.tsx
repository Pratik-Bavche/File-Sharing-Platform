"use client"

import { use, useEffect } from "react"
import { redirect } from "next/navigation"
import { motion } from "framer-motion"
import { QRCodeCanvas } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Download, AlertCircle } from "lucide-react"
import bcrypt from "bcryptjs"
import ReceiveSection from "@/components/receive-section"

interface FileData {
  files?: { name: string; size: number }[]
  totalFiles?: number
  totalSize?: number
  type?: "file" | "text"
  text?: string
  hasPassword?: boolean
  passwordHash?: string
}

interface PageProps {
  params: Promise<{ code: string }>
}

export default function ReceivePage({ params }: PageProps) {
  // Unwrap params using React.use()
  const { code } = use(params)

  // Redirect to the receive tab with the code
  useEffect(() => {
    const baseUrl = window.location.origin
    redirect(`${baseUrl}?tab=receive&code=${code}`)
  }, [code])

  return null
}