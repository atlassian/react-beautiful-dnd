// @flow

// not replacing newlines
const spaceAndTab: RegExp = /[ \t]{2,}/gm;

// using .trim() to clear the any newlines before the first text
const clean = (value: string) => value.replace(spaceAndTab, ' ').trim();

export const getDevMessage = (message: string) =>
  clean(`
  %creact-beautiful-dnd

  %c${message}


  %c👷‍ This is a development only message. It will be removed in production builds.
`);

export const warning = (message: string) => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  // eslint-disable-next-line no-console
  console.warn(
    getDevMessage(message),
    // title (green400)
    'color: #00C584; font-size: 1.2em; font-weight: bold;',
    // message
    'line-height: 1.5',
    // footer (purple300)
    'color: #723874;',
  );
};
