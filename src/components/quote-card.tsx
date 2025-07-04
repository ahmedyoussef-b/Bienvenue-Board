"use client"

import { useEffect, useState } from "react"
import { Quote } from "lucide-react"

import { getDailyQuoteAction } from "@/app/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function QuoteCard() {
  const [quote, setQuote] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuote = async () => {
      setLoading(true)
      try {
        const newQuote = await getDailyQuoteAction()
        setQuote(newQuote)
      } catch (error) {
        setQuote("Failed to fetch a quote. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchQuote()
  }, [])

  return (
    <Card className="w-full max-w-lg bg-card/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-lg text-primary">
          <Quote className="h-5 w-5" />
          <span>Quote of the Day</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <blockquote className="border-l-2 border-primary pl-4 text-lg italic text-foreground/90">
            "{quote}"
          </blockquote>
        )}
      </CardContent>
    </Card>
  )
}
