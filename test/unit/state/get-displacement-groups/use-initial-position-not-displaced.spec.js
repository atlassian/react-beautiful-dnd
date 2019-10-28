// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DisplacementGroups,
  DisplacedBy,
  Viewport,
} from '../../../../src/types';
import { horizontal, vertical } from '../../../../src/state/axis';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import { add, negate, patch, subtract } from '../../../../src/state/position';
import scrollViewport from '../../../../src/state/scroll-viewport';
import { isPartiallyVisible } from '../../../../src/state/visibility/is-visible';
import { getPreset } from '../../../util/dimension';
import { offsetByPosition } from '../../../../src/state/spacing';
import { getForcedDisplacement } from '../../../util/impact';
import getDisplacementGroups from '../../../../src/state/get-displacement-groups';
import { emptyGroups } from '../../../../src/state/no-impact';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome1.displaceBy,
    );

    it('should calculate visibility as if in original location', () => {
      const onEndOfInHome2: Position = patch(
        axis.line,
        preset.inHome2.page.marginBox[axis.end],
        preset.inHome2.page.marginBox.center[axis.crossAxisLine],
      );
      const endOfInHome2MovedBackwards: Position = subtract(
        onEndOfInHome2,
        displacedBy.point,
      );

      const newScroll: Position = add(
        endOfInHome2MovedBackwards,
        patch(axis.line, 1),
      );

      const scrolled: Viewport = scrollViewport(viewport, newScroll);

      // Displaced location is currently not visible
      expect(
        isPartiallyVisible({
          target: offsetByPosition(
            preset.inHome2.page.marginBox,
            negate(displacedBy.point),
          ),
          destination: preset.home,
          viewport: scrolled.frame,
          withDroppableDisplacement: true,
        }),
      ).toBe(false);

      // Displacement states that inHome2 is visible despite currently being invisible due to displacement
      const result: DisplacementGroups = getForcedDisplacement({
        visible: [
          { dimension: preset.inHome2 },
          { dimension: preset.inHome3 },
          { dimension: preset.inHome4 },
        ],
      });

      const expected: DisplacementGroups = getDisplacementGroups({
        afterDragging: [preset.inHome2, preset.inHome3, preset.inHome4],
        destination: preset.home,
        displacedBy: getDisplacedBy(axis, preset.inHome1.displaceBy),
        last: emptyGroups,
        viewport: scrolled.frame,
      });
      expect(result).toEqual(expected);
    });
  });
});
