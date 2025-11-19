import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Calendar, Mail, Phone, MapPin, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center border-b">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CreditCard className="h-8 w-8 text-green-600" />
              <CardTitle className="text-3xl font-bold text-green-600">Refund Policy</CardTitle>
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
              <div className="prose prose-green max-w-none">
                <h2 className="text-2xl font-semibold text-green-600 mb-4">1. Overview</h2>
                <p className="mb-4">
                  This Refund Policy outlines the terms and conditions for refunds on Mahakavya Social Platform. We
                  strive to provide excellent service and fair refund practices for our users.
                </p>

                <h2 className="text-2xl font-semibold text-green-600 mb-4">2. Subscription Refunds</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-green-600 mb-2">Prarambha Plan</h4>
                      <p className="text-2xl font-bold text-green-600 mb-2">₹99</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span>7 days refund period</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Automatic refund</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span>5-7 business days</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-green-600 mb-2">Sampurna Plan</h4>
                      <p className="text-2xl font-bold text-green-600 mb-2">₹99/month</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span>14 days refund period</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Pro-rated refunds</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Cancel anytime</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-green-600 mb-2">Mahatva Plan</h4>
                      <p className="text-2xl font-bold text-green-600 mb-2">₹1,188/year</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span>30 days refund period</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Pro-rated for unused months</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Detailed review process</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <h2 className="text-2xl font-semibold text-green-600 mb-4">3. Refund Eligibility</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Qualifying Conditions
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li>✅ Technical issues preventing service use</li>
                      <li>✅ Billing errors or duplicate charges</li>
                      <li>✅ Service not delivered as promised</li>
                      <li>✅ Account security compromises</li>
                      <li>✅ Platform policy violations by us</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      Non-Qualifying Conditions
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li>❌ Change of mind after extended usage</li>
                      <li>❌ Violation of terms and conditions</li>
                      <li>❌ Account suspension due to misconduct</li>
                      <li>❌ Requests beyond specified time limits</li>
                      <li>❌ Services already consumed or utilized</li>
                    </ul>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-green-600 mb-4">4. Refund Process</h2>
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-green-600 mb-3">Step-by-Step Process:</h4>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>
                      <strong>Contact Support:</strong> Email refunds@mahakavya.app
                    </li>
                    <li>
                      <strong>Provide Details:</strong> Order ID, reason, supporting documents
                    </li>
                    <li>
                      <strong>Review Process:</strong> 2-3 business days evaluation
                    </li>
                    <li>
                      <strong>Decision Notification:</strong> Email confirmation of decision
                    </li>
                    <li>
                      <strong>Processing:</strong> 5-7 business days for approved refunds
                    </li>
                  </ol>
                </div>

                <h3 className="text-xl font-medium text-green-500 mb-2">Required Information</h3>
                <ul className="list-disc pl-6 mb-4">
                  <li>
                    <strong>Account Details:</strong> Username and registered email
                  </li>
                  <li>
                    <strong>Transaction ID:</strong> Payment reference number
                  </li>
                  <li>
                    <strong>Purchase Date:</strong> When the transaction occurred
                  </li>
                  <li>
                    <strong>Reason:</strong> Detailed explanation for refund request
                  </li>
                  <li>
                    <strong>Supporting Documents:</strong> Screenshots, receipts, etc.
                  </li>
                </ul>

                <h2 className="text-2xl font-semibold text-green-600 mb-4">5. Refund Methods</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-green-600">Cards</h4>
                    <p className="text-sm text-gray-600">5-7 days</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-green-600">Net Banking</h4>
                    <p className="text-sm text-gray-600">3-5 days</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-green-600">Wallets</h4>
                    <p className="text-sm text-gray-600">1-3 days</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-green-600">UPI</h4>
                    <p className="text-sm text-gray-600">1-2 days</p>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-green-600 mb-4">6. Special Circumstances</h2>
                <div className="space-y-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-600 mb-2">Medical/Emergency Situations</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Extended refund periods available</li>
                      <li>• Case-by-case consideration</li>
                      <li>• Documentation required (medical certificates)</li>
                      <li>• Payment plan alternatives offered</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-600 mb-2">Technical Issues</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Platform downtime: Automatic service credits</li>
                      <li>• Feature malfunctions: Pro-rated refunds</li>
                      <li>• Data loss: Compensation based on impact</li>
                      <li>• Security breaches: Full refund if requested</li>
                    </ul>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-green-600 mb-4">7. Contact Information</h2>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">For refund requests and inquiries:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-green-600" />
                      <span>refunds@mahakavya.app</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span>+91-80-1234-5678 (Mon-Fri, 9 AM - 6 PM IST)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span>123, MG Road, Bengaluru, KA 560001, India</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm">
                      <strong>Support Portal:</strong> https://mahakavya.app/support
                    </p>
                    <p className="text-sm">
                      <strong>Live Chat:</strong> Available during business hours
                    </p>
                    <p className="text-sm">
                      <strong>Response Time:</strong> Within 24 hours
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
