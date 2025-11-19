"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ReelUploader } from "./ReelUploader"

interface ReelsHeaderProps {
  onReelCreated?: (reel: any) => void
}

export function ReelsHeader({ onReelCreated }: ReelsHeaderProps) {
  const [isUploaderOpen, setIsUploaderOpen] = useState(false)

  const handleReelCreated = (reel: any) => {
    setIsUploaderOpen(false)
    onReelCreated?.(reel)
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/40 px-4 py-3">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <h1 className="text-xl font-bold text-gray-900">Drishya</h1>

        <Dialog open={isUploaderOpen} onOpenChange={setIsUploaderOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <ReelUploader onReelCreated={handleReelCreated} onClose={() => setIsUploaderOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
