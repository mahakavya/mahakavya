import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Heart,
  Shield,
  Brain,
  Blocks,
  TrendingUp,
  MessageCircle,
  Video,
  Gift,
  Headphones,
} from "lucide-react"
import { SacredLogo } from "@/components/sacred-logo"
import { AnimatedBackground } from "@/components/animated-background"
import { FloatingElements } from "@/components/floating-elements"

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      <FloatingElements />

      {/* Navigation */}
      <nav className="relative z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SacredLogo className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                  Mahakavya
                </h1>
                <p className="text-xs text-gray-600">महाकाव्य</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-orange-100 text-orange-800 border-orange-200">
              🚀 Now Live - Join the Cultural Revolution
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-600 via-red-500 to-purple-600 bg-clip-text text-transparent">
              Welcome to Mahakavya
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              The ultimate social platform celebrating Indian culture, spirituality, and community. Connect, share, and
              grow together in a space designed for our values.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-lg px-8 py-3"
                >
                  Join Mahakavya
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/prarambha">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3 bg-transparent">
                  Explore Features
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-orange-600">10K+</div>
                <div className="text-gray-600">Active Members</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-500">50K+</div>
                <div className="text-gray-600">Cultural Posts</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">100+</div>
                <div className="text-gray-600">Communities</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
              Discover Our Modules
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Each module is crafted to enhance your spiritual and cultural journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Samvaaha - Feed */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-red-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Samvaaha</h3>
                    <p className="text-sm text-gray-600">संवाह - Social Feed</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Share your thoughts, cultural insights, and connect with like-minded individuals in our vibrant
                  community feed.
                </p>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Social Networking
                </Badge>
              </CardContent>
            </Card>

            {/* Varta - Messaging */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Varta</h3>
                    <p className="text-sm text-gray-600">वार्ता - Messaging</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Private conversations and group chats with end-to-end encryption for secure communication.
                </p>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Secure Messaging
                </Badge>
              </CardContent>
            </Card>

            {/* Drishya - Reels */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Video className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Drishya</h3>
                    <p className="text-sm text-gray-600">दृश्य - Video Reels</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Create and share short videos showcasing cultural performances, tutorials, and spiritual content.
                </p>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  Video Content
                </Badge>
              </CardContent>
            </Card>

            {/* Nivedana - Fundraising */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Heart className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Nivedana</h3>
                    <p className="text-sm text-gray-600">निवेदन - Fundraising</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Support meaningful causes and cultural initiatives through transparent, blockchain-verified donations.
                </p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Social Impact
                </Badge>
              </CardContent>
            </Card>

            {/* BhagyaChakra - Draws */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Gift className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">BhagyaChakra</h3>
                    <p className="text-sm text-gray-600">भाग्यचक्र - Lucky Draws</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Participate in fair, transparent lucky draws with blockchain verification for complete trust.
                </p>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Community Events
                </Badge>
              </CardContent>
            </Card>

            {/* Sahaya - Support */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-teal-50 to-cyan-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <Headphones className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Sahaya</h3>
                    <p className="text-sm text-gray-600">सहाय - Mental Wellness</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Access mental health support, counseling sessions, and wellness resources in a safe environment.
                </p>
                <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                  Mental Health
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Powered by Advanced Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with cutting-edge security, AI, and blockchain technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8 border-0 bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Brain className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">AI-Powered</h3>
              <p className="text-gray-600">
                Smart content recommendations, automated moderation, and personalized experiences powered by advanced
                AI.
              </p>
            </Card>

            <Card className="text-center p-8 border-0 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="p-4 bg-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Blocks className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Blockchain Verified</h3>
              <p className="text-gray-600">
                Transparent transactions, verified identities, and immutable records for complete trust and security.
              </p>
            </Card>

            <Card className="text-center p-8 border-0 bg-gradient-to-br from-green-50 to-teal-50">
              <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Shield className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Enterprise Security</h3>
              <p className="text-gray-600">
                End-to-end encryption, advanced threat detection, and comprehensive privacy protection for all users.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Begin Your Journey?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users who are already part of the Mahakavya community. Experience the future of
              culturally-conscious social networking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8 py-3">
                  Create Account
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/prarambha">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-orange-600 text-lg px-8 py-3 bg-transparent"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <SacredLogo className="w-8 h-8" />
                <div>
                  <h3 className="text-lg font-bold">Mahakavya</h3>
                  <p className="text-xs text-gray-400">महाकाव्य</p>
                </div>
              </div>
              <p className="text-gray-400">
                Connecting hearts, minds, and souls through the power of Indian culture and technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/samvaaha" className="hover:text-white">
                    Samvaaha
                  </Link>
                </li>
                <li>
                  <Link href="/varta" className="hover:text-white">
                    Varta
                  </Link>
                </li>
                <li>
                  <Link href="/drishya" className="hover:text-white">
                    Drishya
                  </Link>
                </li>
                <li>
                  <Link href="/nivedana" className="hover:text-white">
                    Nivedana
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/sahaya" className="hover:text-white">
                    Mental Wellness
                  </Link>
                </li>
                <li>
                  <Link href="/guidelines" className="hover:text-white">
                    Community Guidelines
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-white">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link href="/compliance" className="hover:text-white">
                    Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Mahakavya. All rights reserved. Made with ❤️ for Indian culture.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
