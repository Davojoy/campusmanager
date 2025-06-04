// 'use server';
/**
 * @fileOverview Generates context-aware announcements for different user roles.
 *
 * - generateContextAwareAnnouncement - A function that generates tailored announcements.
 * - GenerateContextAwareAnnouncementInput - The input type for the generateContextAwareAnnouncement function.
 * - GenerateContextAwareAnnouncementOutput - The return type for the generateContextAwareAnnouncement function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateContextAwareAnnouncementInputSchema = z.object({
  announcementContent: z
    .string()
    .describe('The original announcement content to be adapted.'),
});

export type GenerateContextAwareAnnouncementInput = z.infer<
  typeof GenerateContextAwareAnnouncementInputSchema
>;

const GenerateContextAwareAnnouncementOutputSchema = z.object({
  studentAnnouncement: z
    .string()
    .describe('The announcement tailored for students.'),
  teacherAnnouncement: z
    .string()
    .describe('The announcement tailored for teachers.'),
  administratorAnnouncement: z
    .string()
    .describe('The announcement tailored for administrators.'),
});

export type GenerateContextAwareAnnouncementOutput = z.infer<
  typeof GenerateContextAwareAnnouncementOutputSchema
>;

export async function generateContextAwareAnnouncement(
  input: GenerateContextAwareAnnouncementInput
): Promise<GenerateContextAwareAnnouncementOutput> {
  return generateContextAwareAnnouncementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContextAwareAnnouncementPrompt',
  input: {schema: GenerateContextAwareAnnouncementInputSchema},
  output: {schema: GenerateContextAwareAnnouncementOutputSchema},
  prompt: `You are an expert at tailoring announcements for different audiences.

  Adapt the following announcement to be relevant and informative for students, teachers, and administrators. Provide three distinct announcements in the output schema.

  Original Announcement: {{{announcementContent}}}`,
});

const generateContextAwareAnnouncementFlow = ai.defineFlow(
  {
    name: 'generateContextAwareAnnouncementFlow',
    inputSchema: GenerateContextAwareAnnouncementInputSchema,
    outputSchema: GenerateContextAwareAnnouncementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
