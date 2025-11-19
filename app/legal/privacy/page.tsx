import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Shield, Calendar, Mail, Phone, MapPin, Lock, Eye, Database } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center border-b">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <CardTitle className="text-3xl font-bold text-blue-600">Privacy Policy</CardTitle>
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
              <div className="prose prose-blue max-w-none">
                <h2 className="text-2xl font-semibold text-blue-600 mb-4">1. Introduction</h2>
                <p className="mb-4">
                  Mahakavya Social Platform is committed to protecting your privacy. This Privacy Policy explains how we
                  collect, use, disclose, and safeguard your information when you use our platform.
                </p>

                <h2 className="text-2xl font-semibold text-blue-600 mb-4">2. Information We Collect</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="border-blue-200">
                    <CardContent className="p-4 text-center">
                      <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-blue-600">Personal Info</h4>
                      <p className="text-sm text-gray-600">Name, email, profile data</p>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200">
                    <CardContent className="p-4 text-center">
                      <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-blue-600">Usage Data</h4>
                      <p className="text-sm text-gray-600">Activity, interactions, device info</p>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200">
                    <CardContent className="p-4 text-center">
                      <Lock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-blue-600">Secure Storage</h4>
                      <p className="text-sm text-gray-600">Encrypted and protected</p>
                    </CardContent>
                  </Card>
                </div>

                <h3 className="text-xl font-medium text-blue-500 mb-2">2.1 Personal Information</h3>
                <ul className="list-disc pl-6 mb-4">
                  <li>
                    <strong>Account Information:</strong> Name, email address, phone number, date of birth
                  </li>
                  <li>
                    <strong>Profile Information:</strong> Bio, profile picture, location, interests
                  </li>
                  <li>
                    <strong>Payment Information:</strong> Billing address, payment method details (processed by
                    Razorpay)
                  </li>
                  <li>
                    <strong>Identity Verification:</strong> Government ID for certain features (encrypted and secure)
                  </li>
                </ul>

                <h3 className="text-xl font-medium text-blue-500 mb-2">2.2 Usage Information</h3>
                <ul className="list-disc pl-6 mb-4">
                  <li>
                    <strong>Activity Data:</strong> Posts, comments, likes, shares, messages
                  </li>
                  <li>
                    <strong>Interaction Data:</strong> Connections, groups joined, campaigns supported
                  </li>
                  <li>
                    <strong>Device Information:</strong> IP address, browser type, operating system
                  </li>
                  <li>
                    <strong>Location Data:</strong> Approximate location based on IP address (with consent)
                  </li>
                </ul>

                <h2 className="text-2xl font-semibold text-blue-600 mb-4">3. How We Use Your Information</h2>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-blue-600 mb-2">Primary Uses:</h4>
                  <ul className="list-disc pl-6">
                    <li>Create and manage your account</li>
                    <li>Process payments and subscriptions</li>
                    <li>Provide customer support</li>
                    <li>Enable social features and interactions</li>
                    <li>Improve platform experience</li>
                  </ul>
                </div>

                <h2 className="text-2xl font-semibold text-blue-600 mb-4">4. Data Security</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-600 mb-2">✅ Security Measures</h4>
                    <ul className="text-sm">
                      <li>• Data encrypted in transit and at rest</li>
                      <li>• Limited access to authorized personnel</li>
                      <li>• Regular security audits</li>
                      <li>• Industry-standard practices</li>
                    </ul>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-600 mb-2">🚨 Breach Response</h4>
                    <ul className="text-sm">
                      <li>• Immediate investigation</li>
                      <li>• User notification within 72 hours</li>
                      <li>• Regulatory authority notification</li>
                      <li>• Remediation measures</li>
                    </ul>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-blue-600 mb-4">5. Your Privacy Rights</h2>
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-600">Access & Control</h4>
                      <p className="text-sm text-gray-600">
                        Request copy of your data, update information, manage privacy settings
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-600">Data Portability</h4>
                      <p className="text-sm text-gray-600">
                        Export your data, transfer to other platforms, maintain ownership rights
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-600">Communication Preferences</h4>
                      <p className="text-sm text-gray-600">
                        Control email notifications, push notifications, SMS messages
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-blue-600 mb-4">6. Data Retention</h2>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold mb-2">Retention Periods:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>
                      <strong>Account Data:</strong> While account is active
                    </li>
                    <li>
                      <strong>Transaction Data:</strong> 7 years (legal requirement)
                    </li>
                    <li>
                      <strong>Communication Data:</strong> 2 years for support
                    </li>
                    <li>
                      <strong>Analytics Data:</strong> Anonymized indefinitely
                    </li>
                  </ul>
                </div>

                <h2 className="text-2xl font-semibold text-blue-600 mb-4">7. Third-Party Services</h2>
                <p className="mb-4">
                  We integrate with trusted third-party services including Razorpay for payments and Supabase for data
                  storage. Each service has its own privacy policy that users should review.
                </p>

                <h2 className="text-2xl font-semibold text-blue-600 mb-4">8. Contact Information</h2>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">For privacy-related questions:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span>privacy@mahakavya.app</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span>+91-80-1234-5678</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span>123, MG Road, Bengaluru, KA 560001, India</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm">
                      <strong>Data Protection Officer:</strong> Sreekar Pratap
                    </p>
                    <p className="text-sm">
                      <strong>Email:</strong> dpo@mahakavya.app
                    </p>
                    <p className="text-sm">
                      <strong>Response Time:</strong> Within 5 business days
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <Separator className="my-6" />

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href="/legal/terms">Terms & Conditions</Link>
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
