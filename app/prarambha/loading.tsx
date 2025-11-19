import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SacredLogo } from "@/components/sacred-logo"
import { AnimatedBackground } from "@/components/animated-background"
import { FloatingElements } from "@/components/floating-elements"

export default function PrarambhaLoading() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-purple-50">
      <AnimatedBackground />
      <FloatingElements />

      <div className="relative z-10">
        {/* Hero Section Loading */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <SacredLogo className="w-32 h-32 mx-auto mb-8 animate-pulse" />
              <Skeleton className="h-8 w-64 mx-auto mb-6" />
              <Skeleton className="h-20 w-96 mx-auto mb-6" />
              <Skeleton className="h-8 w-80 mx-auto mb-4" />
              <Skeleton className="h-6 w-full max-w-4xl mx-auto mb-8" />

              {/* AI Greeting Card Loading */}
              <Card className="glass max-w-3xl mx-auto mb-8">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons Loading */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Skeleton className="h-14 w-48" />
              <Skeleton className="h-14 w-48" />
            </div>

            {/* Platform Statistics Loading */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-5xl mx-auto">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="glass text-center">
                  <CardContent className="pt-4">
                    <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-full" />
                    <Skeleton className="h-6 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-20 mx-auto mb-1" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Technology Section Loading */}
        <section className="py-20 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Skeleton className="h-12 w-96 mx-auto mb-6" />
              <Skeleton className="h-6 w-full max-w-3xl mx-auto" />
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="glass">
                  <CardHeader className="text-center pb-4">
                    <Skeleton className="w-20 h-20 mx-auto rounded-full mb-6" />
                    <Skeleton className="h-6 w-32 mx-auto mb-2" />
                    <Skeleton className="h-5 w-24 mx-auto" />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-5/6 mb-1" />
                    <Skeleton className="h-4 w-4/5" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>

                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section Loading */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Skeleton className="h-12 w-80 mx-auto mb-6" />
              <Skeleton className="h-6 w-full max-w-3xl mx-auto" />
            </div>

            {/* Tabs Loading */}
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-center mb-12">
                <Skeleton className="h-12 w-96" />
              </div>

              {/* Feature Cards Loading */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="glass">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <Skeleton className="w-14 h-14 rounded-2xl" />
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-12" />
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-10" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Platform Access Section Loading */}
        <section className="py-20 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-3xl p-12">
              <div className="text-center mb-12">
                <Skeleton className="h-10 w-80 mx-auto mb-4" />
                <Skeleton className="h-6 w-64 mx-auto" />
              </div>

              <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
                    <Skeleton className="h-5 w-24 mx-auto mb-2" />
                    <Skeleton className="h-4 w-32 mx-auto mb-2" />
                    <Skeleton className="h-5 w-20 mx-auto" />
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Skeleton className="h-12 w-48 mx-auto" />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section Loading */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Card className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600">
              <CardContent className="text-center py-16 px-8">
                <Skeleton className="h-12 w-96 mx-auto mb-6 bg-white/20" />
                <Skeleton className="h-6 w-full max-w-3xl mx-auto mb-8 bg-white/20" />

                <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
                  <Skeleton className="h-14 w-48 bg-white/20" />
                  <Skeleton className="h-14 w-32 bg-white/20" />
                </div>

                <div className="flex items-center justify-center gap-8">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-24 bg-white/20" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
