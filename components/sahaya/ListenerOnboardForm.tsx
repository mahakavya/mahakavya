"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { ListenerCreateSchema, type ListenerCreateInput } from "@/lib/validators"

interface ListenerOnboardFormProps {
  onSuccess?: () => void
}

export function ListenerOnboardForm({ onSuccess }: ListenerOnboardFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expertiseInput, setExpertiseInput] = useState("")
  const { toast } = useToast()

  const form = useForm<ListenerCreateInput>({
    resolver: zodResolver(ListenerCreateSchema),
    defaultValues: {
      bio: "",
      expertise: [],
    },
  })

  const expertise = form.watch("expertise")

  const addExpertise = () => {
    const trimmed = expertiseInput.trim()
    if (trimmed && !expertise.includes(trimmed) && expertise.length < 8) {
      form.setValue("expertise", [...expertise, trimmed])
      setExpertiseInput("")
    }
  }

  const removeExpertise = (skill: string) => {
    form.setValue(
      "expertise",
      expertise.filter((s) => s !== skill),
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addExpertise()
    }
  }

  const onSubmit = async (data: ListenerCreateInput) => {
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/sahaya/listeners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({
          title: "Welcome as a listener!",
          description: "Your profile has been created. You can now add availability slots.",
        })
        onSuccess?.()
      } else {
        const error = await response.json()
        toast({
          title: "Failed to create profile",
          description: error.error || "Please try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Please check your connection and try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Bio */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About You</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Tell seekers about your background, approach, and what makes you a good listener..."
                  className="min-h-[120px] bg-white/60 backdrop-blur-md border-white/40"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Expertise */}
        <FormField
          control={form.control}
          name="expertise"
          render={() => (
            <FormItem>
              <FormLabel>Areas of Expertise</FormLabel>
              <div className="space-y-3">
                {/* Input */}
                <div className="flex space-x-2">
                  <Input
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., Anxiety, Relationships, Career"
                    className="bg-white/60 backdrop-blur-md border-white/40"
                    disabled={expertise.length >= 8}
                  />
                  <Button
                    type="button"
                    onClick={addExpertise}
                    disabled={!expertiseInput.trim() || expertise.length >= 8}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Tags */}
                {expertise.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {expertise.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 pr-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeExpertise(skill)}
                          className="ml-1 hover:text-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  Add 1-8 areas where you can provide support ({expertise.length}/8)
                </p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
          {isSubmitting ? "Creating Profile..." : "Become a Listener"}
        </Button>
      </form>
    </Form>
  )
}
