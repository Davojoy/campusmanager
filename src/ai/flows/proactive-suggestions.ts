// 'use server';
/**
 * @fileOverview Generates proactive suggestions for admins or teachers based on student data.
 *
 * - generateProactiveSuggestions - A function that generates proactive suggestions.
 * - ProactiveSuggestionsInput - The input type for the generateProactiveSuggestions function.
 * - ProactiveSuggestionsOutput - The return type for the generateProactiveSuggestions function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProactiveSuggestionsInputSchema = z.object({
  studentsData: z
    .string()
    .describe(
      'A string containing data of the student, with information on grades and attendance.'
    ),
  userRole: z.enum(['admin', 'teacher']).describe('The role of the user.'),
});
export type ProactiveSuggestionsInput = z.infer<typeof ProactiveSuggestionsInputSchema>;

const ProactiveSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of proactive suggestions for the user.'),
});
export type ProactiveSuggestionsOutput = z.infer<typeof ProactiveSuggestionsOutputSchema>;

export async function generateProactiveSuggestions(
  input: ProactiveSuggestionsInput
): Promise<ProactiveSuggestionsOutput> {
  return generateProactiveSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'proactiveSuggestionsPrompt',
  input: {schema: ProactiveSuggestionsInputSchema},
  output: {schema: ProactiveSuggestionsOutputSchema},
  prompt: `You are an AI assistant designed to provide proactive suggestions to {{userRole}} based on student data.  

Analyze the following student data and generate a list of suggestions. Suggestions should be specific and actionable. 

Student Data: {{{studentsData}}}

Suggestions:`,
});

const generateProactiveSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateProactiveSuggestionsFlow',
    inputSchema: ProactiveSuggestionsInputSchema,
    outputSchema: ProactiveSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
