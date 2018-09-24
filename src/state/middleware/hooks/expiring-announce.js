// @flow
import type { Announce } from '../../../types';

export default (announce: Announce) => {
  let wasCalled: boolean = false;
  let isExpired: boolean = false;

  // not allowing async announcements
  const timeoutId: TimeoutID = setTimeout(() => {
    isExpired = true;
  });

  const result = (message: string): void => {
    if (wasCalled) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Announcement already made. Not making a second announcement',
        );
      }

      return;
    }

    if (isExpired) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`
          Announcements cannot be made asynchronously.
          Default message has already been announced.
        `);
      }
      return;
    }

    wasCalled = true;
    announce(message);
    clearTimeout(timeoutId);
  };

  // getter for isExpired
  // using this technique so that a consumer cannot
  // set the isExpired or wasCalled flags
  result.wasCalled = (): boolean => wasCalled;

  return result;
};
