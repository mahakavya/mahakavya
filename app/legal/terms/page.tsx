import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { FileText, Calendar, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center border-b">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="h-8 w-8 text-orange-600" />
              <CardTitle className="text-3xl font-bold text-orange-600">Terms and Conditions</CardTitle>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Effective: January 15, 2025
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Updated: January 15, 2025
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <ScrollArea className="h-[600px] pr-4">
              <div className="prose prose-orange max-w-none">
                <h2 className="text-2xl font-semibold text-orange-600 mb-4">1. Acceptance of Terms</h2>
                <p className="mb-4">
                  By accessing and using Mahakavya Social Platform ("Platform", "Service", "we", "us"), you accept and
                  agree to be bound by the terms and provision of this agreement.
                </p>

                <h2 className="text-2xl font-semibold text-orange-600 mb-4">2. Description of Service</h2>
                <p className="mb-4">
                  Mahakavya is a comprehensive social platform that celebrates Indian cultural heritage through:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Social networking and content sharing</li>
                  <li>Fundraising campaigns for meaningful causes</li>
                  <li>Peer support services (Sahaya)</li>
                  <li>Video content creation and sharing (Drishya)</li>
                  <li>Lucky draws and community engagement (Bhagyachakra)</li>
                  <li>Real-time messaging and group conversations</li>
                </ul>

                <h2 className="text-2xl font-semibold text-orange-600 mb-4">3. User Accounts and Registration</h2>
                <h3 className="text-xl font-medium text-orange-500 mb-2">3.1 Account Creation</h3>
                <ul className="list-disc pl-6 mb-4">
                  <li>Users must provide accurate and complete information</li>
                  <li>Users must be at least 13 years old to create an account</li>
                  <li>One account per person is allowed</li>
                  <li>Users are responsible for maintaining account security</li>
                </ul>

                <h3 className="text-xl font-medium text-orange-500 mb-2">3.2 Account Responsibilities</h3>
                <ul className="list-disc pl-6 mb-4">
                  <li>Keep login credentials confidential</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>

                <h2 className="text-2xl font-semibold text-orange-600 mb-4">4. Subscription Plans and Payments</h2>
                <h3 className="text-xl font-medium text-orange-500 mb-2">4.1 Available Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Card className="border-orange-200">
                    <CardContent className="p-4 text-center">
                      <h4 className="font-semibold text-orange-600">Prarambha Plan</h4>
                      <p className="text-2xl font-bold text-green-600">₹99</p>
                      <p className="text-sm text-gray-600">One-time access</p>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-200">
                    <CardContent className="p-4 text-center">
                      <h4 className="font-semibold text-orange-600">Sampurna Plan</h4>
                      <p className="text-2xl font-bold text-blue-600">₹99/month</p>
                      <p className="text-sm text-gray-600">Full access with intro pricing</p>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-200">
                    <CardContent className="p-4 text-center">
                      <h4 className="font-semibold text-orange-600">Mahatva Plan</h4>
                      <p className="text-2xl font-bold text-purple-600">₹1,188/year</p>
                      <p className="text-sm text-gray-600">Premium annual plan</p>
                    </CardContent>
                  </Card>
                </div>

                <h3 className="text-xl font-medium text-orange-500 mb-2">4.2 Payment Terms</h3>
                <ul className="list-disc pl-6 mb-4">
                  <li>All payments are processed through Razorpay</li>
                  <li>Prices are in Indian Rupees (INR)</li>
                  <li>Payments are non-refundable except as specified in our Refund Policy</li>
                  <li>Subscription auto-renewal can be cancelled anytime</li>
                </ul>

                <h2 className="text-2xl font-semibold text-orange-600 mb-4">5. User Content and Conduct</h2>
                <h3 className="text-xl font-medium text-orange-500 mb-2">5.1 Content Guidelines</h3>
                <p className="mb-2">Users agree not to post content that:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Violates any laws or regulations</li>
                  <li>Infringes on intellectual property rights</li>
                  <li>Contains hate speech, harassment, or discrimination</li>
                  <li>Promotes violence or illegal activities</li>
                  <li>Contains explicit sexual content</li>
                  <li>Spreads misinformation or spam</li>
                </ul>

                <h2 className="text-2xl font-semibold text-orange-600 mb-4">6. Privacy and Data Protection</h2>
                <p className="mb-4">
                  We collect and process your data as described in our{" "}
                  <Link href="/legal/privacy" className="text-orange-600 hover:underline">
                    Privacy Policy
                  </Link>
                  . Users can control their privacy settings and data usage preferences through their account settings.
                </p>

                <h2 className="text-2xl font-semibold text-orange-600 mb-4">7. Termination</h2>
                <p className="mb-4">
                  Users may delete their accounts at any time. Mahakavya may suspend accounts for terms violations. See
                  our{" "}
                  <Link href="/legal/cancellation" className="text-orange-600 hover:underline">
                    Cancellation Policy
                  </Link>{" "}
                  for details.
                </p>

                <h2 className="text-2xl font-semibold text-orange-600 mb-4">8. Governing Law</h2>
                <p className="mb-4">
                  These terms are governed by the laws of India. Any disputes will be resolved in the courts of
                  Bangalore, Karnataka.
                </p>

                <h2 className="text-2xl font-semibold text-orange-600 mb-4">9. Contact Information</h2>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">For questions about these terms:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-orange-600" />
                      <span>legal@mahakavya.app</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-orange-600" />
                      <span>+91-80-1234-5678</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-600" />
                      <span>123, MG Road, Bengaluru, KA 560001, India</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <Separator className="my-6" />

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href="/legal/privacy">Privacy Policy</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/legal/refunds">Refund Policy</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/legal/cancellation">Cancellation Policy</Link>
                </Button>
              </div>
              <Button asChild>
                <Link href="/">Back to Platform</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
