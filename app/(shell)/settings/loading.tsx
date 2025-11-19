import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings } from "lucide-react"

export default function SettingsLoading() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">स्थापना (Sthapana) - Settings</h1>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-6">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-10 flex-1" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
