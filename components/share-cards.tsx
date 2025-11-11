"use client"

import React from "react"
import { Users, Share2, ArrowRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function ShareCards() {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Link href="/p2p">
        <Card className="group relative overflow-hidden border-purple-200/40 dark:border-purple-800/30 bg-white/60 dark:bg-background/30 backdrop-blur-md hover:shadow-lg transition-transform hover:scale-105 cursor-pointer">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center text-purple-700">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Multi P2P Share
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Create or join a room to share files with multiple receivers in real-time — encrypted and direct browser-to-browser.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-violet-500/0 group-hover:from-purple-500/5 group-hover:to-violet-500/5 transition-colors" />
        </Card>
      </Link>

      <Link href="/share">
        <Card className="group relative overflow-hidden border-purple-200/40 dark:border-purple-800/30 bg-white/60 dark:bg-background/30 backdrop-blur-md hover:shadow-lg transition-transform hover:scale-105 cursor-pointer">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-violet-700">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Quick Share
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Upload a file and instantly generate a one-time share link. Quick, secure, and ephemeral file sharing with end-to-end encryption.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-violet-500/0 group-hover:from-purple-500/5 group-hover:to-violet-500/5 transition-colors" />
        </Card>
      </Link>
    </div>
  )
}
