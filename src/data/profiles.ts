import { Profile } from '../types';
import { PROFILE_IMAGES, getProfilePhotos } from './profileImages';

const promptBank = [
  { question: 'A life goal of mine', answer: '' },
  { question: 'My simple pleasures', answer: '' },
  { question: 'The way to win me over is', answer: '' },
  { question: 'I go crazy for', answer: '' },
  { question: 'My most irrational fear', answer: '' },
  { question: 'I geek out on', answer: '' },
  { question: 'Together we could', answer: '' },
  { question: "I'm looking for", answer: '' },
  { question: 'A shower thought I had recently', answer: '' },
  { question: 'My love language is', answer: '' },
  { question: 'Two truths and a lie', answer: '' },
  { question: 'Typical Sunday', answer: '' },
];

const promptAnswers = [
  'Running the NYC marathon and not collapsing',
  'Iced matcha on a sunny rooftop',
  'Knowing all the words to 90s R&B',
  'Homemade pasta and a good Barolo',
  'Pigeons. Don\'t ask.',
  'Obscure vinyl records and vintage synths',
  'Start a supper club that actually lasts',
  'Someone who laughs at their own jokes',
  'If elevators had small talk ratings',
  'Quality time — and acts of snacks',
  'I\'ve been skydiving, I cook a mean risotto, I\'m a morning person',
  'Farmers market → brunch → long walk → nap → repeat',
  'Making it to MOMA before the crowds',
  'A spontaneous road trip to the Catskills',
  'Bookstores with good coffee shops attached',
  'Finding the best slice in every neighborhood',
  'Someone who actually wants to go to that concert',
  'Learning to surf in Rockaway this summer',
  'Trying every taco truck in Jackson Heights',
  'Dancing to house music until 4 AM and then hitting a diner',
  'Golden hour walks across the Brooklyn Bridge',
  'Debating the best ramen in the East Village',
  'A partner in crime for museum hopping',
  'Cooking dinner together on a Tuesday night',
];

function getPrompts(seed: number): { question: string; answer: string }[] {
  const result = [];
  for (let i = 0; i < 3; i++) {
    const qIdx = (seed + i * 3) % promptBank.length;
    const aIdx = (seed + i * 4) % promptAnswers.length;
    result.push({
      question: promptBank[qIdx].question,
      answer: promptAnswers[aIdx],
    });
  }
  return result;
}

const neighborhoods = [
  'West Village', 'SoHo', 'Williamsburg', 'Upper East Side', 'Chelsea',
  'East Village', 'Tribeca', 'Lower East Side', 'Greenpoint', 'Murray Hill',
  'Nolita', 'Bushwick', 'Park Slope', 'Gramercy', 'Hell\'s Kitchen',
];

const companies = [
  'Goldman Sachs', 'Google', 'McKinsey', 'Glossier', 'Spotify',
  'JPMorgan', 'Deloitte', 'Meta', 'Warby Parker', 'Stripe',
  'Bloomberg', 'Peloton', 'Squarespace', 'Two Sigma', 'Compass',
];

const schools = [
  'NYU', 'Columbia', 'Penn', 'Cornell', 'Yale',
  'Georgetown', 'Michigan', 'USC', 'Duke', 'Vanderbilt',
  'Brown', 'Northwestern', 'Stanford', 'Emory', 'UVA',
];

const jobs = [
  'Product Manager', 'Software Engineer', 'Investment Analyst',
  'Creative Director', 'Marketing Manager', 'Consultant',
  'Brand Strategist', 'UX Designer', 'Photographer',
  'Founder', 'Account Executive', 'Architect',
  'Physician', 'Attorney', 'Data Scientist',
];

const heights = [
  "5'2\"", "5'4\"", "5'5\"", "5'6\"", "5'7\"",
  "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"",
  "6'1\"", "6'2\"", "6'3\"",
];

const religions = ['Christian', 'Jewish', 'Muslim', 'Hindu', 'Buddhist', 'Agnostic', 'Spiritual', 'Atheist'];
const ethnicities = ['White', 'Black', 'Hispanic/Latino', 'Asian', 'South Asian', 'Middle Eastern', 'Mixed', 'Other'];

export const mockProfiles: Profile[] = [
  { id: 'skyler', name: 'Skyler', age: 23, gender: 'female', photos: getProfilePhotos('skyler'), prompts: getPrompts(0), hometown: 'Boston, MA', job: jobs[0], company: companies[0], school: schools[0], neighborhood: neighborhoods[0], height: heights[5], religion: religions[0], ethnicity: ethnicities[0], verified: true },
  { id: 'corrado', name: 'Corrado', age: 26, gender: 'male', photos: getProfilePhotos('corrado'), prompts: getPrompts(1), hometown: 'Chicago, IL', job: jobs[1], company: companies[1], school: schools[1], neighborhood: neighborhoods[1], height: heights[9], religion: religions[5], ethnicity: ethnicities[1] },
  { id: 'lily', name: 'Lily', age: 22, gender: 'female', photos: getProfilePhotos('lily'), prompts: getPrompts(2), hometown: 'New York, NY', job: jobs[2], company: companies[2], school: schools[2], neighborhood: neighborhoods[2], height: heights[3], religion: religions[3], ethnicity: ethnicities[4], verified: true },
  { id: 'jack', name: 'Jack', age: 26, gender: 'male', photos: getProfilePhotos('jack'), prompts: getPrompts(3), hometown: 'San Francisco, CA', job: jobs[3], company: companies[3], school: schools[3], neighborhood: neighborhoods[3], height: heights[10], religion: religions[6], ethnicity: ethnicities[0] },
  { id: 'shannon', name: 'Shannon', age: 23, gender: 'female', photos: getProfilePhotos('shannon'), prompts: getPrompts(4), hometown: 'Atlanta, GA', job: jobs[4], company: companies[4], school: schools[4], neighborhood: neighborhoods[4], height: heights[4], religion: religions[0], ethnicity: ethnicities[1] },
  { id: 'gabriel', name: 'Gabriel', age: 24, gender: 'male', photos: getProfilePhotos('gabriel'), prompts: getPrompts(5), hometown: 'Miami, FL', job: jobs[5], company: companies[5], school: schools[5], neighborhood: neighborhoods[5], height: heights[8], religion: religions[1], ethnicity: ethnicities[2] },
  { id: 'kaitlyn', name: 'Kaitlyn', age: 24, gender: 'female', photos: getProfilePhotos('kaitlyn'), prompts: getPrompts(6), hometown: 'New York, NY', job: jobs[6], company: companies[6], school: schools[6], neighborhood: neighborhoods[6], height: heights[2], religion: religions[5], ethnicity: ethnicities[0], verified: true },
  { id: 'noah', name: 'Noah', age: 28, gender: 'male', photos: getProfilePhotos('noah'), prompts: getPrompts(7), hometown: 'Los Angeles, CA', job: jobs[7], company: companies[7], school: schools[7], neighborhood: neighborhoods[7], height: heights[11], religion: religions[7], ethnicity: ethnicities[3], verified: true },
  { id: 'zoey', name: 'Zoey', age: 23, gender: 'female', photos: getProfilePhotos('zoey'), prompts: getPrompts(8), hometown: 'Houston, TX', job: jobs[8], company: companies[8], school: schools[8], neighborhood: neighborhoods[8], height: heights[1], religion: religions[0], ethnicity: ethnicities[2] },
  { id: 'cedric', name: 'Cedric', age: 22, gender: 'male', photos: getProfilePhotos('cedric'), prompts: getPrompts(9), hometown: 'Boston, MA', job: jobs[9], company: companies[9], school: schools[9], neighborhood: neighborhoods[9], height: heights[9], religion: religions[1], ethnicity: ethnicities[0] },
  { id: 'ari', name: 'Ari', age: 23, gender: 'female', photos: getProfilePhotos('ari'), prompts: getPrompts(10), hometown: 'DC', job: jobs[10], company: companies[10], school: schools[10], neighborhood: neighborhoods[10], height: heights[3], religion: religions[4], ethnicity: ethnicities[3], verified: true },
  { id: 'tin', name: 'Tin', age: 24, gender: 'male', photos: getProfilePhotos('tin'), prompts: getPrompts(11), hometown: 'Seattle, WA', job: jobs[11], company: companies[11], school: schools[11], neighborhood: neighborhoods[11], height: heights[10], religion: religions[5], ethnicity: ethnicities[0] },
  { id: 'stella', name: 'Stella', age: 25, gender: 'female', photos: getProfilePhotos('stella'), prompts: getPrompts(0), hometown: 'New York, NY', job: jobs[12], company: companies[12], school: schools[12], neighborhood: neighborhoods[12], height: heights[4], religion: religions[2], ethnicity: ethnicities[5], verified: true },
  { id: 'barney', name: 'Barney', age: 22, gender: 'male', photos: getProfilePhotos('barney'), prompts: getPrompts(1), hometown: 'Philadelphia, PA', job: jobs[13], company: companies[13], school: schools[13], neighborhood: neighborhoods[13], height: heights[8], religion: religions[6], ethnicity: ethnicities[6] },
  { id: 'jasmine', name: 'Jasmine', age: 24, gender: 'female', photos: getProfilePhotos('jasmine'), prompts: getPrompts(2), hometown: 'Dallas, TX', job: jobs[14], company: companies[14], school: schools[14], neighborhood: neighborhoods[14], height: heights[2], religion: religions[0], ethnicity: ethnicities[1] },
  { id: 'oskar', name: 'Oskar', age: 27, gender: 'male', photos: getProfilePhotos('oskar'), prompts: getPrompts(3), hometown: 'Denver, CO', job: jobs[0], company: companies[0], school: schools[0], neighborhood: neighborhoods[0], height: heights[11], religion: religions[7], ethnicity: ethnicities[0] },
  { id: 'olivia', name: 'Olivia', age: 26, gender: 'female', photos: getProfilePhotos('olivia'), prompts: getPrompts(4), hometown: 'Nashville, TN', job: jobs[1], company: companies[1], school: schools[1], neighborhood: neighborhoods[1], height: heights[5], religion: religions[0], ethnicity: ethnicities[0], verified: true },
  { id: 'tyler', name: 'Tyler', age: 23, gender: 'male', photos: getProfilePhotos('tyler'), prompts: getPrompts(5), hometown: 'Portland, OR', job: jobs[2], company: companies[2], school: schools[2], neighborhood: neighborhoods[2], height: heights[9], religion: religions[5], ethnicity: ethnicities[3] },
  { id: 'ava', name: 'Ava', age: 25, gender: 'female', photos: getProfilePhotos('ava'), prompts: getPrompts(6), hometown: 'San Diego, CA', job: jobs[3], company: companies[3], school: schools[3], neighborhood: neighborhoods[3], height: heights[1], religion: religions[6], ethnicity: ethnicities[2] },
  { id: 'jordan', name: 'Jordan', age: 27, gender: 'male', photos: getProfilePhotos('jordan'), prompts: getPrompts(7), hometown: 'Austin, TX', job: jobs[4], company: companies[4], school: schools[4], neighborhood: neighborhoods[4], height: heights[10], religion: religions[1], ethnicity: ethnicities[6], verified: true },
  { id: 'monako', name: 'Monako', age: 23, gender: 'female', photos: getProfilePhotos('monako'), prompts: getPrompts(8), hometown: 'New York, NY', job: jobs[5], company: companies[5], school: schools[5], neighborhood: neighborhoods[5], height: heights[3], religion: religions[4], ethnicity: ethnicities[3] },
  { id: 'chris', name: 'Chris', age: 27, gender: 'male', photos: getProfilePhotos('chris'), prompts: getPrompts(9), hometown: 'Charlotte, NC', job: jobs[6], company: companies[6], school: schools[6], neighborhood: neighborhoods[6], height: heights[7], religion: religions[0], ethnicity: ethnicities[1] },
  { id: 'andrew', name: 'Andrew', age: 27, gender: 'male', photos: getProfilePhotos('andrew'), prompts: [
    { question: 'A life goal of mine', answer: 'Building something that helps people find real connection — not just another app, but a reason to put the phone down and meet up' },
    { question: 'I geek out on', answer: 'Early-stage startups, the perfect espresso-to-milk ratio, and trying to convince friends that hiking is a personality' },
    { question: 'Together we could', answer: 'Grab the last two seats at a West Village wine bar, argue about the best dumpling spot in Chinatown, and never run out of things to talk about' },
  ], hometown: 'Los Angeles, CA', job: 'Founder', company: 'IRL', school: 'Brandeis', neighborhood: 'West Village', height: "6'1\"", religion: 'Catholic', ethnicity: 'Asian', verified: true },
];
