import { BarChart3, Calendar, Download, Edit2, MessageSquare, Plus, Settings, Smile, X } from 'lucide-react';
import type { TutorialPages } from '@3gaspo/app-ui/Tutorial';

export const tutorialPages = [
  {
    logo: '/moody.svg',
    title: 'Keep a mood journal',
    description: 'Record a mood and note each day, then look back to see how you’ve felt over time.',
  },
  {
    icon: Smile,
    title: 'Home',
    actions: [
      { icon: Smile, text: 'Tap to save today’s mood' },
      { icon: X, text: 'Clear the selected mood' },
      { icon: MessageSquare, text: 'Add a daily note' },
    ],
  },
  {
    icon: Calendar,
    title: 'Calendar',
    actions: [
      { icon: Calendar, text: 'Pick a date to edit its mood' },
      { icon: MessageSquare, text: 'Read or edit that day’s note' },
    ],
  },
  {
    icon: BarChart3,
    title: 'Statistics',
    actions: [
      { icon: Smile, text: 'See most frequent moods' },
      { icon: BarChart3, text: 'Compare moods over time' },
    ],
  },
  {
    icon: Settings,
    title: 'Settings',
    actions: [
      { icon: Plus, text: 'Add moods to your palette' },
      { icon: Edit2, text: 'Rename or recolour a mood' },
      { icon: Download, text: 'Export your journal as CSV' },
    ],
  },
] as const satisfies TutorialPages;
