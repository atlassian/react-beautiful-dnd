// @flow
import { getRect, type Rect, type Spacing } from 'css-box-model';
import type { DroppableDimension, Axis } from '../../../../src/types';
import { isTotallyVisibleOnAxis } from '../../../../src/state/visibility/is-visible';
import { getDroppableDimension } from '../../../utils/dimension';
import { vertical, horizontal } from '../../../../src/state/axis';
import { offsetByPosition } from '../../../../src/state/spacing';
import { patch } from '../../../../src/state/position';

// These tests are an extension of the standard

const viewport: Rect = getRect({
  right: 1000,
  top: 0,
  left: 0,
  bottom: 1000,
});

const inViewport: Spacing = {
  top: 10,
  left: 10,
  right: 100,
  bottom: 100,
};

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on the ${axis.direction} axis`, () => {
    const destination: DroppableDimension = getDroppableDimension({
      descriptor: {
        id: 'subset',
        type: 'TYPE',
        mode: 'STANDARD',
      },
      borderBox: inViewport,
      direction: axis.direction,
    });

    it('should return true when visible on the main axis, even if not on the cross axis', () => {
      const targets: Spacing[] = [
        // not totally visible on the crossAxisStart
        offsetByPosition(inViewport, patch(axis.crossAxisLine, -1)),
        // not totally visible on the crossAxisEnd
        offsetByPosition(inViewport, patch(axis.crossAxisLine, 1)),
      ];

      targets.forEach((target: Spacing) => {
        const isVisible: boolean = isTotallyVisibleOnAxis({
          withDroppableDisplacement: true,
          target,
          destination,
          viewport,
        });
        expect(isVisible).toBe(true);
      });
    });

    it('should return false when visible on the main axis, even if visible on the main axis', () => {
      const targets: Spacing[] = [
        // not totally visible on the mainAxisStart
        offsetByPosition(inViewport, patch(axis.line, -1)),
        // not totally visible on the mainAxisEnd
        offsetByPosition(inViewport, patch(axis.line, 1)),
      ];

      targets.forEach((target: Spacing) => {
        const isVisible: boolean = isTotallyVisibleOnAxis({
          withDroppableDisplacement: true,
          target,
          destination,
          viewport,
        });
        expect(isVisible).toBe(false);
      });
    });
  });
});
