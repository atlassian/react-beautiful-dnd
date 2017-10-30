// @flow
import type { Author, Quote, QuoteMap } from './types';

const jake: Author = {
  id: '1',
  name: 'Jake',
  url: 'http://adventuretime.wikia.com/wiki/Jake',
  avatarUrl: 'https://68.media.tumblr.com/avatar_1f7bdbbeb59c_128.png',
};

const BMO: Author = {
  id: '2',
  name: 'BMO',
  url: 'http://adventuretime.wikia.com/wiki/BMO',
  avatarUrl: 'https://68.media.tumblr.com/avatar_1a34fe6de498_128.png',
};

const finn: Author = {
  id: '3',
  name: 'Finn',
  url: 'http://adventuretime.wikia.com/wiki/Finn',
  avatarUrl: 'https://68.media.tumblr.com/avatar_09404f3287c6_128.png',
};

const princess: Author = {
  id: '4',
  name: 'Princess bubblegum',
  url: 'http://adventuretime.wikia.com/wiki/Princess_Bubblegum',
  avatarUrl: 'https://68.media.tumblr.com/avatar_ec98529441c4_128.png',
};

export const authors: Author[] = [
  jake, BMO, finn, princess,
];

export const quotes: Quote[] = [
  {
    id: '1',
    content: 'Sometimes life is scary and dark',
    author: BMO,
  },
  {
    id: '2',
    content: 'Sucking at something is the first step towards being sorta good at something.',
    author: jake,
  },
  {
    id: '3',
    content: 'You got to focus on what\'s real, man',
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
    content: 'That\'s it! The answer was so simple, I was too smart to see it!',
    author: princess,
  },
  {
    id: '8',
    content: 'People make mistakes. It’s a part of growing up',
    author: finn,
  },
  {
    id: '9',
    content: 'Don\'t you always call sweatpants \'give up on life pants,\' Jake?',
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
    content: 'Haven\'t slept for a solid 83 hours, but, yeah, I\'m good.',
    author: princess,
  },
];

let idCount: number = 0;

export const getQuotes = (count: number): Quote[] =>
  Array.from({ length: count }, (v, k) => k).map(() => {
    const random: Quote = quotes[Math.floor(Math.random() * quotes.length)];

    const custom: Quote = {
      id: `quote-${idCount++}`,
      content: random.content,
      author: random.author,
    };

    return custom;
  });

export const getAuthors = (count: number): Author[] =>
  Array.from({ length: count }, (v, k) => k).map(() => {
    const random: Author = authors[Math.floor(Math.random() * authors.length)];

    const custom: Author = {
      id: `author-${idCount++}`,
      name: random.name,
      avatarUrl: random.avatarUrl,
      url: random.url,
    };

    return custom;
  });

const getByAuthor = (author: Author, items: Quote[]): Quote[] =>
  items.filter((quote: Quote) => quote.author === author);

export const authorQuoteMap: QuoteMap =
  authors.reduce((previous: QuoteMap, author: Author) => ({
    ...previous,
    [author.name]: getByAuthor(author, quotes),
  }), {});

export const randomAuthorQuotes: QuoteMap = authors.reduce(
  (previous: QuoteMap, author: Author) => ({
    ...previous,
    [author.name]: getQuotes(6),
  }),
  {}
);
