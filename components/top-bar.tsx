"use client"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AppSidebar } from "./app-sidebar"
import { NotificationBell } from "./notify/Bell"
import { SearchInput } from "./search/SearchInput"
import { SacredLogo } from "./sacred-logo"

export function TopBar() {
  return (
    <header className="sticky top-0 z-50 sacred-card border-b-2 border-amber-300 px-4 py-3">
      <div className="flex items-center gap-4">
        {/* Mobile sidebar trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-amber-700 hover:bg-amber-100"
              aria-label="Open sacred navigation menu"
              data-testid="mobile-menu-trigger"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <AppSidebar />
          </SheetContent>
        </Sheet>

        {/* Sacred Logo for Mobile */}
        <div className="md:hidden">
          <SacredLogo variant="icon" className="w-6 h-6" />
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-auto">
          <SearchInput />
        </div>

        {/* Sacred Actions */}
        <div className="flex items-center gap-2">
          <NotificationBell userId="temp-user-id" />
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-700 hover:bg-amber-100 font-medium"
            data-testid="sign-in-button"
            onClick={() => {
              console.log("Sacred sign in clicked")
            }}
          >
            🙏 Sign In
          </Button>
          <Button
            size="sm"
            className="sacred-ai-button font-bold"
            data-testid="create-account-button"
            onClick={() => {
              console.log("Sacred account creation clicked")
            }}
          >
            ✨ Join Sacred Journey
          </Button>
        </div>
      </div>
    </header>
  )
}
