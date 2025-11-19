import { writeFileSync, mkdirSync, existsSync } from "fs"
import { dirname } from "path"

interface MissingPage {
  route: string
  heritageName: string
  filePath: string
  content: string
}

function createMissingPages() {
  const missingPages: MissingPage[] = [
    {
      route: "/niyantrana/ai",
      heritageName: "AI Insights",
      filePath: "app/(shell)/admin/ai/page.tsx",
      content: `"use client"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, AlertTriangle, TrendingUp, Users } from 'lucide-react'

export default function AIInsightsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="AI Insights" 
        subtitle="Copilot logs, AI flags, and moderation reports" 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Flags Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Moderated</CardTitle>
            <Brain className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Content auto-moderated</p>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">AI moderation accuracy</p>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Helped</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">Via AI assistance</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Recent AI Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'Spam', content: 'Promotional post detected', severity: 'medium' },
                { type: 'Harassment', content: 'Potentially harmful comment', severity: 'high' },
                { type: 'Misinformation', content: 'Unverified health claim', severity: 'high' },
                { type: 'Spam', content: 'Duplicate content detected', severity: 'low' }
              ].map((flag, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{flag.type}</div>
                    <div className="text-sm text-muted-foreground">{flag.content}</div>
                  </div>
                  <Badge variant={flag.severity === 'high' ? 'destructive' : flag.severity === 'medium' ? 'default' : 'secondary'}>
                    {flag.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader>
            <CardTitle>Moderation Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6">
                <Brain className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">AI Moderation Active</h3>
                <p className="text-muted-foreground">
                  Advanced AI systems are monitoring content and user interactions to maintain community safety.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}`,
    },
    {
      route: "/varta/groups",
      heritageName: "Varta Groups",
      filePath: "app/(shell)/varta/groups/page.tsx",
      content: `"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { AccessGate } from "@/components/access-gate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Users, MessageCircle, Crown } from 'lucide-react'

export default function VartaGroupsPage() {
  const [groups] = useState([
    {
      id: '1',
      name: 'Community Support',
      description: 'A safe space for community members to support each other',
      memberCount: 156,
      isPrivate: false,
      lastActivity: '2 hours ago',
      avatar: '/placeholder.svg?height=40&width=40'
    },
    {
      id: '2', 
      name: 'Cultural Exchange',
      description: 'Share and celebrate our diverse cultural heritage',
      memberCount: 89,
      isPrivate: false,
      lastActivity: '5 hours ago',
      avatar: '/placeholder.svg?height=40&width=40'
    },
    {
      id: '3',
      name: 'Fundraising Coordinators',
      description: 'Private group for campaign organizers',
      memberCount: 23,
      isPrivate: true,
      lastActivity: '1 day ago',
      avatar: '/placeholder.svg?height=40&width=40'
    }
  ])

  return (
    <AccessGate feature="messaging">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader 
            title="Varta Groups" 
            subtitle="Join group conversations and build community connections" 
          />
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card key={group.id} className="glass hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={group.avatar || "/placeholder.svg"} alt={group.name} />
                    <AvatarFallback>
                      <Users className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {group.name}
                      {group.isPrivate && <Crown className="h-4 w-4 text-amber-500" />}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{group.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{group.memberCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{group.lastActivity}</span>
                    </div>
                  </div>
                  <Badge variant={group.isPrivate ? "secondary" : "default"}>
                    {group.isPrivate ? "Private" : "Public"}
                  </Badge>
                </div>
                
                <Button className="w-full bg-transparent" variant="outline">
                  {group.isPrivate ? "Request to Join" : "Join Group"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {groups.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No groups yet</h3>
            <p className="text-muted-foreground mb-6">
              Create the first group to start building community connections
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create First Group
            </Button>
          </div>
        )}
      </div>
    </AccessGate>
  )
}`,
    },
    {
      route: "/terms",
      heritageName: "Terms of Use",
      filePath: "app/(shell)/legal/terms/page.tsx",
      content: `import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader 
        title="Terms of Use" 
        subtitle="Please read these terms carefully before using Mahakavya" 
      />
      
      <Card className="glass">
        <CardContent className="p-8 prose prose-gray max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Mahakavya, you accept and agree to be bound by the terms 
            and provision of this agreement.
          </p>
          
          <h2>2. Community Guidelines</h2>
          <p>
            Mahakavya is built on the principles of respect, cultural appreciation, and 
            meaningful connection. Users are expected to:
          </p>
          <ul>
            <li>Treat all community members with respect and dignity</li>
            <li>Share content that is authentic and constructive</li>
            <li>Respect cultural differences and promote understanding</li>
            <li>Report inappropriate behavior or content</li>
          </ul>
          
          <h2>3. User Content</h2>
          <p>
            You retain ownership of content you post on Mahakavya. However, by posting 
            content, you grant us a license to use, modify, and display that content 
            in connection with our services.
          </p>
          
          <h2>4. Privacy and Data Protection</h2>
          <p>
            Your privacy is important to us. Please review our Privacy Policy to understand 
            how we collect, use, and protect your information.
          </p>
          
          <h2>5. Prohibited Activities</h2>
          <p>Users may not:</p>
          <ul>
            <li>Post harmful, offensive, or illegal content</li>
            <li>Harass, bully, or threaten other users</li>
            <li>Spam or engage in commercial activities without permission</li>
            <li>Attempt to hack or compromise platform security</li>
          </ul>
          
          <h2>6. Account Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms 
            or engage in behavior harmful to the community.
          </p>
          
          <h2>7. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of Mahakavya 
            constitutes acceptance of any changes.
          </p>
          
          <h2>8. Contact Information</h2>
          <p>
            If you have questions about these terms, please contact us at legal@mahakavya.com
          </p>
          
          <p className="text-sm text-muted-foreground mt-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}`,
    },
    {
      route: "/privacy",
      heritageName: "Privacy Policy",
      filePath: "app/(shell)/legal/privacy/page.tsx",
      content: `import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader 
        title="Privacy Policy" 
        subtitle="How we collect, use, and protect your information" 
      />
      
      <Card className="glass">
        <CardContent className="p-8 prose prose-gray max-w-none">
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as:</p>
          <ul>
            <li>Account information (name, email, profile details)</li>
            <li>Content you post (posts, comments, messages)</li>
            <li>Payment information for subscriptions</li>
            <li>Communication preferences</li>
          </ul>
          
          <h2>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and improve our services</li>
            <li>Personalize your experience</li>
            <li>Communicate with you about updates and features</li>
            <li>Process payments and subscriptions</li>
            <li>Ensure platform security and prevent abuse</li>
          </ul>
          
          <h2>3. Information Sharing</h2>
          <p>
            We do not sell your personal information. We may share information in 
            limited circumstances:
          </p>
          <ul>
            <li>With your consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and prevent fraud</li>
            <li>With service providers who help operate our platform</li>
          </ul>
          
          <h2>4. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your information, 
            including encryption, secure servers, and regular security audits.
          </p>
          
          <h2>5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and update your personal information</li>
            <li>Delete your account and associated data</li>
            <li>Control your privacy settings</li>
            <li>Opt out of marketing communications</li>
            <li>Request a copy of your data</li>
          </ul>
          
          <h2>6. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to improve your experience, 
            analyze usage patterns, and provide personalized content.
          </p>
          
          <h2>7. Children's Privacy</h2>
          <p>
            Mahakavya is not intended for children under 13. We do not knowingly 
            collect personal information from children under 13.
          </p>
          
          <h2>8. International Users</h2>
          <p>
            If you are accessing Mahakavya from outside India, please be aware that 
            your information may be transferred to and processed in India.
          </p>
          
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you 
            of any material changes via email or platform notification.
          </p>
          
          <h2>10. Contact Us</h2>
          <p>
            If you have questions about this privacy policy, please contact us at 
            privacy@mahakavya.com
          </p>
          
          <p className="text-sm text-muted-foreground mt-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}`,
    },
    {
      route: "/help",
      heritageName: "Help Center",
      filePath: "app/(shell)/help/page.tsx",
      content: `"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, HelpCircle, MessageCircle, Shield, CreditCard, Users } from 'lucide-react'

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  
  const categories = [
    {
      icon: Users,
      title: "Getting Started",
      description: "Learn the basics of using Mahakavya",
      articles: [
        "Creating your first post",
        "Setting up your profile", 
        "Understanding community guidelines",
        "Navigating the platform"
      ]
    },
    {
      icon: MessageCircle,
      title: "Messaging & Communication",
      description: "Chat, groups, and staying connected",
      articles: [
        "Sending private messages",
        "Joining group conversations",
        "Managing notifications",
        "Blocking and reporting users"
      ]
    },
    {
      icon: CreditCard,
      title: "Subscriptions & Payments",
      description: "Billing, plans, and premium features",
      articles: [
        "Choosing the right plan",
        "Managing your subscription",
        "Payment methods and billing",
        "Canceling your subscription"
      ]
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Keeping your account safe",
      articles: [
        "Privacy settings and controls",
        "Two-factor authentication",
        "Reporting inappropriate content",
        "Data export and deletion"
      ]
    }
  ]
  
  const faqs = [
    {
      question: "How do I change my subscription plan?",
      answer: "You can upgrade or downgrade your plan anytime from the Yojana (Plans) page in your account settings."
    },
    {
      question: "Can I use Mahakavya offline?",
      answer: "Yes! Mahakavya works offline for basic features like reading posts and messages you've already loaded."
    },
    {
      question: "How do I report inappropriate content?",
      answer: "Click the three dots menu on any post or message and select 'Report'. Our moderation team will review it promptly."
    },
    {
      question: "Is my data secure on Mahakavya?",
      answer: "Absolutely. We use industry-standard encryption and security measures to protect your personal information."
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="Help Center" 
        subtitle="Find answers to your questions and get support" 
      />
      
      {/* Search */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category, index) => (
          <Card key={index} className="glass hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <category.icon className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {category.articles.map((article, articleIndex) => (
                  <li key={articleIndex}>
                    <a 
                      href="#" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {article}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* FAQs */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5" />
            <span>Frequently Asked Questions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
              <h3 className="font-medium mb-2">{faq.question}</h3>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Contact Support */}
      <Card className="glass">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
          <p className="text-muted-foreground mb-4">
            Our support team is here to help you with any questions or issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Badge variant="outline" className="p-2">
              📧 support@mahakavya.com
            </Badge>
            <Badge variant="outline" className="p-2">
              💬 Live Chat (9 AM - 6 PM IST)
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}`,
    },
    {
      route: "/contact",
      heritageName: "Contact Us",
      filePath: "app/(shell)/contact/page.tsx",
      content: `"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: "Message sent!",
      description: "We'll get back to you within 24 hours."
    })
    
    setFormData({
      name: "",
      email: "",
      subject: "",
      category: "",
      message: ""
    })
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="Contact Us" 
        subtitle="Get in touch with our team - we're here to help" 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="billing">Billing & Subscriptions</SelectItem>
                      <SelectItem value="feedback">Feedback & Suggestions</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="press">Press & Media</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                  />
                </div>
                
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Contact Information */}
        <div className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Get in touch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">support@mahakavya.com</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">+91 (800) 123-4567</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">
                    Mahakavya Technologies<br />
                    Bangalore, Karnataka<br />
                    India
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">Support Hours</p>
                  <p className="text-sm text-muted-foreground">
                    Monday - Friday<br />
                    9:00 AM - 6:00 PM IST
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardHeader>
              <CardTitle>Our Team</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Mahakavya is built by a passionate team dedicated to connecting communities 
                and celebrating cultural heritage through technology.
              </p>
              <p className="text-sm text-muted-foreground">
                We're always excited to hear from our users and learn how we can make 
                Mahakavya even better for everyone.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}`,
    },
    // Additional missing pages that need to be created
    {
      route: "/niyantrana/fundraisers",
      heritageName: "Fundraising Admin",
      filePath: "app/(shell)/admin/fundraisers/page.tsx",
      content: `"use client"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, XCircle, AlertTriangle, Eye, DollarSign } from 'lucide-react'

export default function FundraisingAdminPage() {
  const campaigns = [
    {
      id: '1',
      title: 'Help Build Community Center',
      creator: 'Priya Sharma',
      avatar: '/placeholder.svg?height=40&width=40',
      goal: 500000,
      raised: 125000,
      status: 'pending',
      flagged: false,
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'Medical Emergency Fund',
      creator: 'Raj Kumar',
      avatar: '/placeholder.svg?height=40&width=40',
      goal: 200000,
      raised: 180000,
      status: 'approved',
      flagged: false,
      createdAt: '2024-01-10'
    },
    {
      id: '3',
      title: 'Education Support Initiative',
      creator: 'Anita Desai',
      avatar: '/placeholder.svg?height=40&width=40',
      goal: 300000,
      raised: 45000,
      status: 'flagged',
      flagged: true,
      createdAt: '2024-01-12'
    }
  ]

  const getStatusBadge = (status: string, flagged: boolean) => {
    if (flagged) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Flagged</Badge>
    }
    
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="secondary">Pending Review</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Fundraising Admin" 
        subtitle="Review and manage fundraising campaigns" 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Campaigns awaiting approval</p>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹2.4M</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Campaigns</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="glass">
        <CardHeader>
          <CardTitle>Campaign Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={campaign.avatar || "/placeholder.svg"} alt={campaign.creator} />
                    <AvatarFallback>{campaign.creator.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{campaign.title}</h3>
                    <p className="text-sm text-muted-foreground">by {campaign.creator}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm">₹{campaign.raised.toLocaleString()} / ₹{campaign.goal.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">{campaign.createdAt}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {getStatusBadge(campaign.status, campaign.flagged)}
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    {campaign.status === 'pending' && (
                      <>
                        <Button size="sm" variant="default">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive">
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}`,
    },
    {
      route: "/niyantrana/settings",
      heritageName: "Niyantrana Setup",
      filePath: "app/(shell)/admin/settings/page.tsx",
      content: `"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Shield, Globe, Bell, CreditCard, Users } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "Mahakavya",
    siteDescription: "Connect, Share, and Celebrate Cultural Heritage",
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    moderationEnabled: true,
    autoModerationLevel: "medium",
    maxFileSize: "10",
    allowedFileTypes: "jpg,png,gif,mp4,pdf",
    defaultLanguage: "en",
    timezone: "Asia/Kolkata",
    emailNotifications: true,
    pushNotifications: true,
    analyticsEnabled: true,
    backupFrequency: "daily"
  })
  
  const { toast } = useToast()

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Platform settings have been updated successfully."
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Platform Settings" 
        subtitle="Configure platform-wide settings and preferences" 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>General Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultLanguage">Default Language</Label>
              <Select value={settings.defaultLanguage} onValueChange={(value) => setSettings({...settings, defaultLanguage: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="bn">Bengali</SelectItem>
                  <SelectItem value="ta">Tamil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security & Access</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="registrationEnabled">User Registration</Label>
              <Switch
                id="registrationEnabled"
                checked={settings.registrationEnabled}
                onCheckedChange={(checked) => setSettings({...settings, registrationEnabled: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="emailVerificationRequired">Email Verification Required</Label>
              <Switch
                id="emailVerificationRequired"
                checked={settings.emailVerificationRequired}
                onCheckedChange={(checked) => setSettings({...settings, emailVerificationRequired: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="moderationEnabled">Content Moderation</Label>
              <Switch
                id="moderationEnabled"
                checked={settings.moderationEnabled}
                onCheckedChange={(checked) => setSettings({...settings, moderationEnabled: checked})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="autoModerationLevel">Auto-Moderation Level</Label>
              <Select value={settings.autoModerationLevel} onValueChange={(value) => setSettings({...settings, autoModerationLevel: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="strict">Strict</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* File Upload Settings */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>File Upload</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => setSettings({...settings, maxFileSize: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
              <Input
                id="allowedFileTypes"
                value={settings.allowedFileTypes}
                onChange={(e) => setSettings({...settings, allowedFileTypes: e.target.value})}
                placeholder="jpg,png,gif,mp4,pdf"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="pushNotifications">Push Notifications</Label>
              <Switch
                id="pushNotifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="analyticsEnabled">Analytics Tracking</Label>
              <Switch
                id="analyticsEnabled"
                checked={settings.analyticsEnabled}
                onCheckedChange={(checked) => setSettings({...settings, analyticsEnabled: checked})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <Select value={settings.backupFrequency} onValueChange={(value) => setSettings({...settings, backupFrequency: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} className="px-8">
          Save Settings
        </Button>
      </div>
    </div>
  )
}`,
    },
    {
      route: "/nivedana/create",
      heritageName: "Nivedana Nirmana",
      filePath: "app/(shell)/nivedana/create/page.tsx",
      content: `"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { AccessGate } from "@/components/access-gate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, Heart, Target, Users, Calendar } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export default function CreateCampaignPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    goalAmount: "",
    duration: "",
    beneficiary: "",
    story: "",
    images: [] as File[]
  })
  const { toast } = useToast()

  const categories = [
    "Medical Emergency",
    "Education Support", 
    "Community Development",
    "Disaster Relief",
    "Animal Welfare",
    "Environmental Cause",
    "Arts & Culture",
    "Sports & Recreation"
  ]

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = () => {
    toast({
      title: "Campaign submitted!",
      description: "Your campaign is under review and will be published soon."
    })
  }

  const progress = (step / 4) * 100

  return (
    <AccessGate feature="fundraising">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader 
          title="Create Fundraising Campaign" 
          subtitle="Start your journey to make a positive impact" 
        />
        
        {/* Progress Bar */}
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Step {step} of 4</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Basic Info</span>
              <span>Details</span>
              <span>Story</span>
              <span>Review</span>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Campaign Title</Label>
                <Input
                  id="title"
                  placeholder="Give your campaign a compelling title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goalAmount">Goal Amount (₹)</Label>
                  <Input
                    id="goalAmount"
                    type="number"
                    placeholder="100000"
                    value={formData.goalAmount}
                    onChange={(e) => setFormData({...formData, goalAmount: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Campaign Duration</Label>
                  <Select value={formData.duration} onValueChange={(value) => setFormData({...formData, duration: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="120">120 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe what your campaign is about"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Campaign Details */}
        {step === 2 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Campaign Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="beneficiary">Beneficiary Information</Label>
                <Textarea
                  id="beneficiary"
                  placeholder="Who will benefit from this campaign? Provide details about the person or cause."
                  rows={4}
                  value={formData.beneficiary}
                  onChange={(e) => setFormData({...formData, beneficiary: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Campaign Images</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">Upload images to make your campaign more compelling</p>
                  <Button variant="outline">Choose Files</Button>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB each. Maximum 5 images.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Your Story */}
        {step === 3 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span>Tell Your Story</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="story">Campaign Story</Label>
                <Textarea
                  id="story"
                  placeholder="Share the full story behind your campaign. What happened? Why do you need help? How will the funds be used? Be honest and detailed to build trust with potential donors."
                  rows={10}
                  value={formData.story}
                  onChange={(e) => setFormData({...formData, story: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">
                  A compelling story increases your chances of success. Include specific details and explain how donations will be used.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Review & Submit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{formData.title}</h3>
                  <Badge variant="secondary">{formData.category}</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Goal Amount</p>
                    <p className="font-semibold">₹{formData.goalAmount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-semibold">{formData.duration} days</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{formData.description}</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Before you submit:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Your campaign will be reviewed by our team</li>
                    <li>• Review typically takes 24-48 hours</li>
                    <li>• You'll be notified once your campaign is approved</li>
                    <li>• Make sure all information is accurate and complete</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={step === 1}
          >
            Previous
          </Button>
          
          {step < 4 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              Submit Campaign
            </Button>
          )}
        </div>
      </div>
    </AccessGate>
  )
}`,
    },
  ]

  console.log("Creating missing pages...")

  for (const page of missingPages) {
    try {
      // Create directory if it doesn't exist
      const dir = dirname(page.filePath)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
        console.log(`Created directory: ${dir}`)
      }

      // Write the file
      writeFileSync(page.filePath, page.content)
      console.log(`✅ Created: ${page.filePath} (${page.heritageName})`)
    } catch (error) {
      console.error(`❌ Failed to create ${page.filePath}:`, error)
    }
  }

  console.log("\n🎉 Missing pages created successfully!")
}

export { createMissingPages }
