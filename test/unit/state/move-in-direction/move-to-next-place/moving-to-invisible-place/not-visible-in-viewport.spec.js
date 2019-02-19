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
import { origin, subtract, patch } from '../../../../../../src/state/position';
import getPageBorderBoxCenter from '../../../../../../src/state/get-center-from-impact/get-page-border-box-center';
import scrollViewport from '../../../../../../src/state/scroll-viewport';
import {
  isTotallyVisible,
  isPartiallyVisible,
} from '../../../../../../src/state/visibility/is-visible';
import { toDraggableMap } from '../../../../../../src/state/dimension-structures';
import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';
import getVisibleDisplacement from '../../../../../utils/get-displacement/get-visible-displacement';
import getClientFromPageBorderBoxCenter from '../../../../../../src/state/get-center-from-impact/get-client-border-box-center/get-client-from-page-border-box-center';

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
  const draggables: DraggableDimensionMap = toDraggableMap([inHome, inForeign]);
  const { onLift, impact: homeImpact } = getHomeOnLift({
    draggable: inHome,
    draggables,
    home,
    viewport,
  });

  describe(`on ${axis.direction} axis`, () => {
    describe('moving forward', () => {
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
        const previousPageBorderBoxCenter: Position =
          inHome.page.borderBox.center;
        const previousClientSelection: Position =
          inHome.client.borderBox.center;
        const displaced: Displacement[] = [getVisibleDisplacement(inForeign)];
        const previousImpact: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          merge: null,
          destination: {
            droppableId: foreign.descriptor.id,
            index: inForeign.descriptor.index,
          },
          direction: axis.direction,
        };

        const result: ?PublicResult = moveToNextPlace({
          isMovingForward: true,
          draggable: inHome,
          destination: foreign,
          draggables,
          previousImpact,
          viewport,
          previousPageBorderBoxCenter,
          previousClientSelection,
          onLift,
        });
        invariant(result);

        const expectedImpact: DragImpact = {
          movement: {
            displaced: [],
            map: {},
            displacedBy,
          },
          merge: null,
          destination: {
            droppableId: foreign.descriptor.id,
            index: inForeign.descriptor.index + 1,
          },
          direction: axis.direction,
        };
        // if the item would have been visible - where would the center have been?
        const nonVisibleCenter = getPageBorderBoxCenter({
          impact: expectedImpact,
          draggable: inHome,
          droppable: foreign,
          draggables,
          onLift,
        });
        const expectedScrollJump: Position = subtract(
          nonVisibleCenter,
          previousPageBorderBoxCenter,
        );
        const expected: PublicResult = {
          clientSelection: previousClientSelection,
          impact: expectedImpact,
          scrollJumpRequest: expectedScrollJump,
        };
        expect(result).toEqual(expected);
      });
    });

    describe('moving backward', () => {
      // inHome after inForeign and inForeign is not visible
      const newScroll: Position = patch(
        axis.line,
        viewport.frame[axis.end] + 1,
      );
      const scrolled: Viewport = scrollViewport(viewport, newScroll);

      it('should be setup correctly', () => {
        // verify visibility is as expected
        expect(
          isTotallyVisible({
            target: inForeign.page.borderBox,
            viewport: scrolled.frame,
            withDroppableDisplacement: true,
            destination: foreign,
          }),
        ).toBe(false);
        // going further - ensure it is not partially visible
        expect(
          isPartiallyVisible({
            target: inForeign.page.borderBox,
            viewport: scrolled.frame,
            withDroppableDisplacement: true,
            destination: foreign,
          }),
        ).toBe(false);

        // checking that if displaced then inForeign would be visible
        // using raw .displacedBy as we are scolling on
        const displaced: BoxModel = offset(
          inForeign.client,
          getDisplacedBy(axis, inHome.displaceBy).point,
        );
        expect(
          isPartiallyVisible({
            target: displaced.borderBox,
            viewport: scrolled.frame,
            withDroppableDisplacement: true,
            destination: foreign,
          }),
        ).toBe(true);
      });

      it('should request a jump scroll for movement that is outside of the viewport', () => {
        // after non-displaced inForeign
        const previousImpact: DragImpact = {
          movement: {
            displaced: [],
            map: {},
            displacedBy: getDisplacedBy(axis, inHome.displaceBy),
          },
          direction: axis.direction,
          destination: {
            droppableId: foreign.descriptor.id,
            index: inForeign.descriptor.index + 1,
          },
          merge: null,
        };
        const previousPageBorderBoxCenter: Position = getPageBorderBoxCenter({
          impact: previousImpact,
          onLift,
          draggable: inHome,
          droppable: foreign,
          draggables,
        });
        const previousClientSelection: Position = getClientFromPageBorderBoxCenter(
          {
            pageBorderBoxCenter: previousPageBorderBoxCenter,
            draggable: inHome,
            viewport: scrolled,
          },
        );
        // const previousPageBorderBoxCenter: Position =
        //   initiallyOutsideViewport.page.borderBox.center;
        // const previousClientSelection: Position =
        //   initiallyOutsideViewport.client.borderBox.center;

        // figure out where we would have been if it was visible

        const result: ?PublicResult = moveToNextPlace({
          isMovingForward: false,
          draggable: inHome,
          destination: foreign,
          draggables,
          previousImpact,
          viewport: scrolled,
          previousPageBorderBoxCenter,
          previousClientSelection,
          onLift,
        });
        invariant(result);

        const expectedDisplaced: Displacement[] = [
          // Even though the item started in an invisible place we force
          // the displacement to be visible.
          getVisibleDisplacement(inForeign),
        ];
        const expectedImpact: DragImpact = {
          movement: {
            displaced: expectedDisplaced,
            map: getDisplacementMap(expectedDisplaced),
            displacedBy,
          },
          merge: null,
          // moving into place of inForeign
          destination: {
            droppableId: foreign.descriptor.id,
            index: inForeign.descriptor.index,
          },
          direction: axis.direction,
        };
        // if the item would have been visible - where would the center have been?
        const nonVisibleCenter = getPageBorderBoxCenter({
          impact: expectedImpact,
          draggable: inHome,
          droppable: foreign,
          draggables,
          onLift,
        });
        const expectedScrollJump: Position = subtract(
          nonVisibleCenter,
          previousPageBorderBoxCenter,
        );
        const expected: PublicResult = {
          clientSelection: previousClientSelection,
          impact: expectedImpact,
          scrollJumpRequest: expectedScrollJump,
        };
        expect(result).toEqual(expected);
      });
    });
  });
});
