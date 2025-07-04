'use server';

/**
 * @fileOverview An AI agent that generates a daily inspiring quote.
 *
 * - generateDailyQuote - A function that generates a daily quote.
 * - GenerateDailyQuoteInput - The input type for the generateDailyQuote function.
 * - GenerateDailyQuoteOutput - The return type for the generateDailyQuote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyQuoteInputSchema = z.object({
  topic: z
    .string()
    .optional()
    .describe('The topic of the quote. If not provided, a random topic will be chosen.'),
});
export type GenerateDailyQuoteInput = z.infer<typeof GenerateDailyQuoteInputSchema>;

const GenerateDailyQuoteOutputSchema = z.object({
  quote: z.string().describe('The generated inspiring quote.'),
});
export type GenerateDailyQuoteOutput = z.infer<typeof GenerateDailyQuoteOutputSchema>;

export async function generateDailyQuote(input: GenerateDailyQuoteInput): Promise<GenerateDailyQuoteOutput> {
  return generateDailyQuoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyQuotePrompt',
  input: {schema: GenerateDailyQuoteInputSchema},
  output: {schema: GenerateDailyQuoteOutputSchema},
  prompt: `You are an AI that generates inspiring quotes.

  {% if topic %}
  The quote should be about the following topic: {{topic}}.
  {% else %}
  The quote can be about any topic.
  {% endif %}
  
  Generate a quote that is no more than 20 words long.
  Quote:`,
});

const generateDailyQuoteFlow = ai.defineFlow(
  {
    name: 'generateDailyQuoteFlow',
    inputSchema: GenerateDailyQuoteInputSchema,
    outputSchema: GenerateDailyQuoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
