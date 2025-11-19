"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useFlagContent } from "@/hooks/useSamvaaha"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface FlagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentType: "post" | "comment"
  contentId: string
}

const FLAG_REASONS = [
  { value: "spam", label: "Spam or unwanted content" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech or discrimination" },
  { value: "violence", label: "Violence or threats" },
  { value: "misinformation", label: "False or misleading information" },
  { value: "inappropriate", label: "Inappropriate or offensive content" },
  { value: "copyright", label: "Copyright infringement" },
  { value: "other", label: "Other (please specify)" },
]

export function FlagDialog({ open, onOpenChange, contentType, contentId }: FlagDialogProps) {
  const flagContent = useFlagContent()
  const [selectedReason, setSelectedReason] = useState("")
  const [customReason, setCustomReason] = useState("")

  const handleSubmit = async () => {
    const reason = selectedReason === "other" ? customReason : selectedReason

    if (!reason.trim()) {
      toast.error("Please select or specify a reason")
      return
    }

    try {
      await flagContent.mutateAsync({
        content_type: contentType,
        content_id: contentId,
        reason: reason.trim(),
      })

      toast.success("Content reported successfully. Thank you for helping keep our community safe.")
      onOpenChange(false)
      setSelectedReason("")
      setCustomReason("")
    } catch (error) {
      toast.error("Failed to report content. Please try again.")
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setSelectedReason("")
    setCustomReason("")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report {contentType}</DialogTitle>
          <DialogDescription>
            Help us understand what's wrong with this {contentType}. Your report will be reviewed by our moderation
            team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Reason for reporting</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="mt-2">
              {FLAG_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="text-sm font-normal">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === "other" && (
            <div>
              <Label htmlFor="custom-reason" className="text-sm font-medium">
                Please specify
              </Label>
              <Textarea
                id="custom-reason"
                placeholder="Describe the issue..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="mt-1"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">{customReason.length}/500 characters</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={flagContent.isPending || !selectedReason || (selectedReason === "other" && !customReason.trim())}
          >
            {flagContent.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reporting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
