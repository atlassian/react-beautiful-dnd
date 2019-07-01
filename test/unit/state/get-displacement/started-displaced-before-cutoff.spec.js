// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  Displacement,
  DisplacedBy,
  Viewport,
} from '../../../../src/types';
import { horizontal, vertical } from '../../../../src/state/axis';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import getLiftEffect from '../../../../src/state/get-lift-effect';
import { add, negate, patch, subtract } from '../../../../src/state/position';
import scrollViewport from '../../../../src/state/scroll-viewport';
import { isPartiallyVisible } from '../../../../src/state/visibility/is-visible';
import { getPreset } from '../../../utils/dimension';
import getNotAnimatedDisplacement from '../../../utils/get-displacement/get-not-animated-displacement';
import { offsetByPosition } from '../../../../src/state/spacing';
import getDisplacement from '../../../../src/state/get-displacement';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome1.displaceBy,
    );

    const { onLift, impact: homeImpact } = getHomeOnLift({
      draggable: preset.inHome1,
      home: preset.home,
      draggables: preset.draggables,
      viewport,
    });

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

      // should currently be invisible in its displaced location
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

      // displacement states that it is visible despite currently being invisible
      // (it is using the original location for visibility)
      const result: Displacement = getDisplacement({
        draggable: preset.inHome2,
        destination: preset.home,
        // now readding initial displacement to inHome2
        previousImpact: homeImpact,
        viewport: scrolled.frame,
        onLift,
      });

      expect(result).toEqual(getNotAnimatedDisplacement(preset.inHome2));
    });
  });
});
