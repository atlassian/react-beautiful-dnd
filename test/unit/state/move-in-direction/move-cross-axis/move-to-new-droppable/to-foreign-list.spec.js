// @flow
import invariant from 'tiny-invariant';
import { type Position, type BoxModel, type Spacing } from 'css-box-model';
import type {
  Viewport,
  Axis,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DisplacedBy,
  Displacement,
  DraggableDimensionMap,
} from '../../../../../../src/types';
import moveToNewDroppable from '../../../../../../src/state/move-in-direction/move-cross-axis/move-to-new-droppable';
import scrollDroppable from '../../../../../../src/state/droppable/scroll-droppable';
import {
  add,
  patch,
  subtract,
  negate,
} from '../../../../../../src/state/position';
import { horizontal, vertical } from '../../../../../../src/state/axis';
import {
  getPreset,
  makeScrollable,
  getDraggableDimension,
  getDroppableDimension,
} from '../../../../../utils/dimension';
import noImpact, { noMovement } from '../../../../../../src/state/no-impact';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';
import { toDraggableMap } from '../../../../../../src/state/dimension-structures';
import scrollViewport from '../../../../../../src/state/scroll-viewport';
import getVisibleDisplacement from '../../../../../utils/get-displacement/get-visible-displacement';
import { goIntoStart } from '../../../../../../src/state/get-center-from-impact/move-relative-to';
import { offsetByPosition } from '../../../../../../src/state/spacing';
import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    describe('moving into an unpopulated list', () => {
      const { onLift, impact: homeImpact } = getHomeOnLift({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });

      it('should move into the first position of the list', () => {
        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          moveRelativeTo: null,
          destination: preset.emptyForeign,
          insideDestination: [],
          previousImpact: homeImpact,
          viewport,
          onLift,
        });
        invariant(result);

        const expected: DragImpact = {
          movement: noMovement,
          direction: preset.emptyForeign.axis.direction,
          destination: {
            droppableId: preset.emptyForeign.descriptor.id,
            index: 0,
          },
          merge: null,
        };

        expect(result).toEqual(expected);
      });

      describe('only move into first position if it is visible', () => {
        const distanceToContentBoxStart = (box: BoxModel): number =>
          box.margin[axis.start] +
          box.border[axis.start] +
          box.padding[axis.start];

        it('should not move into the start of list if the position is not visible due to droppable scroll', () => {
          const whatNewCenterWouldBeWithoutScroll: Position = goIntoStart({
            axis,
            moveInto: preset.emptyForeign.page,
            isMoving: preset.inHome1.page,
          });
          const totalShift: Position = subtract(
            whatNewCenterWouldBeWithoutScroll,
            preset.inHome1.page.borderBox.center,
          );
          const shiftedInHome1Page: Spacing = offsetByPosition(
            preset.inHome1.page.borderBox,
            totalShift,
          );
          invariant(preset.emptyForeign.subject.active);
          const maxAllowableScroll: Position = negate(
            subtract(
              patch(axis.line, preset.emptyForeign.subject.active[axis.start]),
              patch(axis.line, shiftedInHome1Page[axis.start]),
            ),
          );
          const pastMaxAllowableScroll: Position = add(
            maxAllowableScroll,
            patch(axis.line, 1),
          );

          // validation: no scrolled droppable
          {
            const result: ?DragImpact = moveToNewDroppable({
              previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
              draggable: preset.inHome1,
              draggables: preset.draggables,
              moveRelativeTo: null,
              destination: preset.emptyForeign,
              insideDestination: [],
              previousImpact: homeImpact,
              viewport,
              onLift,
            });
            expect(result).toBeTruthy();
          }

          // center on visible edge = can move
          {
            const scrollable: DroppableDimension = makeScrollable(
              preset.foreign,
              maxAllowableScroll[axis.line],
            );
            const scrolled: DroppableDimension = scrollDroppable(
              scrollable,
              maxAllowableScroll,
            );

            const result: ?DragImpact = moveToNewDroppable({
              previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
              draggable: preset.inHome1,
              draggables: preset.draggables,
              moveRelativeTo: null,
              destination: scrolled,
              insideDestination: [],
              previousImpact: homeImpact,
              viewport,
              onLift,
            });
            expect(result).toBeTruthy();
          }
          // center past visible edge = cannot move
          {
            const scrollable: DroppableDimension = makeScrollable(
              preset.emptyForeign,
              pastMaxAllowableScroll[axis.line],
            );
            const scrolled: DroppableDimension = scrollDroppable(
              scrollable,
              pastMaxAllowableScroll,
            );
            const result: ?DragImpact = moveToNewDroppable({
              previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
              draggable: preset.inHome1,
              draggables: preset.draggables,
              moveRelativeTo: null,
              destination: scrolled,
              insideDestination: [],
              previousImpact: homeImpact,
              viewport,
              onLift,
            });

            expect(result).toBe(null);
          }
        });

        it('should not move into the start of list if the position is not visible due to page scroll', () => {
          const emptyForeignPageBox: BoxModel = preset.emptyForeign.page;
          const distanceToStartOfDroppableContentBox: number = distanceToContentBoxStart(
            emptyForeignPageBox,
          );
          const inHome1PageBox: BoxModel = preset.inHome1.page;
          const distanceToCenterOfDragging: number =
            distanceToContentBoxStart(inHome1PageBox) +
            inHome1PageBox.contentBox[axis.size] / 2;

          const distanceToStartOfViewport: number =
            emptyForeignPageBox.marginBox[axis.start];
          const onVisibleEdge: Position = patch(
            axis.line,
            distanceToStartOfViewport +
              distanceToStartOfDroppableContentBox +
              distanceToCenterOfDragging,
          );
          const pastVisibleEdge: Position = add(
            onVisibleEdge,
            patch(axis.line, 1),
          );
          // validate with no scroll
          {
            const result: ?DragImpact = moveToNewDroppable({
              previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
              draggable: preset.inHome1,
              draggables: preset.draggables,
              destination: preset.emptyForeign,
              moveRelativeTo: null,
              insideDestination: [],
              previousImpact: homeImpact,
              viewport,
              onLift,
            });

            expect(result).toBeTruthy();
          }
          // center on visible edge = can move
          {
            const scrolled: Viewport = scrollViewport(viewport, onVisibleEdge);

            const result: ?DragImpact = moveToNewDroppable({
              previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
              draggable: preset.inHome1,
              draggables: preset.draggables,
              destination: preset.emptyForeign,
              moveRelativeTo: null,
              insideDestination: [],
              previousImpact: homeImpact,
              viewport: scrolled,
              onLift,
            });

            expect(result).toBeTruthy();
          }
          // center past visible edge = cannot move
          {
            const scrolled: Viewport = scrollViewport(
              viewport,
              pastVisibleEdge,
            );

            const result: ?DragImpact = moveToNewDroppable({
              previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
              draggable: preset.inHome1,
              draggables: preset.draggables,
              moveRelativeTo: null,
              destination: preset.emptyForeign,
              insideDestination: [],
              previousImpact: homeImpact,
              viewport: scrolled,
              onLift,
            });

            expect(result).toBe(null);
          }
        });

        it('should allow a big item to move into a smaller list', () => {
          const crossAxisStart: number =
            preset.home.client.marginBox[axis.crossAxisEnd] + 1;
          const smallDroppable: DroppableDimension = getDroppableDimension({
            descriptor: {
              id: 'small',
              type: preset.home.descriptor.type,
            },
            // currently no room in the box
            borderBox: {
              [axis.crossAxisStart]: crossAxisStart,
              [axis.crossAxisEnd]: crossAxisStart,
              [axis.start]: 0,
              [axis.end]: 0,
            },
            direction: axis.direction,
            windowScroll: preset.windowScroll,
          });

          const result: ?DragImpact = moveToNewDroppable({
            previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
            draggable: preset.inHome1,
            draggables: preset.draggables,
            moveRelativeTo: null,
            destination: smallDroppable,
            insideDestination: [],
            previousImpact: homeImpact,
            viewport,
            onLift,
          });

          expect(result).toBeTruthy();
        });
      });
    });

    describe('is going before a target', () => {
      const { onLift, impact: homeImpact } = getHomeOnLift({
        draggable: preset.inHome1,
        home: preset.home,
        draggables: preset.draggables,
        viewport: preset.viewport,
      });
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome1.displaceBy,
      );

      it('should move the target and everything below it forward', () => {
        // moving home1 into the second position of the list

        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          // moving before target
          moveRelativeTo: preset.inForeign2,
          destination: preset.foreign,
          insideDestination: preset.inForeignList,
          previousImpact: homeImpact,
          viewport,
          onLift,
        });
        invariant(result);

        // ordered by closest impacted
        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inForeign2),
          getVisibleDisplacement(preset.inForeign3),
          getVisibleDisplacement(preset.inForeign4),
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          direction: preset.foreign.axis.direction,
          destination: {
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign2.descriptor.index,
          },
          merge: null,
        };

        expect(result).toEqual(expected);
      });
    });

    describe('is going after a target', () => {
      it('should move the target and everything below it forward', () => {
        // moving inHome3 relative to inForeign1 (will go after inForeign1)
        const { onLift, impact: homeImpact } = getHomeOnLift({
          draggable: preset.inHome1,
          home: preset.home,
          draggables: preset.draggables,
          viewport: preset.viewport,
        });
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome3.displaceBy,
        );
        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
          draggable: preset.inHome3,
          draggables: preset.draggables,
          // moving relative to inForeign1
          // will actually go after it
          moveRelativeTo: preset.inForeign1,
          destination: preset.foreign,
          insideDestination: preset.inForeignList,
          previousImpact: homeImpact,
          viewport,
          onLift,
        });

        // ordered by closest impacted
        // everything after inForeign1
        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inForeign2),
          getVisibleDisplacement(preset.inForeign3),
          getVisibleDisplacement(preset.inForeign4),
        ];
        const expected: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          direction: preset.foreign.axis.direction,
          destination: {
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign2.descriptor.index,
          },
          merge: null,
        };
        expect(result).toEqual(expected);
      });
    });

    describe('is moving after the last position of a list', () => {
      it('should go after the non-displaced last item in the list', () => {
        // Moving inHome4 relative to inForeign1
        // Stripping out all the other items in the foreign so that we
        // are sure to move after the last item (inForeign1)
        const { onLift, impact: homeImpact } = getHomeOnLift({
          draggable: preset.inHome4,
          home: preset.home,
          draggables: preset.draggables,
          viewport: preset.viewport,
        });
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome4.displaceBy,
        );

        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
          draggable: preset.inHome4,
          draggables: preset.draggables,
          moveRelativeTo: preset.inForeign1,
          destination: preset.foreign,
          insideDestination: [preset.inForeign1],
          previousImpact: homeImpact,
          viewport,
          onLift,
        });
        invariant(result);

        const expected: DragImpact = {
          movement: {
            displaced: [],
            map: {},
            displacedBy,
          },
          direction: preset.foreign.axis.direction,
          destination: {
            droppableId: preset.foreign.descriptor.id,
            index: preset.inForeign1.descriptor.index + 1,
          },
          merge: null,
        };
        expect(result).toEqual(expected);
      });
    });
  });
});
