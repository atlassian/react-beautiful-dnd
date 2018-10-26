// @flow
import invariant from 'tiny-invariant';
import { getRect, type Position, type Rect } from 'css-box-model';
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
import getHomeImpact from '../../../../../../src/state/get-home-impact';
import {
  getDraggableDimension,
  getDroppableDimension,
  getFrame,
} from '../../../../../utils/dimension';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import { createViewport } from '../../../../../utils/viewport';
import moveToNextPlace from '../../../../../../src/state/move-in-direction/move-to-next-place';
import { type PublicResult } from '../../../../../../src/state/move-in-direction/move-in-direction-types';
import { origin, subtract } from '../../../../../../src/state/position';
import getPageBorderBoxCenter from '../../../../../../src/state/get-center-from-impact/get-page-border-box-center';
import { isTotallyVisible } from '../../../../../../src/state/visibility/is-visible';
import scrollDroppable from '../../../../../../src/state/droppable/scroll-droppable';

[vertical /* , horizontal */].forEach((axis: Axis) => {
  const hugeViewport: Viewport = createViewport({
    frame: getRect({
      top: 0,
      left: 0,
      bottom: 10000,
      right: 10000,
    }),
    scroll: origin,
    scrollHeight: 10000,
    scrollWidth: 10000,
  });

  const scrollable: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'scrollable droppable',
      type: 'hey',
    },
    direction: axis.direction,
    // huge subject that will be cut by frame
    borderBox: {
      top: 0,
      right: 10000,
      bottom: 10000,
      left: 0,
    },
    closest: {
      borderBox: {
        top: 0,
        right: 1000,
        bottom: 1000,
        left: 0,
      },
      shouldClipSubject: true,
      scroll: origin,
      scrollSize: {
        scrollWidth: 2000,
        scrollHeight: 2000,
      },
    },
  });

  const frameBorderBox: Rect = getFrame(scrollable).frameClient.borderBox;

  describe(`on ${axis.direction} axis`, () => {
    describe('moving forward', () => {
      const asBigAsFrame: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'asBigAsFrame',
          index: 0,
          droppableId: scrollable.descriptor.id,
          type: scrollable.descriptor.type,
        },
        borderBox: frameBorderBox,
      });
      const outsideFrame: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'outside',
          index: 1,
          droppableId: scrollable.descriptor.id,
          type: scrollable.descriptor.type,
        },
        borderBox: {
          // is bottom left of the frame
          top: frameBorderBox.bottom + 1,
          right: frameBorderBox.right + 100,
          left: frameBorderBox.right + 1,
          bottom: frameBorderBox.bottom + 100,
        },
      });
      // in home list moving forward
      const willDisplaceForward: boolean = false;
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        asBigAsFrame.displaceBy,
        willDisplaceForward,
      );
      const draggables: DraggableDimensionMap = {
        [asBigAsFrame.descriptor.id]: asBigAsFrame,
        [outsideFrame.descriptor.id]: outsideFrame,
      };

      it('should request a jump scroll for movement that is outside of the viewport', () => {
        // verify visibility is as expected
        expect(
          isTotallyVisible({
            target: asBigAsFrame.page.borderBox,
            viewport: hugeViewport.frame,
            withDroppableDisplacement: true,
            destination: scrollable,
          }),
        ).toBe(true);
        expect(
          isTotallyVisible({
            target: outsideFrame.page.borderBox,
            viewport: hugeViewport.frame,
            withDroppableDisplacement: true,
            destination: scrollable,
          }),
        ).toBe(false);

        const displaced: Displacement[] = [
          {
            draggableId: outsideFrame.descriptor.id,
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
            droppableId: scrollable.descriptor.id,
            index: outsideFrame.descriptor.index,
          },
          direction: axis.direction,
        };
        const previousPageBorderBoxCenter: Position =
          asBigAsFrame.page.borderBox.center;
        const previousClientSelection: Position =
          asBigAsFrame.client.borderBox.center;

        // figure out where we would have been if it was visible
        const nonVisibleCenter = getPageBorderBoxCenter({
          impact: expectedImpact,
          draggable: asBigAsFrame,
          droppable: scrollable,
          draggables,
        });
        const expectedScrollJump: Position = subtract(
          nonVisibleCenter,
          previousPageBorderBoxCenter,
        );

        const result: ?PublicResult = moveToNextPlace({
          isMovingForward: true,
          draggable: asBigAsFrame,
          destination: scrollable,
          draggables,
          previousImpact: getHomeImpact(asBigAsFrame, scrollable),
          viewport: hugeViewport,
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
        const initiallyInsideFrame: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'inside',
            index: 0,
            droppableId: scrollable.descriptor.id,
            type: scrollable.descriptor.type,
          },
          borderBox: frameBorderBox,
        });
        const initiallyOutsideFrame: DraggableDimension = getDraggableDimension(
          {
            descriptor: {
              id: 'outside',
              index: 1,
              droppableId: scrollable.descriptor.id,
              type: scrollable.descriptor.type,
            },
            borderBox: {
              // is bottom left of the frame
              top: frameBorderBox.bottom + 1,
              right: frameBorderBox.right + 100,
              left: frameBorderBox.right + 1,
              bottom: frameBorderBox.bottom + 100,
            },
          },
        );
        // in home list moving initiallyOutsideViewport backwards
        const willDisplaceForward: boolean = true;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          initiallyOutsideFrame.displaceBy,
          willDisplaceForward,
        );
        const draggables: DraggableDimensionMap = {
          [initiallyInsideFrame.descriptor.id]: initiallyInsideFrame,
          [initiallyOutsideFrame.descriptor.id]: initiallyOutsideFrame,
        };

        const newScroll: Position = {
          x: frameBorderBox.bottom + 1,
          y: frameBorderBox.right + 1,
        };
        const scrolled: DroppableDimension = scrollDroppable(
          scrollable,
          newScroll,
        );

        // verify visibility is as expected
        // before scroll
        expect(
          isTotallyVisible({
            target: initiallyInsideFrame.page.borderBox,
            viewport: hugeViewport.frame,
            withDroppableDisplacement: true,
            destination: scrollable,
          }),
        ).toBe(true);
        expect(
          isTotallyVisible({
            target: initiallyOutsideFrame.page.borderBox,
            viewport: hugeViewport.frame,
            withDroppableDisplacement: true,
            destination: scrollable,
          }),
        ).toBe(false);

        // after scroll: visibility is swapped
        expect(
          isTotallyVisible({
            target: initiallyInsideFrame.page.borderBox,
            viewport: hugeViewport.frame,
            withDroppableDisplacement: true,
            destination: scrolled,
          }),
        ).toBe(false);

        expect(
          isTotallyVisible({
            target: initiallyOutsideFrame.page.borderBox,
            viewport: hugeViewport.frame,
            withDroppableDisplacement: true,
            destination: scrolled,
          }),
        ).toBe(true);

        const displaced: Displacement[] = [
          {
            draggableId: initiallyInsideFrame.descriptor.id,
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
            droppableId: scrolled.descriptor.id,
            index: initiallyInsideFrame.descriptor.index,
          },
          direction: axis.direction,
        };
        const previousPageBorderBoxCenter: Position =
          initiallyOutsideFrame.page.borderBox.center;
        const previousClientSelection: Position =
          initiallyOutsideFrame.client.borderBox.center;

        // figure out where we would have been if it was visible
        const nonVisibleCenter = getPageBorderBoxCenter({
          impact: expectedImpact,
          draggable: initiallyOutsideFrame,
          droppable: scrolled,
          draggables,
        });
        const expectedScrollJump: Position = subtract(
          nonVisibleCenter,
          previousPageBorderBoxCenter,
        );

        const result: ?PublicResult = moveToNextPlace({
          isMovingForward: false,
          draggable: initiallyOutsideFrame,
          destination: scrolled,
          draggables,
          previousImpact: getHomeImpact(initiallyOutsideFrame, scrollable),
          viewport: hugeViewport,
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
