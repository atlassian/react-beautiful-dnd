// @flow
import getArea from '../../../src/state/get-area';
import type { Area, Spacing } from '../../../src/types';

describe('get client rect', () => {
  it('should correctly set the width, height and center based on the spacing provided', () => {
    const spacing: Spacing = {
      top: 0,
      right: 80,
      left: 0,
      bottom: 100,
    };

    const area: Area = getArea(spacing);

    expect(area).toEqual({
      ...spacing,
      width: 80,
      height: 100,
      center: {
        x: 40,
        y: 50,
      },
    });
  });
});
