import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ParichayaLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Header Skeleton */}
        <Card className="glass border-0 shadow-xl">
          <CardContent className="pt-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
              <Skeleton className="w-32 h-32 rounded-full" />

              <div className="flex-1 space-y-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-16" />
                </div>

                <Skeleton className="h-4 w-full max-w-2xl" />
                <Skeleton className="h-4 w-3/4 max-w-xl" />

                <div className="flex flex-wrap items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="text-center">
                      <Skeleton className="h-8 w-12 mx-auto mb-1" />
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>

              <div className="flex flex-col space-y-3 lg:items-end">
                <Skeleton className="h-10 w-32" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights Skeleton */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <Skeleton className="h-5 w-5 mr-2" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-20" />
                  ))}
                </div>
              </div>
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-24" />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Blockchain Status Skeleton */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <Skeleton className="h-5 w-5 mr-2" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-64 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 flex-1" />
            ))}
          </div>

          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="w-full h-48 rounded-t-lg" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex space-x-4">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
