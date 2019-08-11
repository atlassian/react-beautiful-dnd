// @flow
import { getRect } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  Viewport,
  DroppableId,
  TypeId,
  DraggableDimension,
  DroppableDimension,
  DisplacedBy,
  DraggableDimensionMap,
} from '../../../../src/types';
import {
  getPreset,
  getDraggableDimension,
  getDroppableDimension,
} from '../../../util/dimension';
import speculativelyIncrease from '../../../../src/state/update-displacement-visibility/speculatively-increase';
import noImpact from '../../../../src/state/no-impact';
import { createViewport } from '../../../util/viewport';
import { origin, patch } from '../../../../src/state/position';
import { vertical, horizontal } from '../../../../src/state/axis';
import { toDraggableMap } from '../../../../src/state/dimension-structures';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import { isPartiallyVisible } from '../../../../src/state/visibility/is-visible';
import getLiftEffect from '../../../../src/state/get-lift-effect';
import { getForcedDisplacement } from '../../../util/impact';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    it('should do nothing when there is no displacement', () => {
      const preset = getPreset(axis);
      const { impact: homeImpact } = getLiftEffect({
        draggable: preset.inHome1,
        draggables: preset.draggables,
        home: preset.home,
        viewport: preset.viewport,
      });

      const impact1: DragImpact = speculativelyIncrease({
        impact: homeImpact,
        viewport: preset.viewport,
        destination: preset.home,
        draggables: preset.draggables,
        maxScrollChange: { x: 1000, y: 1000 },
      });
      expect(impact1).toEqual(homeImpact);

      const impact2: DragImpact = speculativelyIncrease({
        impact: noImpact,
        viewport: preset.viewport,
        destination: preset.home,
        draggables: preset.draggables,
        maxScrollChange: { x: 1000, y: 1000 },
      });
      expect(impact2).toEqual(noImpact);
    });

    const foreignId: DroppableId = 'foreign';
    const typeId: TypeId = 'our-type';
    const homeCrossAxisStart: number = 0;
    const homeCrossAxisEnd: number = 100;
    const foreignCrossAxisStart: number = 100;
    const foreignCrossAxisEnd: number = 200;
    const itemSize: number = 50;

    const home: DroppableDimension = getDroppableDimension({
      descriptor: {
        id: 'home',
        type: typeId,
        mode: 'STANDARD',
      },
      direction: axis.direction,
      borderBox: {
        [axis.crossAxisStart]: homeCrossAxisStart,
        [axis.crossAxisEnd]: homeCrossAxisEnd,
        [axis.start]: 0,
        [axis.end]: 10000,
      },
    });
    const inHome1: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'inhome1',
        type: home.descriptor.type,
        droppableId: home.descriptor.id,
        index: 0,
      },
      borderBox: {
        [axis.crossAxisStart]: homeCrossAxisStart,
        [axis.crossAxisEnd]: homeCrossAxisEnd,
        [axis.start]: 0,
        [axis.end]: itemSize,
      },
    });
    const inForeign1: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'inForeign1',
        type: typeId,
        droppableId: foreignId,
        index: 0,
      },
      borderBox: {
        [axis.crossAxisStart]: foreignCrossAxisStart,
        [axis.crossAxisEnd]: foreignCrossAxisEnd,
        [axis.start]: 0,
        [axis.end]: itemSize,
      },
    });
    const inForeign2: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'inForeign2',
        type: typeId,
        droppableId: foreignId,
        index: 1,
      },
      borderBox: {
        [axis.crossAxisStart]: foreignCrossAxisStart,
        [axis.crossAxisEnd]: foreignCrossAxisEnd,
        [axis.start]: inForeign1.page.borderBox[axis.end],
        [axis.end]: inForeign1.page.borderBox[axis.end] + itemSize,
      },
    });
    const inForeign3: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'inForeign3',
        type: typeId,
        droppableId: foreignId,
        index: 2,
      },
      borderBox: {
        [axis.crossAxisStart]: foreignCrossAxisStart,
        [axis.crossAxisEnd]: foreignCrossAxisEnd,
        [axis.start]: inForeign2.page.borderBox[axis.end],
        [axis.end]: inForeign2.page.borderBox[axis.end] + itemSize,
      },
    });
    const inForeign4: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'inForeign4',
        type: typeId,
        droppableId: foreignId,
        index: 3,
      },
      borderBox: {
        [axis.crossAxisStart]: foreignCrossAxisStart,
        [axis.crossAxisEnd]: foreignCrossAxisEnd,
        [axis.start]: inForeign3.page.borderBox[axis.end],
        [axis.end]: inForeign3.page.borderBox[axis.end] + itemSize,
      },
    });
    const inForeign5: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'inForeign5',
        type: typeId,
        droppableId: foreignId,
        index: 4,
      },
      borderBox: {
        [axis.crossAxisStart]: foreignCrossAxisStart,
        [axis.crossAxisEnd]: foreignCrossAxisEnd,
        [axis.start]: inForeign4.page.borderBox[axis.end],
        [axis.end]: inForeign4.page.borderBox[axis.end] + itemSize,
      },
    });
    const draggables: DraggableDimensionMap = toDraggableMap([
      inHome1,
      inForeign1,
      inForeign2,
      inForeign3,
      inForeign4,
      inForeign5,
    ]);

    it('should increase the visible displacement in the window by the amount of the max scroll change', () => {
      const foreign: DroppableDimension = getDroppableDimension({
        descriptor: {
          id: foreignId,
          type: 'huge',
          mode: 'STANDARD',
        },
        direction: axis.direction,
        borderBox: {
          [axis.crossAxisStart]: foreignCrossAxisStart,
          [axis.crossAxisEnd]: foreignCrossAxisEnd,
          [axis.start]: 0,
          [axis.end]: 10000,
        },
      });
      // Viewport is big enough to fit inForeign1 and inForeign2
      const sizeOfViewport: number = itemSize + itemSize - 1;

      const viewport: Viewport = createViewport({
        frame: getRect({
          [axis.crossAxisStart]: 0,
          [axis.crossAxisEnd]: 10000,
          [axis.start]: 0,
          [axis.end]: sizeOfViewport,
        }),
        scroll: origin,
        // some massive number
        scrollHeight: 20000,
        scrollWidth: 20000,
      });
      // visiblity validation
      // in the foreign list, these should be visible
      expect(
        isPartiallyVisible({
          target: inForeign1.page.borderBox,
          destination: foreign,
          viewport: viewport.frame,
          withDroppableDisplacement: true,
        }),
      ).toBe(true);
      expect(
        isPartiallyVisible({
          target: inForeign2.page.borderBox,
          destination: foreign,
          viewport: viewport.frame,
          withDroppableDisplacement: true,
        }),
      ).toBe(true);
      // the rest should be invisible
      expect(
        isPartiallyVisible({
          target: inForeign3.page.borderBox,
          destination: foreign,
          viewport: viewport.frame,
          withDroppableDisplacement: true,
        }),
      ).toBe(false);
      expect(
        isPartiallyVisible({
          target: inForeign4.page.borderBox,
          destination: foreign,
          viewport: viewport.frame,
          withDroppableDisplacement: true,
        }),
      ).toBe(false);
      expect(
        isPartiallyVisible({
          target: inForeign5.page.borderBox,
          destination: foreign,
          viewport: viewport.frame,
          withDroppableDisplacement: true,
        }),
      ).toBe(false);

      // inHome1 has moved into the foreign list below inForeign1
      const displacedBy: DisplacedBy = getDisplacedBy(axis, inHome1.displaceBy);

      const previousImpact: DragImpact = {
        displaced: getForcedDisplacement({
          // would normally be visible in viewport
          visible: [{ dimension: inForeign2 }],
          // normally not visible in viewport
          invisible: [inForeign3, inForeign4, inForeign5],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          destination: {
            droppableId: foreign.descriptor.id,
            index: inForeign2.descriptor.index,
          },
        },
      };

      const result: DragImpact = speculativelyIncrease({
        impact: previousImpact,
        viewport,
        destination: foreign,
        draggables,
        maxScrollChange: patch(axis.line, itemSize),
      });

      const expected: DragImpact = {
        // unchanged locations
        ...previousImpact,
        displaced: getForcedDisplacement({
          visible: [
            // already visibly displaced: inside viewport
            { dimension: inForeign2, shouldAnimate: true },
            // speculatively increased. Forced to not animate
            { dimension: inForeign3, shouldAnimate: false },
            { dimension: inForeign4, shouldAnimate: false },
          ],
          // Bigger than 2x the size of the viewport - outside of the overscanning reach
          invisible: [inForeign5],
        }),
      };
      expect(result).toEqual(expected);
    });

    it('should increase the visible displacement in the droppable by the amount of the max scroll change', () => {
      // when moving into the foreign list there will be enough room for inHome1 and inForeign1
      // inHome1 and inForeign1 can be visible in the viewport at the same time
      const sizeOfDroppable: number = itemSize + itemSize - 1;

      const foreign: DroppableDimension = getDroppableDimension({
        descriptor: {
          id: foreignId,
          type: 'huge',
          mode: 'STANDARD',
        },
        direction: axis.direction,
        // large subject
        borderBox: {
          [axis.crossAxisStart]: foreignCrossAxisStart,
          [axis.crossAxisEnd]: foreignCrossAxisEnd,
          [axis.start]: 0,
          [axis.end]: 10000,
        },
        // small frame (will clip subject)
        closest: {
          borderBox: {
            [axis.crossAxisStart]: foreignCrossAxisStart,
            [axis.crossAxisEnd]: foreignCrossAxisEnd,
            [axis.start]: 0,
            [axis.end]: sizeOfDroppable,
          },
          shouldClipSubject: true,
          scroll: origin,
          scrollSize: {
            scrollHeight: 10000,
            scrollWidth: 10000,
          },
        },
      });
      // huge viewport
      const viewport: Viewport = createViewport({
        frame: getRect({
          [axis.crossAxisStart]: 0,
          [axis.crossAxisEnd]: 10000,
          [axis.start]: 0,
          [axis.end]: 10000,
        }),
        scroll: origin,
        scrollHeight: 10000,
        scrollWidth: 10000,
      });
      // visiblity validation
      // in the foreign list, these should be visible
      expect(
        isPartiallyVisible({
          target: inForeign1.page.borderBox,
          destination: foreign,
          viewport: viewport.frame,
          withDroppableDisplacement: true,
        }),
      ).toBe(true);
      expect(
        isPartiallyVisible({
          target: inForeign2.page.borderBox,
          destination: foreign,
          viewport: viewport.frame,
          withDroppableDisplacement: true,
        }),
      ).toBe(true);
      // the rest should be invisible
      expect(
        isPartiallyVisible({
          target: inForeign3.page.borderBox,
          destination: foreign,
          viewport: viewport.frame,
          withDroppableDisplacement: true,
        }),
      ).toBe(false);
      expect(
        isPartiallyVisible({
          target: inForeign4.page.borderBox,
          destination: foreign,
          viewport: viewport.frame,
          withDroppableDisplacement: true,
        }),
      ).toBe(false);
      expect(
        isPartiallyVisible({
          target: inForeign5.page.borderBox,
          destination: foreign,
          viewport: viewport.frame,
          withDroppableDisplacement: true,
        }),
      ).toBe(false);

      // inHome1 has moved into the foreign list below inForeign1
      const displacedBy: DisplacedBy = getDisplacedBy(axis, inHome1.displaceBy);

      const previousImpact: DragImpact = {
        displaced: getForcedDisplacement({
          // would normally be visible in viewport
          visible: [{ dimension: inForeign2 }],
          // normally not visible in viewport
          invisible: [inForeign3, inForeign4, inForeign5],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          destination: {
            droppableId: foreign.descriptor.id,
            index: inForeign2.descriptor.index,
          },
        },
      };

      const result: DragImpact = speculativelyIncrease({
        impact: previousImpact,
        viewport,
        destination: foreign,
        draggables,
        maxScrollChange: patch(axis.line, itemSize),
      });

      const expected: DragImpact = {
        // unchanged locations
        ...previousImpact,
        displaced: getForcedDisplacement({
          visible: [
            // already visibly displaced
            { dimension: inForeign2, shouldAnimate: true },
            // speculatively increased. Forced to not animate
            { dimension: inForeign3, shouldAnimate: false },
            { dimension: inForeign4, shouldAnimate: false },
          ],
          // not speculatively increased
          invisible: [inForeign5],
        }),
      };
      expect(result).toEqual(expected);
    });
  });
});
