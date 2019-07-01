// @flow
import { getRect, type Position, type Rect, type Spacing } from 'css-box-model';
import type {
  Axis,
  DraggableDimension,
  DroppableDimension,
  Viewport,
} from '../../../../../../src/types';
import { horizontal, vertical } from '../../../../../../src/state/axis';
import { toDraggableMap } from '../../../../../../src/state/dimension-structures';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import getClosestDraggable from '../../../../../../src/state/move-in-direction/move-cross-axis/get-closest-draggable';
import { negate, patch } from '../../../../../../src/state/position';
import scrollViewport from '../../../../../../src/state/scroll-viewport';
import { offsetByPosition } from '../../../../../../src/state/spacing';
import { isTotallyVisible } from '../../../../../../src/state/visibility/is-visible';
import getViewport from '../../../../../../src/view/window/get-viewport';
import {
  getDraggableDimension,
  getDroppableDimension,
} from '../../../../../utils/dimension';
import noOnLift from '../../../../../utils/no-on-lift';

const viewport: Viewport = getViewport();

// Not covering all cases. Full coverage in without-starting-displacement.spec
[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on the ${axis.direction} axis`, () => {
    const start: number = 0;
    const end: number = 100;
    const crossAxisStart: number = 0;
    const crossAxisEnd: number = 20;

    const borderBox: Rect = getRect({
      [axis.start]: start,
      [axis.end]: end,
      [axis.crossAxisStart]: crossAxisStart,
      [axis.crossAxisEnd]: crossAxisEnd,
    });

    const home: DroppableDimension = getDroppableDimension({
      descriptor: {
        id: 'home',
        type: 'TYPE',
      },
      direction: axis.direction,
      borderBox,
    });

    // dragging item
    const inHome1: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'visible1',
        droppableId: home.descriptor.id,
        type: home.descriptor.type,
        index: 2,
      },
      borderBox: {
        [axis.crossAxisStart]: crossAxisStart,
        [axis.crossAxisEnd]: crossAxisEnd,
        [axis.start]: 20,
        [axis.end]: 40,
      },
    });

    const inHome2: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'visible1',
        droppableId: home.descriptor.id,
        type: home.descriptor.type,
        index: 2,
      },
      borderBox: {
        [axis.crossAxisStart]: crossAxisStart,
        [axis.crossAxisEnd]: crossAxisEnd,
        [axis.start]: 20,
        [axis.end]: 40,
      },
    });

    const inHome3: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'visible1',
        droppableId: home.descriptor.id,
        type: home.descriptor.type,
        index: 2,
      },
      borderBox: {
        [axis.crossAxisStart]: crossAxisStart,
        [axis.crossAxisEnd]: crossAxisEnd,
        [axis.start]: 20,
        [axis.end]: 40,
      },
    });

    const insideDestination: DraggableDimension[] = [inHome1, inHome2, inHome3];
    const { onLift } = getHomeOnLift({
      draggable: inHome1,
      home,
      viewport,
      draggables: toDraggableMap(insideDestination),
    });

    it('should find the closest draggable based on the items visible position (without initial displacement)', () => {
      const center: Position = patch(
        axis.line,
        inHome2.page.borderBox.center[axis.line],
        100,
      );

      {
        const result: ?DraggableDimension = getClosestDraggable({
          pageBorderBoxCenter: center,
          destination: home,
          insideDestination,
          viewport,
          onLift,
        });
        expect(result).toEqual(inHome3);
      }
      // validation: without initial displacement it would have been inHome2
      {
        const result: ?DraggableDimension = getClosestDraggable({
          pageBorderBoxCenter: center,
          destination: home,
          insideDestination,
          viewport,
          onLift: noOnLift,
        });
        expect(result).toEqual(inHome2);
      }
    });

    it('should ignore draggables backward that have no total visibility', () => {
      const center: Position = patch(
        axis.line,
        inHome1.page.borderBox.center[axis.line],
        100,
      );
      const scrolled: Viewport = scrollViewport(viewport, patch(axis.line, 1));

      const result: ?DraggableDimension = getClosestDraggable({
        pageBorderBoxCenter: center,
        destination: home,
        insideDestination,
        viewport: scrolled,
        onLift: noOnLift,
      });
      expect(result).toEqual(inHome3);

      // validate visibility
      {
        // visible when not displaced
        expect(
          isTotallyVisible({
            target: inHome2.page.borderBox,
            destination: home,
            viewport: scrolled.frame,
            withDroppableDisplacement: true,
          }),
        ).toBe(true);

        const inVisibleLocation: Spacing = offsetByPosition(
          inHome2.page.borderBox,
          negate(onLift.displacedBy.point),
        );
        // visible when not scrolled
        expect(
          isTotallyVisible({
            target: inVisibleLocation,
            destination: home,
            viewport: viewport.frame,
            withDroppableDisplacement: true,
          }),
        ).toBe(true);
        // not visible when scrolled
        expect(
          isTotallyVisible({
            target: inVisibleLocation,
            destination: home,
            viewport: scrolled.frame,
            withDroppableDisplacement: true,
          }),
        ).toBe(false);
      }

      // validate inHome2 would have been the target expect for displacement
      {
        const validate: ?DraggableDimension = getClosestDraggable({
          pageBorderBoxCenter: center,
          destination: home,
          insideDestination,
          viewport: scrolled,
          onLift: noOnLift,
        });
        expect(validate).toEqual(inHome2);
      }
    });
  });
});
