import { octoberMagazineIssue } from './lessons';

const scriptureUrl = 'https://www.churchofjesuschrist.org/study/scriptures/nt/1-cor/6?lang=eng&id=p19-p20#p19';
const spacesBetweenCircles = 6;
const circleDefinitions = [
  { id: 'start', label: 'Start', type: 'start' },
  { id: 'village', label: 'Village of Identity', type: 'question', prompt: 'Inspired by “God Knows and Loves You”: someone says appearance determines who deserves respect. Which reply best reflects the article’s message about worth?', creativePrompt: 'Name one way a group can show respect before it knows someone’s story.', options: ['Offer a sincere compliment about their appearance to counter the criticism.', 'Point to what they have achieved as proof they deserve respect.', 'Affirm that God knows and loves them regardless of appearance or achievements.'], answerIndex: 2, magazineArticle: octoberMagazineIssue.articles.identity, resource: { label: 'Genesis 1:27', url: 'https://www.churchofjesuschrist.org/study/scriptures/ot/gen/1?lang=eng&id=p27#p27' } },
  { id: 'garden', label: 'Garden of Care', type: 'question', prompt: '“We Can Find Hope” tells of turning to God during a health challenge. A fictional student feels worn out. What is the most helpful first response?', creativePrompt: 'Suggest one way to offer support while letting the person choose what help feels right.', options: ['Share a similar experience so they know they are not alone.', 'Ask what would help, listen first, and support their next step.', 'Offer a practical fix now, then check how they are feeling.'], answerIndex: 1, magazineArticle: octoberMagazineIssue.articles.hope },
  { id: 'bridge', label: 'Use Your Gifts', type: 'question', prompt: 'In “God Can Use Your Gifts,” a young woman uses her talent to help someone. How can a group use different strengths to help a newcomer feel included?', creativePrompt: 'Name one way a group can make room for someone who has not joined in yet.', magazineArticle: octoberMagazineIssue.articles.gifts, resource: { label: 'The Sanctity of the Body', url: 'https://www.churchofjesuschrist.org/study/general-conference/2005/10/the-sanctity-of-the-body?lang=eng' } },
  { id: 'crossroads', label: 'Integrity in Action', type: 'question', prompt: 'A teammate notices a chance to cheat without being caught. Which response best reflects the integrity shown in the October issue?', creativePrompt: 'Discuss what could make it easier to choose honesty before pressure arrives.', options: ['Finish the work honestly, even if the result is less impressive.', 'Ask a friend to check the answer, then decide whether to use it.', 'Use the answer this time and make a plan to prepare better next time.'], answerIndex: 0, magazineArticle: octoberMagazineIssue.articles.integrity },
  { id: 'path', label: 'Path of Choices', type: 'question', prompt: '“Becoming Your Best You” offers counsel about choosing a path in life. A decision feels rushed. Which plan creates the clearest space to choose?', creativePrompt: 'Name one question a person could ask themselves before choosing a direction.', options: ['List the advantages and risks on your own before asking for counsel.', 'Ask friends who made a similar choice, then follow the group’s advice.', 'Pause, notice the pressure, name what matters, and seek trusted counsel.'], answerIndex: 2, magazineArticle: octoberMagazineIssue.articles.direction },
  { id: 'prompting', label: 'Prompting at the Pool', type: 'question', prompt: 'In “Prompting at the Pool,” a young man acts on a prompting to help someone. What helped turn the prompting into a useful response?', creativePrompt: 'Discuss how someone can act on a prompting while still being thoughtful and respectful.', options: ['He noticed a need and chose a specific, considerate way to respond.', 'He waited until he could be certain how the other person would react.', 'He asked others to handle it so he would not misunderstand.'], answerIndex: 0, magazineArticle: octoberMagazineIssue.articles.prompting },
  { id: 'story', label: 'Story in Action', type: 'question', prompt: 'Think about the turning point in “Prompting at the Pool.” What might have happened if the young man had ignored the prompting?', creativePrompt: 'Give two possible outcomes, then identify which details in the story support your thinking.', magazineArticle: octoberMagazineIssue.articles.prompting },
  { id: 'temple', label: 'Guidance', type: 'question', prompt: '“7 Ways to Increase the Flow of Revelation” gives practical ideas for receiving guidance. Which approach best balances seeking, listening, and acting?', options: ['Make room to pray and study, then act on impressions consistent with truth.', 'Treat a strong feeling as enough reason to act immediately.', 'Wait for a clear sign before making even a small decision.'], answerIndex: 0, magazineArticle: octoberMagazineIssue.articles.revelation, resource: { label: '1 Corinthians 6:19–20', url: scriptureUrl } },
  { id: 'hope', label: 'Hope in Hard Moments', type: 'question', prompt: '“We Can Find Hope” describes turning to God during a health challenge. Which kind of support can honor both faith and the person’s real needs?', creativePrompt: 'Discuss how a friend can offer spiritual and practical support without assuming what the person needs.', magazineArticle: octoberMagazineIssue.articles.hope },
  { id: 'respect', label: 'Choose Integrity', type: 'question', prompt: 'In “I Didn’t Steal or Cheat,” a youth faces temptation. What is one helpful way a friend can support an honest choice?', creativePrompt: 'Think of a short response a friend could give that is supportive without shaming.', magazineArticle: octoberMagazineIssue.articles.integrity },
  { id: 'fork', label: 'Choose a Path', type: 'question', prompt: '“Becoming Your Best You” explores deciding what path to take in life. Which plan is most likely to help someone make a thoughtful decision?', creativePrompt: 'Name one source of counsel a person could consider and one thing they should decide for themselves.', options: ['Ask a trusted person to choose, then decide whether their answer feels right.', 'Compare likely outcomes, seek trusted counsel, and make the choice yourself.', 'Choose the path with the least immediate stress, then reassess later.'], answerIndex: 1, magazineArticle: octoberMagazineIssue.articles.direction },
  { id: 'lookout-path', label: 'Gifts in Practice', type: 'question', prompt: '“God Can Use Your Gifts” shows a talent blessing someone else. What makes a small act of service genuinely useful?', creativePrompt: 'Discuss how to offer help in a way that fits the other person, not just the helper.', magazineArticle: octoberMagazineIssue.articles.gifts },
  { id: 'dawn', label: 'Keep Practicing', type: 'question', prompt: '“Earning Belts and Trusting God” follows two friends as they practice martial arts and trust the Lord. What does their progress suggest about patience and faith?', creativePrompt: 'Name a skill or goal where steady effort matters more than quick results.', magazineArticle: octoberMagazineIssue.articles.perseverance },
  { id: 'reflection', label: 'Gratitude', type: 'question', prompt: 'What is one realistic way to show gratitude for your body this week?', creativePrompt: 'Discuss a small, practical act of care that fits a real person’s needs and circumstances.' },
  { id: 'finish', label: 'The Lookout', type: 'finish' },
];

const routeTransitions = [
  { from: 4, to: 53, type: 'bridge', controls: [[185, 475], [135, 390]] },
  { from: 18, to: 32, type: 'bridge', controls: [[690, 475], [790, 455]] },
  { from: 39, to: 60, type: 'bridge', controls: [[525, 350], [245, 310]] },
  { from: 55, to: 67, type: 'bridge', controls: [[165, 305], [315, 270]] },
  { from: 74, to: 87, type: 'bridge', controls: [[680, 190], [790, 170]] },
  { from: 38, to: 11, type: 'slide', controls: [[620, 450], [500, 495]] },
  { from: 25, to: 39, type: 'slide', controls: [[820, 455], [700, 415]] },
  { from: 73, to: 46, type: 'slide', controls: [[600, 300], [445, 350]] },
  { from: 95, to: 66, type: 'slide', controls: [[510, 155], [410, 205]] },
  { from: 102, to: 81, type: 'slide', controls: [[330, 165], [790, 150]] },
];

const pathEventPairs = [
  [{ title: 'Movement Boost', text: 'You went for a run and cared for your body.', points: 10 }, { title: 'Alcohol Choice', text: 'You chose to drink alcohol.', points: -10 }],
  [{ title: 'Rest and Recovery', text: 'You made time for sleep and recovery.', points: 5 }, { title: 'Ignored an Injury', text: 'You ignored an injury instead of getting help.', points: -5 }],
  [{ title: 'Water Break', text: 'You brought water and took a break during activity.', points: 5 }, { title: 'Skipped Rest', text: 'You stayed up late and skipped the rest your body needed.', points: -5 }],
  [{ title: 'Safe Choice', text: 'You paused and chose the safer option with friends.', points: 10 }, { title: 'Unsafe Dare', text: 'You followed a dare that put your body at risk.', points: -10 }],
  [{ title: 'Asked for Help', text: 'You asked a trusted adult for support when you needed it.', points: 5 }, { title: 'Kept It Hidden', text: 'You hid a problem instead of asking someone trustworthy for help.', points: -5 }],
  [{ title: 'Stretch and Reset', text: 'You took a short break and listened to what your body needed.', points: 5 }, { title: 'Pushed Too Hard', text: 'You kept exercising after your body signaled it needed a rest.', points: -10 }],
  [{ title: 'Team Movement', text: 'You invited a friend to join a fun, active game.', points: 10 }, { title: 'Cruel Comparison', text: 'You compared your body harshly with someone else’s.', points: -5 }],
  [{ title: 'Nourishing Meal', text: 'You made time for a meal that helped you feel cared for.', points: 5 }, { title: 'Missed a Meal', text: 'You skipped a meal to meet an unrealistic appearance goal.', points: -10 }],
  [{ title: 'Fresh Air', text: 'You took a walk outside and gave yourself a screen break.', points: 5 }, { title: 'No Break', text: 'You ignored your need for a screen break and sleep.', points: -5 }],
  [{ title: 'Safety First', text: 'You used the right safety gear before an activity.', points: 10 }, { title: 'Skipped Safety', text: 'You skipped safety gear to save time.', points: -10 }],
  [{ title: 'Supportive Friend', text: 'You checked in with a friend and listened without judgment.', points: 10 }, { title: 'Body Joke', text: 'You made a joke about someone’s body that hurt their feelings.', points: -5 }],
  [{ title: 'Good Sleep Plan', text: 'You put your phone away and made time for sleep.', points: 10 }, { title: 'Late Night Scroll', text: 'You stayed up scrolling and felt worn out the next day.', points: -5 }],
  [{ title: 'Gratitude', text: 'You noticed something your body helped you do today.', points: 5 }, { title: 'Self-Criticism', text: 'You spoke harshly to yourself about your appearance.', points: -5 }],
  [{ title: 'Healthy Boundary', text: 'You set a boundary when a situation did not feel safe.', points: 5 }, { title: 'Ignored a Boundary', text: 'You ignored your own discomfort to fit in.', points: -10 }],
  [{ title: 'Steady Practice', text: 'You practiced a skill patiently and celebrated your progress.', points: 10 }, { title: 'Overtraining', text: 'You kept going despite exhaustion and warning signs.', points: -10 }],
];

const pathEvents = new Map();
pathEventPairs.forEach(([positiveEvent, negativeEvent], gapIndex) => {
  const firstPathPosition = gapIndex * (spacesBetweenCircles + 1);
  pathEvents.set(firstPathPosition + 2, positiveEvent);
  pathEvents.set(firstPathPosition + 5, negativeEvent);
});

function createTrackSpaces() {
  const transitionsByStart = new Map(routeTransitions.map((transition) => [transition.from, transition]));
  const lastPosition = (circleDefinitions.length - 1) * (spacesBetweenCircles + 1);
  const circleInterval = spacesBetweenCircles + 1;
  const invalidTransition = routeTransitions.some(
    ({ from, to }) =>
      from < 0 ||
      to < 0 ||
      from > lastPosition ||
      to > lastPosition ||
      from % circleInterval === 0 ||
      to % circleInterval === 0,
  );

  if (invalidTransition) {
    throw new Error('Bridge and slide endpoints must stay on path spaces.');
  }

  return Array.from({ length: lastPosition + 1 }, (_, position) => {
    if (position % circleInterval === 0) {
      const circleIndex = position / circleInterval;
      return { ...circleDefinitions[circleIndex], circleIndex, position };
    }

    const transition = transitionsByStart.get(position);
    const event = pathEvents.get(position);
    return {
      id: `path-${position}`,
      label: `Space ${position}`,
      type: event ? 'event' : 'path',
      position,
      transport: transition ? { type: transition.type, destination: transition.to, controls: transition.controls } : null,
      event,
    };
  });
}

export const octoberBoard = {
  id: 'october-body-sacred-board',
  title: 'Your Body Is Sacred',
  subtitle: 'A shared tabletop adventure through identity, care, respect, and wise choices.',
  finishLabel: 'The Lookout',
  magazineIssue: octoberMagazineIssue,
  spaces: createTrackSpaces(),
};

export const spaceTypeLabels = {
  start: 'Start',
  question: 'Question',
  event: 'Event',
  path: 'Path space',
  finish: 'Finish',
};
