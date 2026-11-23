import type { FeatureSection } from '@3gaspo/app-ui/Tutorial';

export const featureGuide = [
  {
    title: 'Your daily entry',
    entries: [
      { title: 'Pick a mood', text: 'Tap a colour on Home to save that mood for today. Tap another colour to change it. The banner shows your current choice.' },
      { title: 'Add a note', text: 'Use Daily Note to record what happened or how you felt. Press Save or leave the field to save it. A day can have a mood, a note, or both.' },
      { title: 'Clear your mood', text: 'Clear Mood removes the mood from today’s entry and keeps the note.' },
    ],
  },
  {
    title: 'Calendar and past entries',
    entries: [
      { title: 'Browse by date', text: 'Move between months with the arrow buttons. A colour marks the mood for that date and a speech bubble marks a saved note.' },
      { title: 'Edit a date', text: 'Select a date to add or change its mood or note. Remove Mood Color keeps the note. Delete entry removes both the mood and note for that date.' },
    ],
  },
  {
    title: 'Statistics and mood frequency',
    entries: [
      { title: 'Most frequent moods', text: 'The week, month and year cards show the mood recorded most often in each current period. If several moods share first place, Moody shows all of them.' },
      { title: 'Current and Average', text: 'Current uses the selected calendar week, month or year. Average uses all logged moods across your history. Note-only dates do not contribute to mood percentages.', formula: 'Mood percentage = 100 × days with this mood ÷ days with a logged mood' },
    ],
  },
  {
    title: 'Mood palette',
    entries: [
      { title: 'Add or edit moods', text: 'Choose a name and colour in Settings. Edit an existing mood to rename or recolour it across the journal.' },
      { title: 'Delete a mood', text: 'Deleting a mood removes that choice from linked dates and keeps their notes. Your palette can be empty until you add a mood or restore the defaults.' },
    ],
  },
  {
    title: 'Settings, export and resets',
    entries: [
      { title: 'Appearance, account and CSV', text: 'Switch between light and dark, manage your sign-in or download your dates, moods and notes as CSV. Local data stays in this browser. Firebase data follows the signed-in account.' },
      { title: 'Restore Default Moods', text: 'Replace the palette with the starting moods while keeping the journal. Dates tied to a removed custom mood keep their notes.' },
      { title: 'Clear History or Reset All', text: 'Clear History removes journal entries and keeps the palette. Reset All removes entries, restores the default palette and returns the theme to light.' },
    ],
  },
] as const satisfies readonly FeatureSection[];
