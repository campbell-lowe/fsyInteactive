const scriptureUrl = 'https://www.churchofjesuschrist.org/study/scriptures/nt/1-cor/6?lang=eng&id=p19-p20#p19';

export const octoberBoard = {
  id: 'october-body-sacred-board',
  title: 'Your Body Is Sacred',
  subtitle: 'A shared tabletop adventure through identity, care, respect, and wise choices.',
  finishLabel: 'The Lookout',
  spaces: [
    { id: 'start', label: 'Start', type: 'start', row: 4, column: 1 },
    { id: 'village', label: 'Village of Identity', type: 'challenge', row: 4, column: 2, prompt: 'A message says appearance determines worth. What could your team put on the village sign instead?', options: ['Every person is a beloved child of God.', 'Popularity tells us who matters.', 'Worth is earned by looking perfect.'], resource: { label: 'Genesis 1:27', url: 'https://www.churchofjesuschrist.org/study/scriptures/ot/gen/1?lang=eng&id=p27#p27' } },
    { id: 'garden', label: 'Garden of Care', type: 'choice', row: 4, column: 3, prompt: 'A fictional student feels worn out. Which choice would be the kindest first step?', options: ['One more hour of comparison online.', 'A good night of rest.', 'A harsh self-critique.'] },
    { id: 'bridge', label: 'Bridge of Respect', type: 'group', row: 4, column: 4, prompt: 'A group chat turns someone’s appearance into a joke. What could the whole group do to protect dignity?', resource: { label: 'The Sanctity of the Body', url: 'https://www.churchofjesuschrist.org/study/general-conference/2005/10/the-sanctity-of-the-body?lang=eng' } },
    { id: 'crossroads', label: 'Crossroads', type: 'event', row: 3, column: 4, event: 'A trusted friend helps you pause before pressure takes over.', effect: 1 },
    { id: 'path', label: 'Path of Choices', type: 'choice', row: 3, column: 3, prompt: 'Pressure makes a choice feel rushed. What should happen first?', options: ['Pause and notice the pressure.', 'Follow the loudest voice.', 'Decide before thinking about consequences.'] },
    { id: 'shortcut', label: 'Kindness Shortcut', type: 'shortcut', row: 3, column: 2, destination: 'light', prompt: 'A team notices someone being left out and makes room for them. Take the shortcut.' },
    { id: 'story', label: 'Story Stop', type: 'story', row: 3, column: 1, prompt: 'Share a fictional example of someone choosing respect over comparison. No personal stories are needed.' },
    { id: 'temple', label: 'Temple Garden', type: 'challenge', row: 2, column: 1, prompt: 'Choose three words that describe how a person can care for a sacred gift.', options: ['Gratitude', 'Pressure', 'Rest', 'Respect', 'Comparison'], resource: { label: '1 Corinthians 6:19–20', url: scriptureUrl } },
    { id: 'event-care', label: 'Gentle Reminder', type: 'event', row: 2, column: 2, event: 'The team remembers that growth does not need to be perfect. Move ahead one space.', effect: 1 },
    { id: 'respect', label: 'Respect Ridge', type: 'group', row: 2, column: 3, prompt: 'Each team names one way words, media, or boundaries can show respect without sharing personal experiences.' },
    { id: 'fork', label: 'Fork in the Road', type: 'choice', row: 2, column: 4, prompt: 'Which path protects both body and spirit when a choice feels unsafe?', options: ['Ask for trusted help.', 'Keep it secret to avoid awkwardness.', 'Let pressure make the decision.'] },
    { id: 'lookout-path', label: 'Light Trail', type: 'story', row: 1, column: 4, prompt: 'Read the next space aloud and let the team imagine what their piece can see from the trail.' },
    { id: 'dawn', label: 'Dawn Meadow', type: 'event', row: 1, column: 3, event: 'A teammate shares a helpful idea. Move ahead one space together.', effect: 1 },
    { id: 'reflection', label: 'Reflection Grove', type: 'challenge', row: 1, column: 2, prompt: 'Complete this sentence with a practical, private action: “Because my body is sacred, I can…”', options: ['Care for myself with gratitude.', 'Compare myself more often.', 'Ignore what my body needs.'] },
    { id: 'finish', label: 'The Lookout', type: 'finish', row: 1, column: 1 },
  ],
};

export const spaceTypeLabels = {
  start: 'Start',
  challenge: 'Challenge',
  choice: 'Choice',
  event: 'Event',
  shortcut: 'Shortcut',
  group: 'Group Challenge',
  story: 'Story',
  finish: 'Finish',
};
