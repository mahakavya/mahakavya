import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CtaJoin() {
  return (
    <section className="heritage-card p-12 text-center">
      <h2 className="text-3xl font-bold text-amber-900 mb-4">Join Our Heritage Community</h2>
      <p className="text-xl text-amber-700 mb-8 max-w-2xl mx-auto">
        Be part of a platform that celebrates culture, supports meaningful causes, and builds lasting connections within
        our community.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" asChild className="heritage-button">
          <Link href="/signup" className="inline-flex items-center gap-2">
            Start Your Journey
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild className="heritage-button-outline bg-transparent">
          <Link href="/features">Explore Features</Link>
        </Button>
      </div>
    </section>
  )
}
