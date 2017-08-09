// @flow
import type { Author, Quote } from './types';

const jake: Author = {
  name: 'Jake',
  url: 'http://adventuretime.wikia.com/wiki/Jake',
  avatarUrl: 'https://68.media.tumblr.com/avatar_1f7bdbbeb59c_128.png',
};

const BMO: Author = {
  name: 'BMO',
  url: 'http://adventuretime.wikia.com/wiki/BMO',
  avatarUrl: 'https://68.media.tumblr.com/avatar_1a34fe6de498_128.png',
};

const finn: Author = {
  name: 'Finn',
  url: 'http://adventuretime.wikia.com/wiki/Finn',
  avatarUrl: 'https://68.media.tumblr.com/avatar_09404f3287c6_128.png',
};

const princess: Author = {
  name: 'Princess bubblegum',
  url: 'http://adventuretime.wikia.com/wiki/Princess_Bubblegum',
  avatarUrl: 'https://68.media.tumblr.com/avatar_ec98529441c4_128.png',
};

const quotes: Quote[] = [
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
    content: 'People make mistakes. It’s a part of growing up',
    author: finn,
  },
  {
    id: '8',
    content: 'Don\'t you always call sweatpants \'give up on life pants,\' Jake?',
    author: finn,
  },
];

export const getQuotes = (count: number): Quote[] =>
  Array.from({ length: count }, (v, k) => k).map((val: number) => {
    const random: Quote = quotes[Math.floor(Math.random() * quotes.length)];

    const custom: Quote = {
      id: `${val}`,
      content: random.content,
      author: random.author,
    };

    return custom;
  });

export default quotes;
