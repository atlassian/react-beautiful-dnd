// @flow
import warning from 'tiny-warning';
import type { Announce } from '../../../types';
import getWarningMessage from '../../../debug/get-warning-message';

export default (announce: Announce) => {
  let wasCalled: boolean = false;
  let isExpired: boolean = false;

  // not allowing async announcements
  const timeoutId: TimeoutID = setTimeout(() => {
    isExpired = true;
  });

  const result = (message: string): void => {
    if (wasCalled) {
      warning(
        false,
        getWarningMessage(
          'Announcement already made. Not making a second announcement',
        ),
      );

      return;
    }

    if (isExpired) {
      warning(
        false,
        getWarningMessage(`
          Announcements cannot be made asynchronously.
          Default message has already been announced.
        `),
      );
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
