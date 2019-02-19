// @flow
import invariant from 'tiny-invariant';
import { getRect, type Position, type BoxModel, offset } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  Displacement,
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  DisplacedBy,
  Viewport,
} from '../../../../../../src/types';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import {
  getDraggableDimension,
  getDroppableDimension,
} from '../../../../../utils/dimension';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import { createViewport } from '../../../../../utils/viewport';
import moveToNextPlace from '../../../../../../src/state/move-in-direction/move-to-next-place';
import { type PublicResult } from '../../../../../../src/state/move-in-direction/move-in-direction-types';
import { origin, subtract } from '../../../../../../src/state/position';
import getPageBorderBoxCenter from '../../../../../../src/state/get-center-from-impact/get-page-border-box-center';
import scrollViewport from '../../../../../../src/state/scroll-viewport';
import { isTotallyVisible } from '../../../../../../src/state/visibility/is-visible';
import { toDraggableMap } from '../../../../../../src/state/dimension-structures';

[vertical, horizontal].forEach((axis: Axis) => {
  const viewport: Viewport = createViewport({
    frame: getRect({
      top: 0,
      left: 0,
      bottom: 1000,
      right: 1000,
    }),
    scroll: origin,
    scrollHeight: 2000,
    scrollWidth: 2000,
  });

  const home: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'home - much bigger than viewport',
      type: 'huge',
    },
    direction: axis.direction,
    borderBox: {
      top: 0,
      right: 10000,
      bottom: 10000,
      left: 0,
    },
  });

  const foreign: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'foreign - much bigger than viewport',
      type: 'huge',
    },
    direction: axis.direction,
    borderBox: {
      top: 0,
      right: 10000,
      bottom: 10000,
      left: 0,
    },
  });

  describe(`on ${axis.direction} axis`, () => {
    describe('moving forward', () => {
      const inHome: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'in-home',
          index: 0,
          droppableId: home.descriptor.id,
          type: home.descriptor.type,
        },
        borderBox: viewport.frame,
      });
      const inForeign: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'in-foreign',
          index: 0,
          droppableId: foreign.descriptor.id,
          type: foreign.descriptor.type,
        },
        borderBox: viewport.frame,
      });
      // in home list moving forward
      const displacedBy: DisplacedBy = getDisplacedBy(axis, inHome.displaceBy);
      const draggables: DraggableDimensionMap = toDraggableMap([
        inHome,
        inForeign,
      ]);

      it('should be setup correctly', () => {
        // verify visibility is as expected
        // before scroll
        expect(
          isTotallyVisible({
            target: inHome.page.borderBox,
            viewport: viewport.frame,
            withDroppableDisplacement: true,
            destination: home,
          }),
        ).toBe(true);
        expect(
          isTotallyVisible({
            target: inForeign.page.borderBox,
            viewport: viewport.frame,
            withDroppableDisplacement: true,
            destination: foreign,
          }),
        ).toBe(true);

        const displaced: BoxModel = offset(
          inForeign.client,
          getDisplacedBy(vertical, inHome.displaceBy).point,
        );

        expect(
          isTotallyVisible({
            target: displaced.borderBox,
            viewport: viewport.frame,
            withDroppableDisplacement: true,
            destination: foreign,
          }),
        ).toBe(false);
      });

      it('should request a jump scroll for movement that is outside of the viewport', () => {
        const displaced: Displacement[] = [
          {
            draggableId: outsideViewport.descriptor.id,
            // Even though the item started in an invisible place we force
            // the displacement to be visible.
            isVisible: true,
            shouldAnimate: true,
          },
        ];

        const expectedImpact: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            willDisplaceForward,
            displacedBy,
          },
          merge: null,
          destination: {
            droppableId: hugeDroppable.descriptor.id,
            index: outsideViewport.descriptor.index,
          },
          direction: axis.direction,
        };
        const previousPageBorderBoxCenter: Position =
          asBigAsViewport.page.borderBox.center;
        const previousClientSelection: Position =
          asBigAsViewport.client.borderBox.center;

        // figure out where we would have been if it was visible
        const nonVisibleCenter = getPageBorderBoxCenter({
          impact: expectedImpact,
          draggable: asBigAsViewport,
          droppable: hugeDroppable,
          draggables,
        });
        const expectedScrollJump: Position = subtract(
          nonVisibleCenter,
          previousPageBorderBoxCenter,
        );

        const result: ?PublicResult = moveToNextPlace({
          isMovingForward: true,
          draggable: asBigAsViewport,
          destination: hugeDroppable,
          draggables,
          previousImpact: getHomeImpact(asBigAsViewport, hugeDroppable),
          viewport,
          previousPageBorderBoxCenter,
          previousClientSelection,
        });
        invariant(result);

        const expected: PublicResult = {
          // unchanged
          clientSelection: previousClientSelection,
          impact: expectedImpact,
          scrollJumpRequest: expectedScrollJump,
        };
        expect(result).toEqual(expected);
      });
    });

    describe('moving backward', () => {
      it('should request a jump scroll for movement that is outside of the viewport', () => {
        const initiallyInsideViewport: DraggableDimension = getDraggableDimension(
          {
            descriptor: {
              id: 'inside',
              index: 0,
              droppableId: hugeDroppable.descriptor.id,
              type: hugeDroppable.descriptor.type,
            },
            borderBox: viewport.frame,
          },
        );
        const initiallyOutsideViewport: DraggableDimension = getDraggableDimension(
          {
            descriptor: {
              id: 'outside',
              index: 1,
              droppableId: hugeDroppable.descriptor.id,
              type: hugeDroppable.descriptor.type,
            },
            borderBox: {
              // is bottom left of the viewport
              top: viewport.frame.bottom + 1,
              right: viewport.frame.right + 100,
              left: viewport.frame.right + 1,
              bottom: viewport.frame.bottom + 100,
            },
          },
        );
        // in home list moving initiallyOutsideViewport backwards
        const willDisplaceForward: boolean = true;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          initiallyOutsideViewport.displaceBy,
          willDisplaceForward,
        );
        const draggables: DraggableDimensionMap = {
          [initiallyInsideViewport.descriptor.id]: initiallyInsideViewport,
          [initiallyOutsideViewport.descriptor.id]: initiallyOutsideViewport,
        };

        const newScroll: Position = {
          x: viewport.frame.bottom + 1,
          y: viewport.frame.right + 1,
        };
        const scrolled: Viewport = scrollViewport(viewport, newScroll);

        // verify visibility is as expected
        // before scroll
        expect(
          isTotallyVisible({
            target: initiallyInsideViewport.page.borderBox,
            viewport: viewport.frame,
            withDroppableDisplacement: true,
            destination: hugeDroppable,
          }),
        ).toBe(true);
        expect(
          isTotallyVisible({
            target: initiallyOutsideViewport.page.borderBox,
            viewport: viewport.frame,
            withDroppableDisplacement: true,
            destination: hugeDroppable,
          }),
        ).toBe(false);

        // after scroll: visibility is swapped
        expect(
          isTotallyVisible({
            target: initiallyInsideViewport.page.borderBox,
            viewport: scrolled.frame,
            withDroppableDisplacement: true,
            destination: hugeDroppable,
          }),
        ).toBe(false);
        expect(
          isTotallyVisible({
            target: initiallyOutsideViewport.page.borderBox,
            viewport: scrolled.frame,
            withDroppableDisplacement: true,
            destination: hugeDroppable,
          }),
        ).toBe(true);

        const displaced: Displacement[] = [
          {
            draggableId: initiallyInsideViewport.descriptor.id,
            // Even though the item started in an invisible place we force
            // the displacement to be visible.
            isVisible: true,
            shouldAnimate: true,
          },
        ];
        const expectedImpact: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            willDisplaceForward,
            displacedBy,
          },
          merge: null,
          destination: {
            droppableId: hugeDroppable.descriptor.id,
            index: initiallyInsideViewport.descriptor.index,
          },
          direction: axis.direction,
        };
        const previousPageBorderBoxCenter: Position =
          initiallyOutsideViewport.page.borderBox.center;
        const previousClientSelection: Position =
          initiallyOutsideViewport.client.borderBox.center;

        // figure out where we would have been if it was visible
        const nonVisibleCenter = getPageBorderBoxCenter({
          impact: expectedImpact,
          draggable: initiallyOutsideViewport,
          droppable: hugeDroppable,
          draggables,
        });
        const expectedScrollJump: Position = subtract(
          nonVisibleCenter,
          previousPageBorderBoxCenter,
        );

        const result: ?PublicResult = moveToNextPlace({
          isMovingForward: false,
          draggable: initiallyOutsideViewport,
          destination: hugeDroppable,
          draggables,
          previousImpact: getHomeImpact(
            initiallyOutsideViewport,
            hugeDroppable,
          ),
          viewport: scrolled,
          previousPageBorderBoxCenter,
          previousClientSelection,
        });
        invariant(result);

        const expected: PublicResult = {
          // unchanged
          clientSelection: previousClientSelection,
          impact: expectedImpact,
          scrollJumpRequest: expectedScrollJump,
        };
        expect(result).toEqual(expected);
      });
    });
  });
});
