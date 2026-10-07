const octoberMagazineArticle = (slug, title) => ({
  issue: 'For the Strength of Youth · October 2026',
  title,
  url: `https://www.churchofjesuschrist.org/study/ftsoy/2026/10/${slug}?lang=eng`,
});

export const octoberMagazineIssue = {
  title: 'For the Strength of Youth October 2026',
  url: 'https://www.churchofjesuschrist.org/study/ftsoy/2026/10?lang=eng',
  articles: {
    identity: octoberMagazineArticle('02-god-knows-and-loves-you', 'God Knows and Loves You'),
    revelation: octoberMagazineArticle('03-7-ways-to-increase-the-flow-of-revelation', '7 Ways to Increase the Flow of Revelation'),
    hope: octoberMagazineArticle('04-we-can-find-hope', 'We Can Find Hope'),
    prompting: octoberMagazineArticle('05-prompting-at-the-pool', 'Prompting at the Pool'),
    integrity: octoberMagazineArticle('i-didnt-steal-or-cheat', 'I Didn’t Steal or Cheat'),
    direction: octoberMagazineArticle('07-becoming-your-best-you', 'Becoming Your Best You'),
    gifts: octoberMagazineArticle('09-god-can-use-your-gifts', 'God Can Use Your Gifts'),
    perseverance: octoberMagazineArticle('10-earning-belts-and-trusting-god', 'Earning Belts and Trusting God'),
  },
};

export const octoberLesson = {
  id: 'october-your-body-is-sacred',
  month: 'October',
  moduleNumber: 10,
  title: 'Your Body Is Sacred',
  shortDescription: 'A team adventure about identity, care, respect, agency, and living with light.',
  locations: [
    {
      id: 'identity',
      number: '01',
      name: 'Village of Identity',
      objective: 'Recognize divine identity.',
      scene: 'Every person in the village carries a light that comes from being a child of God. The team must name what makes that identity steady when outside messages get loud.',
      prompt: 'A fictional student hears a social media message say that appearance determines worth. What truth could the team place on the village sign instead?',
      challenge: { label: 'Choose the village sign', instruction: 'Read the three signs aloud. Teams point to or hold up the sign they would place at the village entrance.', options: ['Worth is earned by looking perfect.', 'Every person is a beloved child of God.', 'Popularity tells us who matters.'] },
      reveal: 'Our worth comes from being a beloved child of God, not from appearance, performance, popularity, or comparison.',
      discussion: 'How might that truth change the way we speak to ourselves and others?',
      resource: { label: 'Genesis 1:27', url: 'https://www.churchofjesuschrist.org/study/scriptures/ot/gen/1?lang=eng&id=p27#p27' },
    },
    {
      id: 'care',
      number: '02',
      name: 'Garden of Care',
      objective: 'Practice caring for the body.',
      scene: 'The garden grows through small, faithful acts rather than one perfect day. The team chooses which habits help a person receive the body as a gift.',
      prompt: 'A fictional student has a full week and feels worn out. Which two choices would be a kind way to care for body and spirit: rest, movement, nourishing food, quiet prayer, or asking for help?',
      challenge: { label: 'Pack the care kit', instruction: 'Choose the first item you would put in a fictional student’s care kit. Teams can call out their pick or hold up an answer card.', options: ['A good night of rest', 'A harsh self-critique', 'Nourishing food and water', 'A trusted person to ask for help', 'One more hour of comparison online'] },
      reveal: 'Caring for the body can include rest, nourishment, movement, cleanliness, safety, prayer, and asking trusted people for help.',
      discussion: 'Why is care more helpful than criticism when we are trying to grow?',
      resource: { label: '1 Corinthians 6:19–20', url: 'https://www.churchofjesuschrist.org/study/scriptures/nt/1-cor/6?lang=eng&id=p19-p20#p19' },
    },
    {
      id: 'respect',
      number: '03',
      name: 'Bridge of Respect',
      objective: 'Respect ourselves and others.',
      scene: 'The bridge connects two communities. It only stays strong when words, boundaries, clothing, media, and choices show respect for the worth of every person.',
      prompt: 'A fictional group chat turns someone’s appearance into a joke. What could a teammate say or do that protects dignity without adding more embarrassment?',
      challenge: { label: 'Rescue the conversation', instruction: 'Teams choose the response that protects dignity and moves the conversation somewhere better.', options: ['Add another joke so it feels less awkward.', 'Say, “Let’s not make someone’s body the punchline,” then change the subject.', 'Forward the message to a larger group.'] },
      reveal: 'Respect means remembering that every body belongs to a real person with divine worth. We can set boundaries, change the subject, speak up, and seek help.',
      discussion: 'What makes a response both courageous and kind?',
      resource: { label: 'The Sanctity of the Body', url: 'https://www.churchofjesuschrist.org/study/general-conference/2005/10/the-sanctity-of-the-body?lang=eng' },
    },
    {
      id: 'choices',
      number: '04',
      name: 'Path of Choices',
      objective: 'Use agency with wisdom.',
      scene: 'The path divides at every decision. The map does not ask for a perfect answer; it asks the team to notice consequences, seek the Spirit, and choose what invites peace and strength.',
      prompt: 'A fictional student is pressured to try something that could harm body or spirit. What are three steps they could take before deciding?',
      challenge: { label: 'Cross the crossroads', instruction: 'Put these moves in the order your team would use when pressure makes a choice feel rushed.', options: ['Pause and notice the pressure.', 'Think about consequences and seek trusted counsel.', 'Choose the path that protects body and spirit.'] },
      reveal: 'Pause, pray, consider consequences, use trusted counsel, and choose what protects the body and invites the Spirit.',
      discussion: 'How can planning ahead make a wise choice easier in a pressured moment?',
      resource: { label: 'FSY: Your Body Is Sacred', url: 'https://www.churchofjesuschrist.org/study/manual/for-the-strength-of-youth/10-your-body-is-sacred?lang=eng' },
    },
    {
      id: 'light',
      number: '05',
      name: 'Light of Christ',
      objective: 'Apply one uplifting principle.',
      scene: 'At the final overlook, each team carries one piece of light from the journey. The class combines them into a practical invitation for the week ahead.',
      prompt: 'What is one practical way to show gratitude for the body this week?',
      challenge: { label: 'Light the lookout', instruction: 'Each team offers one specific, private, realistic action. The host can click the guide when the class has collected a few ideas.', options: ['Care for my body with one small act of gratitude.', 'Speak about myself and others with more respect.', 'Ask for help when a choice feels unsafe or confusing.'] },
      reveal: 'Small, loving choices can turn belief into discipleship. We honor the gift by caring for ourselves, respecting others, and inviting God into our decisions.',
      discussion: 'What is one specific, private, and realistic action someone could try this week?',
      resource: { label: 'Doctrine and Covenants 88:15–16', url: 'https://www.churchofjesuschrist.org/study/scriptures/dc-testament/dc/88?lang=eng&id=p15-p16#p15' },
    },
  ],
};

export const scriptureSources = [
  { reference: '1 Corinthians 6:19–20', title: 'Your body is a temple', note: 'Paul teaches that our bodies are sacred and worth honoring.', url: 'https://www.churchofjesuschrist.org/study/scriptures/nt/1-cor/6?lang=eng&id=p19-p20#p19' },
  { reference: 'Genesis 1:27', title: 'Created in God’s image', note: 'Our bodies are part of God’s intentional, divine creation.', url: 'https://www.churchofjesuschrist.org/study/scriptures/ot/gen/1?lang=eng&id=p27#p27' },
  { reference: 'Doctrine and Covenants 88:15–16', title: 'Spirit and element', note: 'The spirit and the body together make the soul of a person.', url: 'https://www.churchofjesuschrist.org/study/scriptures/dc-testament/dc/88?lang=eng&id=p15-p16#p15' },
];

export const additionalSources = [
  { type: 'Conference talk', title: 'The Sanctity of the Body', author: 'Susan W. Tanner', note: 'A companion about treating the body with reverence and gratitude.', url: 'https://www.churchofjesuschrist.org/study/general-conference/2005/10/the-sanctity-of-the-body?lang=eng' },
  { type: 'FSY Sunday lesson', title: 'Your Body Is Sacred', author: 'For the Strength of Youth', note: 'The October 2026 monthly lesson that anchors this module.', url: 'https://www.churchofjesuschrist.org/study/ftsoy/2026/10/fsy-lessons/00-intro?lang=eng' },
  { type: 'FSY magazine issue', title: octoberMagazineIssue.title, author: 'For the Strength of Youth', note: 'The official October 2026 magazine issue, with article sources used throughout the board challenges.', url: octoberMagazineIssue.url },
];
