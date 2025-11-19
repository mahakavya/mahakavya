import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { XCircle, Calendar, Mail, Phone, MapPin, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center border-b">
            <div className="flex items-center justify-center gap-2 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
              <CardTitle className="text-3xl font-bold text-red-600">Cancellation Policy</CardTitle>
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
              <div className="prose prose-red max-w-none">
                <h2 className="text-2xl font-semibold text-red-600 mb-4">1. Overview</h2>
                <p className="mb-4">
                  This Cancellation Policy explains how users can cancel their subscriptions, services, and accounts on
                  Mahakavya Social Platform. We provide flexible cancellation options to ensure user satisfaction.
                </p>

                <h2 className="text-2xl font-semibold text-red-600 mb-4">2. Subscription Cancellations</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="border-red-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-red-600 mb-2">Prarambha Plan</h4>
                      <p className="text-2xl font-bold text-red-600 mb-2">₹99</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-gray-500" />
                          <span>Not applicable (one-time)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Lifetime access</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-600" />
                          <span>7-day refund window</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-red-600 mb-2">Sampurna Plan</h4>
                      <p className="text-2xl font-bold text-red-600 mb-2">₹99/month</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Cancel anytime</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-600" />
                          <span>Access until period ends</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span>Auto-renewal stops</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-red-600 mb-2">Mahatva Plan</h4>
                      <p className="text-2xl font-bold text-red-600 mb-2">₹1,188/year</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Cancel anytime</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-600" />
                          <span>Access until expiry</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Pro-rated refund (30 days)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <h2 className="text-2xl font-semibold text-red-600 mb-4">3. How to Cancel Subscriptions</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Self-Service Cancellation
                    </h4>
                    <ol className="list-decimal pl-6 space-y-2 text-sm">
                      <li>
                        <strong>Login:</strong> Access your Mahakavya account
                      </li>
                      <li>
                        <strong>Settings:</strong> Go to Account Settings → Billing
                      </li>
                      <li>
                        <strong>Subscription:</strong> Find active subscription
                      </li>
                      <li>
                        <strong>Cancel:</strong> Click "Cancel Subscription" button
                      </li>
                      <li>
                        <strong>Confirmation:</strong> Confirm cancellation request
                      </li>
                      <li>
                        <strong>Email:</strong> Receive cancellation confirmation
                      </li>
                    </ol>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Support-Assisted Cancellation
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <strong>Email:</strong> billing@mahakavya.app
                      </li>
                      <li>
                        <strong>Phone:</strong> +91-80-1234-5678
                      </li>
                      <li>
                        <strong>Live Chat:</strong> Available during business hours
                      </li>
                      <li>
                        <strong>Required Info:</strong> Account email and subscription details
                      </li>
                    </ul>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-red-600 mb-4">4. Cancellation Effects</h2>

                <div className="space-y-4 mb-6">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-600 mb-2">Immediate Effects</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Billing stops - no future charges</li>
                      <li>• Premium features disabled at period end</li>
                      <li>• Full data access until subscription expires</li>
                      <li>• Basic support continues</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-600 mb-2">End of Billing Period Effects</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Feature downgrade to free tier</li>
                      <li>• Reduced storage capacity</li>
                      <li>• AI and blockchain features disabled</li>
                      <li>• Standard support only</li>
                    </ul>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-red-600 mb-4">5. Account Deletion</h2>
                <div className="bg-red-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-red-600 mb-3">Account Deletion Process:</h4>
                  <ol className="list-decimal pl-6 space-y-2 text-sm">
                    <li>
                      <strong>Backup Data:</strong> Download your information
                    </li>
                    <li>
                      <strong>Cancel Subscriptions:</strong> Stop all active billing
                    </li>
                    <li>
                      <strong>Clear Obligations:</strong> Resolve pending issues
                    </li>
                    <li>
                      <strong>Submit Request:</strong> Use account deletion form
                    </li>
                    <li>
                      <strong>Verification:</strong> Confirm identity and intent
                    </li>
                    <li>
                      <strong>Processing:</strong> 30-day deletion timeline
                    </li>
                  </ol>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-yellow-600 mb-2">⚠️ Important Notes:</h4>
                  <ul className="text-sm space-y-1">
                    <li>
                      • <strong>Grace Period:</strong> 30 days to reactivate deleted accounts
                    </li>
                    <li>
                      • <strong>Data Recovery:</strong> Full restoration during grace period
                    </li>
                    <li>
                      • <strong>After Grace Period:</strong> New account creation required
                    </li>
                    <li>
                      • <strong>Premium Features:</strong> Require new subscription
                    </li>
                  </ul>
                </div>

                <h2 className="text-2xl font-semibold text-red-600 mb-4">6. Special Cancellation Scenarios</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-600 mb-2">Medical Emergencies</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Extended grace period (up to 90 days)</li>
                      <li>• Documentation required (medical certificates)</li>
                      <li>• Partial refunds (case-by-case evaluation)</li>
                      <li>• Service suspension (temporary hold option)</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-600 mb-2">Financial Hardship</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Payment plans (alternative to cancellation)</li>
                      <li>• Reduced pricing (temporary discounts)</li>
                      <li>• Service pause (up to 6 months)</li>
                      <li>• Documentation (income proof may be required)</li>
                    </ul>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-red-600 mb-4">7. No Cancellation Fees</h2>
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-green-600 mb-2">✅ Always Free:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Subscription cancellations</li>
                    <li>• Account deletions</li>
                    <li>• Service cancellations</li>
                    <li>• Early termination (no penalties)</li>
                  </ul>
                </div>

                <h2 className="text-2xl font-semibold text-red-600 mb-4">8. Contact Information</h2>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">For cancellation assistance:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-red-600" />
                      <span>cancel@mahakavya.app</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-red-600" />
                      <span>+91-80-1234-5678 (9 AM - 9 PM IST)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span>123, MG Road, Bengaluru, KA 560001, India</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-red-200">
                    <p className="text-sm">
                      <strong>Support Portal:</strong> https://mahakavya.app/support/cancel
                    </p>
                    <p className="text-sm">
                      <strong>Live Chat:</strong> Available 9 AM - 9 PM IST
                    </p>
                    <p className="text-sm">
                      <strong>Emergency Cancellation:</strong> emergency@mahakavya.app
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
                  <Link href="/legal/privacy">Privacy Policy</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/legal/refunds">Refund Policy</Link>
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
