// @flow
import { type Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import type {
  Viewport,
  Axis,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DisplacedBy,
  Displacement,
} from '../../../../../../src/types';
import moveToNewDroppable from '../../../../../../src/state/move-in-direction/move-cross-axis/move-to-new-droppable';
import { horizontal, vertical } from '../../../../../../src/state/axis';
import {
  getPreset,
  getDraggableDimension,
  getDroppableDimension,
} from '../../../../../utils/dimension';
import noImpact, { noMovement } from '../../../../../../src/state/no-impact';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import { toDraggableMap } from '../../../../../../src/state/dimension-structures';
import getVisibleDisplacement from '../../../../../utils/get-visible-displacement';

const dontCare: Position = { x: 0, y: 0 };

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    it('should not to anything if there is not target (can happen if invisibile)', () => {
      expect(
        moveToNewDroppable({
          previousPageBorderBoxCenter: dontCare,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          moveRelativeTo: null,
          previousImpact: noImpact,
          viewport,
        }),
      ).toBe(null);
    });

    describe('moving back into original index', () => {
      it('should return an empty impact with the original location', () => {
        // the second draggable is moving back into its preset.home
        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: dontCare,
          draggable: preset.inHome2,
          draggables: preset.draggables,
          moveRelativeTo: preset.inHome2,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: noImpact,
          viewport,
        });
        invariant(result);
        const expected: DragImpact = {
          movement: noMovement,
          direction: axis.direction,
          destination: {
            droppableId: preset.home.descriptor.id,
            index: preset.inHome2.descriptor.index,
          },
          merge: null,
        };

        expect(result).toEqual(expected);
      });
    });

    describe('moving before the original index', () => {
      it('should move the everything from the target index to the original index forward', () => {
        // moving preset.inHome4 into the preset.inHome2 position
        const willDisplaceForward: boolean = true;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome4.displaceBy,
          willDisplaceForward,
        );

        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: dontCare,
          draggable: preset.inHome4,
          draggables: preset.draggables,
          moveRelativeTo: preset.inHome2,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: noImpact,
          viewport,
        });
        invariant(result);

        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inHome2),
          getVisibleDisplacement(preset.inHome3),
        ];
        const expected: DragImpact = {
          movement: {
            // ordered by closest impacted
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
            willDisplaceForward,
          },
          direction: axis.direction,
          destination: {
            droppableId: preset.home.descriptor.id,
            index: preset.inHome2.descriptor.index,
          },
          merge: null,
        };
        expect(result).toEqual(expected);
      });
    });

    describe('moving after the original index', () => {
      it('should move the everything from the target index to the original index forward', () => {
        // moving inHome1 after inHome4
        // displace backwards when in front of home
        const willDisplaceForward: boolean = false;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome1.displaceBy,
          willDisplaceForward,
        );
        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: dontCare,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          moveRelativeTo: preset.inHome4,
          destination: preset.home,
          insideDestination: preset.inHomeList,
          previousImpact: noImpact,
          viewport,
        });
        invariant(result);

        // ordered by closest impacted
        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inHome4),
          getVisibleDisplacement(preset.inHome3),
          getVisibleDisplacement(preset.inHome2),
        ];
        const expected: DragImpact = {
          movement: {
            // ordered by closest impacted
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
            willDisplaceForward,
          },
          direction: axis.direction,
          destination: {
            droppableId: preset.home.descriptor.id,
            index: preset.inHome4.descriptor.index,
          },
          merge: null,
        };
        expect(result).toEqual(expected);
      });
    });

    describe('visibility and displacement', () => {
      it('should indicate when displacement is not visible when not partially visible in the droppable frame', () => {
        const droppable: DroppableDimension = getDroppableDimension({
          descriptor: {
            id: 'with-frame',
            type: 'TYPE',
          },
          direction: axis.direction,
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            // will be cut by frame
            [axis.end]: 200,
          },
          closest: {
            borderBox: {
              [axis.crossAxisStart]: 0,
              [axis.crossAxisEnd]: 100,
              [axis.start]: 0,
              // will cut the subject
              [axis.end]: 100,
            },
            scrollSize: {
              scrollWidth: 200,
              scrollHeight: 200,
            },
            scroll: { x: 0, y: 0 },
            shouldClipSubject: true,
          },
        });
        const inside: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'inside',
            droppableId: droppable.descriptor.id,
            type: droppable.descriptor.type,
            index: 0,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            [axis.end]: 80,
          },
        });
        const outside: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'outside',
            droppableId: droppable.descriptor.id,
            type: droppable.descriptor.type,
            index: 1,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            // outside of the frame
            [axis.start]: 110,
            [axis.end]: 120,
          },
        });
        const customDraggables: DraggableDimension[] = [inside, outside];

        // moving outside back into list with closest being 'outside'

        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: dontCare,
          draggable: inside,
          draggables: toDraggableMap(customDraggables),
          moveRelativeTo: outside,
          destination: droppable,
          insideDestination: customDraggables,
          previousImpact: noImpact,
          viewport,
        });
        invariant(result);

        // displace backwards when moving forward past start
        const willDisplaceForward: boolean = false;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          inside.displaceBy,
          willDisplaceForward,
        );
        const displaced: Displacement[] = [
          {
            draggableId: outside.descriptor.id,
            isVisible: false,
            shouldAnimate: false,
          },
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            willDisplaceForward,
            displacedBy,
          },
          direction: axis.direction,
          // moving into the outside position
          destination: {
            droppableId: droppable.descriptor.id,
            index: outside.descriptor.index,
          },
          merge: null,
        };

        expect(result).toEqual(expected);
      });

      it('should indicate when displacement is not visible when not partially visible in the viewport', () => {
        const droppable: DroppableDimension = getDroppableDimension({
          descriptor: {
            id: 'with-frame',
            type: 'TYPE',
          },
          direction: axis.direction,
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            // extends beyond the viewport
            [axis.end]: viewport.frame[axis.end] + 100,
          },
        });
        const inside: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'inside',
            droppableId: droppable.descriptor.id,
            type: droppable.descriptor.type,
            index: 0,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            [axis.end]: viewport.frame[axis.end],
          },
        });
        const outside: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'outside',
            droppableId: droppable.descriptor.id,
            type: droppable.descriptor.type,
            index: 1,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            // outside of the viewport but inside the droppable
            [axis.start]: viewport.frame[axis.end] + 1,
            [axis.end]: viewport.frame[axis.end] + 10,
          },
        });
        const customDraggables: DraggableDimension[] = [inside, outside];

        // Goal: moving inside back into list with closest being 'outside'
        // displace backwards when moving forward past start

        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: dontCare,
          draggable: inside,
          draggables: toDraggableMap(customDraggables),
          moveRelativeTo: outside,
          destination: droppable,
          insideDestination: customDraggables,
          previousImpact: noImpact,
          viewport,
        });
        invariant(result);

        const willDisplaceForward: boolean = false;
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          inside.displaceBy,
          willDisplaceForward,
        );
        const displaced: Displacement[] = [
          {
            draggableId: outside.descriptor.id,
            isVisible: false,
            shouldAnimate: false,
          },
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
            willDisplaceForward,
          },
          direction: axis.direction,
          // moving into the outside position
          destination: {
            droppableId: droppable.descriptor.id,
            index: outside.descriptor.index,
          },
          merge: null,
        };

        expect(result).toEqual(expected);
      });
    });
  });
});
