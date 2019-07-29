// @flow
import type { Announce } from '../../../types';
import { warning } from '../../../dev-warning';

export type ExpiringAnnounce = Announce & {
  wasCalled: () => boolean,
};

export default (announce: Announce): ExpiringAnnounce => {
  let wasCalled: boolean = false;
  let isExpired: boolean = false;

  // not allowing async announcements
  const timeoutId: TimeoutID = setTimeout(() => {
    isExpired = true;
  });

  const result = (message: string): void => {
    if (wasCalled) {
      warning('Announcement already made. Not making a second announcement');

      return;
    }

    if (isExpired) {
      warning(`
        Announcements cannot be made asynchronously.
        Default message has already been announced.
      `);
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
