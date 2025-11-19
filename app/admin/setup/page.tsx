import { AdminSetup } from "@/components/admin/AdminSetup"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Zap, Users, BarChart3 } from "lucide-react"

export default function AdminSetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            <Shield className="h-3 w-3 mr-1" />
            Platform Administration
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Admin Setup
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Set up the first admin user for your Mahakavya Social platform. Admin users have full access to all features
            and management tools.
          </p>
        </div>

        {/* Main Setup Component */}
        <div className="mb-8">
          <AdminSetup />
        </div>

        {/* Additional Information */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Zap className="h-5 w-5" />
                Instant Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-blue-700">
                Admin privileges are granted immediately. No waiting period or approval process required.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Users className="h-5 w-5" />
                Full Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-green-700">
                Manage users, moderate content, and configure platform settings with complete administrative control.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <BarChart3 className="h-5 w-5" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-purple-700">
                Access detailed analytics, user insights, and platform performance metrics through the admin dashboard.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <Card className="mt-8 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <Shield className="h-5 w-5" />
              Security Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-amber-800">
              Admin privileges grant full access to all platform data and settings. Only promote trusted users to admin
              status. You can revoke admin access at any time through the user management panel.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
