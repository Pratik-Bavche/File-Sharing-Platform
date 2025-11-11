import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header Section Skeleton */}
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>

        {/* Room ID Skeleton */}
        <Card className="p-4 bg-muted/50">
          <div className="text-center space-y-1">
            <Skeleton className="h-4 w-20 mx-auto" />
            <Skeleton className="h-6 w-32 mx-auto mt-1" />
          </div>
        </Card>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Card className="mt-4">
            <div className="p-4">
              <Skeleton className="h-32 w-full" />
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </Card>
        </div>

        {/* Instructions Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
            ))}
          </div>
        </div>

        {/* Security Note Skeleton */}
        <Card className="p-4 bg-muted/50">
          <Skeleton className="h-4 w-96 mx-auto" />
        </Card>
      </div>
    </div>
  )
}