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
import getHomeImpact from '../../../../../../src/state/get-home-impact';
import getVisibleDisplacement from '../../../../../utils/get-visible-displacement';
import { goIntoStart } from '../../../../../../src/state/get-center-from-impact/move-relative-to';
import { offsetByPosition } from '../../../../../../src/state/spacing';

const dontCare: Position = { x: 0, y: 0 };

// always displace forward in foreign list
const willDisplaceForward: boolean = true;

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    describe('moving into an unpopulated list', () => {
      it('should move into the first position of the list', () => {
        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          moveRelativeTo: null,
          destination: preset.foreign,
          // pretending it is empty
          insideDestination: [],
          previousImpact: getHomeImpact(preset.inHome1, preset.home),
          viewport,
        });
        invariant(result);

        const expected: DragImpact = {
          movement: noMovement,
          direction: preset.foreign.axis.direction,
          destination: {
            droppableId: preset.foreign.descriptor.id,
            index: 0,
          },
          merge: null,
        };

        expect(result).toEqual(expected);
      });

      describe('do not move if first position is not visible', () => {
        const distanceToContentBoxStart = (box: BoxModel): number =>
          box.margin[axis.start] +
          box.border[axis.start] +
          box.padding[axis.start];

        // calculating this as getPageBorderBoxCenter will recompute the insideDestination
        const withoutForeignDraggables: DraggableDimensionMap = toDraggableMap(
          preset.inHomeList,
        );

        it('should not move into the start of list if the position is not visible due to droppable scroll', () => {
          const whatNewCenterWouldBeWithoutScroll: Position = goIntoStart({
            axis,
            moveInto: preset.foreign.page,
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
          invariant(preset.foreign.subject.active);
          const maxAllowableScroll: Position = negate(
            subtract(
              patch(axis.line, preset.foreign.subject.active[axis.start]),
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
              draggables: withoutForeignDraggables,
              moveRelativeTo: null,
              destination: preset.foreign,
              insideDestination: [],
              previousImpact: getHomeImpact(preset.inHome1, preset.home),
              viewport,
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
              draggables: withoutForeignDraggables,
              moveRelativeTo: null,
              destination: scrolled,
              insideDestination: [],
              previousImpact: getHomeImpact(preset.inHome1, preset.home),
              viewport,
            });
            expect(result).toBeTruthy();
          }
          // center past visible edge = cannot move
          {
            const scrollable: DroppableDimension = makeScrollable(
              preset.foreign,
              pastMaxAllowableScroll[axis.line],
            );
            const scrolled: DroppableDimension = scrollDroppable(
              scrollable,
              pastMaxAllowableScroll,
            );
            const result: ?DragImpact = moveToNewDroppable({
              previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
              draggable: preset.inHome1,
              draggables: withoutForeignDraggables,
              moveRelativeTo: null,
              destination: scrolled,
              // pretending it is empty
              insideDestination: [],
              previousImpact: getHomeImpact(preset.inHome1, preset.home),
              viewport,
            });

            expect(result).toBe(null);
          }
        });

        it('should not move into the start of list if the position is not visible due to page scroll', () => {
          const foreignPageBox: BoxModel = preset.foreign.page;
          const distanceToStartOfDroppableContentBox: number = distanceToContentBoxStart(
            foreignPageBox,
          );
          const inHome1PageBox: BoxModel = preset.inHome1.page;
          const distanceToCenterOfDragging: number =
            distanceToContentBoxStart(inHome1PageBox) +
            inHome1PageBox.contentBox[axis.size] / 2;

          const distanceToStartOfViewport: number =
            foreignPageBox.marginBox[axis.start];
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
          // center on visible edge = can move
          {
            const scrolled: Viewport = scrollViewport(viewport, onVisibleEdge);

            const result: ?DragImpact = moveToNewDroppable({
              previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
              draggable: preset.inHome1,
              draggables: preset.draggables,
              moveRelativeTo: null,
              destination: preset.foreign,
              // pretending it is empty
              insideDestination: [],
              previousImpact: noImpact,
              viewport: scrolled,
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
              draggables: withoutForeignDraggables,
              moveRelativeTo: null,
              destination: preset.foreign,
              // pretending it is empty
              insideDestination: [],
              previousImpact: noImpact,
              viewport: scrolled,
            });

            expect(result).toBe(null);
          }
        });
      });
    });

    describe('is going before a target', () => {
      it('should move the target and everything below it forward', () => {
        // moving home1 into the second position of the list
        // always displace forward in foreign list
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome1.displaceBy,
          willDisplaceForward,
        );

        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          // moving before target
          moveRelativeTo: preset.inForeign2,
          destination: preset.foreign,
          insideDestination: preset.inForeignList,
          previousImpact: noImpact,
          viewport,
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
            willDisplaceForward,
          },
          direction: preset.foreign.axis.direction,
          destination: {
            droppableId: preset.foreign.descriptor.id,
            // index of preset.foreign2
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
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome3.displaceBy,
          willDisplaceForward,
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
          previousImpact: noImpact,
          viewport,
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
            willDisplaceForward,
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
        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: preset.inHome1.page.borderBox.center,
          draggable: preset.inHome4,
          draggables: preset.draggables,
          moveRelativeTo: preset.inForeign1,
          destination: preset.foreign,
          insideDestination: [preset.inForeign1],
          previousImpact: noImpact,
          viewport,
        });
        invariant(result);

        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          preset.inHome4.displaceBy,
          willDisplaceForward,
        );
        const expected: DragImpact = {
          movement: {
            displaced: [],
            map: {},
            displacedBy,
            willDisplaceForward,
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

    describe('visibility and displacement', () => {
      it('should indicate when displacement is not visible when not inside droppable frame', () => {
        const customHome: DroppableDimension = getDroppableDimension({
          descriptor: {
            id: 'preset.home',
            type: 'TYPE',
          },
          direction: axis.direction,
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            [axis.end]: 100,
          },
        });
        const customInHome: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'in-preset.home',
            droppableId: customHome.descriptor.id,
            type: customHome.descriptor.type,
            index: 0,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            [axis.end]: 80,
          },
        });
        const customForeign: DroppableDimension = getDroppableDimension({
          descriptor: {
            id: 'preset.foreign-with-frame',
            type: 'TYPE',
          },
          direction: axis.direction,
          borderBox: {
            top: 0,
            left: 0,
            right: 100,
            // will be cut by frame
            bottom: 200,
          },
          closest: {
            borderBox: {
              top: 0,
              left: 0,
              right: 100,
              bottom: 100,
            },
            scrollSize: {
              scrollWidth: 200,
              scrollHeight: 200,
            },
            scroll: { x: 0, y: 0 },
            shouldClipSubject: true,
          },
        });

        const customInForeign: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'preset.foreign-outside-frame',
            droppableId: customForeign.descriptor.id,
            type: customForeign.descriptor.type,
            index: 0,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            // outside of the preset.foreign frame
            [axis.start]: 110,
            [axis.end]: 120,
          },
        });

        // moving outside back into list with closest being 'outside'
        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          customInHome.displaceBy,
          willDisplaceForward,
        );
        const displaced: Displacement[] = [
          {
            draggableId: customInForeign.descriptor.id,
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
            droppableId: customForeign.descriptor.id,
            index: customInForeign.descriptor.index,
          },
          merge: null,
        };

        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: dontCare,
          draggable: customInHome,
          draggables: toDraggableMap([customInForeign, customInHome]),
          moveRelativeTo: customInForeign,
          destination: customForeign,
          insideDestination: [customInForeign],
          previousImpact: noImpact,
          viewport,
        });
        invariant(result);

        expect(result).toEqual(expected);
      });

      it('should indicate when displacement is not visible when not inside the viewport', () => {
        const customHome: DroppableDimension = getDroppableDimension({
          descriptor: {
            id: 'preset.home',
            type: 'TYPE',
          },
          direction: axis.direction,
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            [axis.end]: 100,
          },
        });
        const customInHome: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'in-preset.home',
            droppableId: customHome.descriptor.id,
            type: customHome.descriptor.type,
            index: 0,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            [axis.end]: 80,
          },
        });
        const customForeign: DroppableDimension = getDroppableDimension({
          descriptor: {
            id: 'preset.foreign',
            type: 'TYPE',
          },
          direction: axis.direction,
          borderBox: {
            bottom: viewport.frame.bottom + 100,
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            [axis.start]: 0,
            // extending beyond the viewport
            [axis.end]: viewport.frame[axis.end] + 100,
          },
        });
        const customInForeign: DraggableDimension = getDraggableDimension({
          descriptor: {
            id: 'preset.foreign',
            droppableId: customForeign.descriptor.id,
            type: customForeign.descriptor.type,
            index: 0,
          },
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
            // outside of the viewport but inside the droppable
            [axis.start]: viewport.frame[axis.end] + 1,
            [axis.end]: viewport.frame[axis.end] + 10,
          },
        });

        const displacedBy: DisplacedBy = getDisplacedBy(
          axis,
          customInHome.displaceBy,
          willDisplaceForward,
        );
        const displaced: Displacement[] = [
          {
            draggableId: customInForeign.descriptor.id,
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
            droppableId: customForeign.descriptor.id,
            index: customInForeign.descriptor.index,
          },
          merge: null,
        };

        const result: ?DragImpact = moveToNewDroppable({
          previousPageBorderBoxCenter: dontCare,
          draggable: customInHome,
          draggables: toDraggableMap([customInForeign, customInHome]),
          moveRelativeTo: customInForeign,
          destination: customForeign,
          insideDestination: [customInForeign],
          previousImpact: noImpact,
          viewport,
        });
        invariant(result);

        expect(result).toEqual(expected);
      });
    });
  });
});
