// @flow
import { colors } from '@atlaskit/theme';
import type { Quote, QuoteMap, Author, AuthorMap } from './types';

const jake: Author = {
  id: '1',
  name: 'Jake',
  avatarUrl: 'https://68.media.tumblr.com/avatar_1f7bdbbeb59c_128.png',
  colors: {
    medium: colors.Y100,
    soft: colors.Y50,
  },
};

const BMO: Author = {
  id: '2',
  name: 'BMO',
  avatarUrl: 'https://68.media.tumblr.com/avatar_1a34fe6de498_128.png',
  colors: {
    medium: colors.G100,
    soft: colors.G50,
  },
};

const finn: Author = {
  id: '3',
  name: 'Finn',
  avatarUrl: 'https://68.media.tumblr.com/avatar_09404f3287c6_128.png',
  colors: {
    medium: colors.B100,
    soft: colors.B50,
  },
};

const princess: Author = {
  id: '4',
  name: 'Princess bubblegum',
  avatarUrl: 'https://68.media.tumblr.com/avatar_ec98529441c4_128.png',
  colors: {
    medium: colors.P100,
    soft: colors.P50,
  },
};

export const authors: Author[] = [jake, BMO, finn, princess];

export const authorMap: AuthorMap = authors.reduce(
  (previous: AuthorMap, current: Author): AuthorMap => {
    previous[current.id] = current;
    return previous;
  },
  {},
);

export const quotes: Quote[] = [
  {
    id: '1',
    content: 'Sometimes life is scary and dark',
    author: BMO,
  },
  {
    id: '2',
    content:
      'Sucking at something is the first step towards being sorta good at something.',
    author: jake,
  },
  {
    id: '3',
    content: "You got to focus on what's real, man",
    author: jake,
  },
  {
    id: '4',
    content: 'Is that where creativity comes from? From sad biz?',
    author: finn,
  },
  {
    id: '5',
    content: 'Homies help homies. Always',
    author: finn,
  },
  {
    id: '6',
    content: 'Responsibility demands sacrifice',
    author: princess,
  },
  {
    id: '7',
    content: "That's it! The answer was so simple, I was too smart to see it!",
    author: princess,
  },
  {
    id: '8',
    content: 'People make mistakes. It’s a part of growing up',
    author: finn,
  },
  {
    id: '9',
    content: "Don't you always call sweatpants 'give up on life pants,' Jake?",
    author: finn,
  },
  {
    id: '10',
    content: 'I should not have drunk that much tea!',
    author: princess,
  },
  {
    id: '11',
    content: 'Please! I need the real you!',
    author: princess,
  },
  {
    id: '12',
    content: "Haven't slept for a solid 83 hours, but, yeah, I'm good.",
    author: princess,
  },
];

export const quoteMap: QuoteMap = quotes.reduce(
  (previous: QuoteMap, current: Quote): QuoteMap => {
    previous[current.id] = current;
    return previous;
  },
  {},
);

export const getByAuthor = (author: Author, items: Quote[]): Quote[] =>
  items.filter((quote: Quote) => quote.author === author);
