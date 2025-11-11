import { useEffect, useState } from 'react'
import { Copy, Check, Wifi, SignalMedium } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getNetworkType } from '@/lib/mobile-utils'

interface RoomCardProps {
  roomId: string
}

export function RoomCard({ roomId }: RoomCardProps) {
  const [copied, setCopied] = useState(false)
  const [networkType, setNetworkType] = useState<'wifi' | 'cellular' | 'unknown'>('unknown')

  useEffect(() => {
    const checkNetwork = async () => {
      const type = await getNetworkType()
      console.log(type)
      setNetworkType(type)
    }
    checkNetwork()

    // Update network type when connection changes
    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', checkNetwork)
      return () => connection.removeEventListener('change', checkNetwork)
    }
  }, [])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Card className="border-purple-200/50 dark:border-purple-800/30 bg-white/50 dark:bg-background/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="bg-gradient-to-r from-purple-600 to-violet-600 text-transparent bg-clip-text">Room ID</CardTitle>
        <CardDescription>
          Share this ID with someone to start transferring files
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <code className="relative rounded bg-purple-100 dark:bg-purple-950/30 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-purple-700 dark:text-purple-300">
              {roomId}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Network Type Indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {networkType === 'wifi' ? (
              <>
                <Wifi className="h-4 w-4" />
                <span>Connected via WiFi</span>
              </>
            ) : networkType === 'cellular' ? (
              <>
                <SignalMedium className="h-4 w-4" />
                <span>Connected via Mobile Data</span>
              </>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}