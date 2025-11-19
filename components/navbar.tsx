"use client";

import Link from "next/link";
import { LogOut, Home, Plus, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:left-0 md:top-0 md:w-64 md:h-screen md:border-t-0 md:border-r md:bottom-auto flex md:flex-col gap-4 p-4 md:p-6">
      <Link href="/feed" className="hidden md:block">
        <h1 className="text-2xl font-bold text-primary mb-8">Mahakavya</h1>
      </Link>

      <div className="flex md:flex-col gap-4 flex-1 md:flex-none md:gap-0">
        <Link href="/feed" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted transition-colors">
          <Home className="w-6 h-6" />
          <span className="hidden md:inline">Feed</span>
        </Link>

        <Link href="/create" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted transition-colors">
          <Plus className="w-6 h-6" />
          <span className="hidden md:inline">Create</span>
        </Link>

        <Link href="/profile" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted transition-colors">
          <User className="w-6 h-6" />
          <span className="hidden md:inline">Profile</span>
        </Link>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="w-full md:w-auto flex items-center gap-3 justify-center md:justify-start px-4 py-2 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
      >
        <LogOut className="w-6 h-6" />
        <span className="hidden md:inline">Logout</span>
      </Button>
    </nav>
  );
}
