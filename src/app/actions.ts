"use server"

import { generateDailyQuote } from "@/ai/flows/generate-daily-quote"

export async function getDailyQuoteAction() {
  try {
    const result = await generateDailyQuote({})
    return result.quote
  } catch (error) {
    console.error("Error generating daily quote:", error)
    return "Could not generate a quote at this time. Please try again later."
  }
}
