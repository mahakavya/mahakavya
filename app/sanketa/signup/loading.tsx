import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { SacredLogo } from "@/components/sacred-logo"

export default function SignupLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <SacredLogo className="w-20 h-20 mx-auto mb-6 animate-pulse" />
            <Skeleton className="h-10 w-64 mx-auto mb-2" />
            <Skeleton className="h-6 w-48 mx-auto" />
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((step) => (
                <Skeleton key={step} className="w-10 h-10 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>

          {/* Main Card */}
          <Card className="shadow-2xl">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Skeleton className="h-8 w-48 mx-auto mb-2" />
                  <Skeleton className="h-5 w-64 mx-auto" />
                </div>

                <div className="space-y-4">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <Skeleton className="h-4 w-48 mx-auto mb-4" />
            <div className="flex items-center justify-center gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
