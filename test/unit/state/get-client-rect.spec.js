// @flow
import getClientRect from '../../../src/state/get-client-rect';
import type { ClientRect, Spacing } from '../../../src/types';

describe('get client rect', () => {
  describe('conversion', () => {
    it('should correctly set the width, height and center based on the spacing provided', () => {
      const spacing: Spacing = {
        top: 0,
        right: 100,
        left: 0,
        bottom: 100,
      };

      const rect: ClientRect = getClientRect(spacing);

      expect(rect).toEqual({
        ...spacing,
        width: 100,
        height: 100,
        center: {
          x: 50,
          y: 50,
        },
      });
    });
  });

  // describe('');
});
