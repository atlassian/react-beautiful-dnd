// @flow
import { offset, type Position, type BoxModel } from 'css-box-model';
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
import type { Result } from '../../../../../../src/state/move-in-direction/move-cross-axis/move-cross-axis-types';
import scrollDroppable from '../../../../../../src/state/droppable/scroll-droppable';
import {
  goBefore,
  goAfter,
  goIntoStart,
} from '../../../../../../src/state/move-relative-to';
import { add, negate, patch } from '../../../../../../src/state/position';
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

const dontCare: Position = { x: 0, y: 0 };

[vertical /* , horizontal */].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);
    const viewport: Viewport = preset.viewport;

    describe('moving into an unpopulated list', () => {
      describe('without droppable scroll', () => {
        const result: ?Result = moveToNewDroppable({
          pageBorderBoxCenter: preset.inHome1.page.borderBox.center,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          moveRelativeTo: null,
          destination: preset.foreign,
          // pretending it is empty
          insideDestination: [],
          previousImpact: noImpact,
          viewport,
        });

        if (!result) {
          throw new Error('invalid test setup');
        }

        it('should move into the start of a destination', () => {
          const expected: Position = goIntoStart({
            axis,
            moveInto: preset.foreign.page,
            isMoving: preset.inHome1.page,
          });

          expect(result.pageBorderBoxCenter).toEqual(expected);
        });

        it('should return an empty impact', () => {
          const expected: DragImpact = {
            movement: noMovement,
            direction: preset.foreign.axis.direction,
            destination: {
              droppableId: preset.foreign.descriptor.id,
              index: 0,
            },
            merge: null,
          };

          expect(result.impact).toEqual(expected);
        });
      });

      describe('with droppable scroll', () => {
        const scrollable: DroppableDimension = makeScrollable(
          preset.foreign,
          10,
        );
        const scroll: Position = patch(axis.line, 10);
        const displacement: Position = negate(scroll);
        const scrolled: DroppableDimension = scrollDroppable(
          scrollable,
          scroll,
        );

        const result: ?Result = moveToNewDroppable({
          pageBorderBoxCenter: preset.inHome1.page.borderBox.center,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          moveRelativeTo: null,
          destination: scrolled,
          // pretenting it is empty
          insideDestination: [],
          previousImpact: noImpact,
          viewport,
        });

        if (!result) {
          throw new Error('Invalid result');
        }

        it('should account for changes in droppable scroll', () => {
          const inStart: Position = goIntoStart({
            axis,
            moveInto: preset.foreign.page,
            isMoving: preset.inHome1.page,
          });
          const withScroll: Position = add(inStart, displacement);

          expect(result.pageBorderBoxCenter).toEqual(withScroll);
        });
      });

      describe('visibility', () => {
        const distanceToContentBoxStart = (box: BoxModel): number =>
          box.margin[axis.start] +
          box.border[axis.start] +
          box.padding[axis.start];

        const foreignPageBox: BoxModel = preset.foreign.page;
        const distanceToStartOfDroppableContent: number = distanceToContentBoxStart(
          foreignPageBox,
        );
        const inHome1PageBox: BoxModel = preset.inHome1.page;
        const distanceToCenterOfDragging: number =
          distanceToContentBoxStart(inHome1PageBox) +
          inHome1PageBox.contentBox[axis.size] / 2;

        it('should not move into the start of list if the position is not visible due to droppable scroll', () => {
          const onVisibleEdge: Position = patch(
            axis.line,
            distanceToStartOfDroppableContent + distanceToCenterOfDragging,
          );
          const pastVisibleEdge: Position = add(
            onVisibleEdge,
            patch(axis.line, 1),
          );
          // center on visible edge = can move
          {
            const scrollable: DroppableDimension = makeScrollable(
              preset.foreign,
              onVisibleEdge[axis.line],
            );
            const scrolled: DroppableDimension = scrollDroppable(
              scrollable,
              onVisibleEdge,
            );
            const result: ?Result = moveToNewDroppable({
              pageBorderBoxCenter: preset.inHome1.page.borderBox.center,
              draggable: preset.inHome1,
              draggables: preset.draggables,
              moveRelativeTo: null,
              destination: scrolled,
              // pretending it is empty
              insideDestination: [],
              previousImpact: noImpact,
              viewport,
            });

            expect(result).toBeTruthy();
          }
          // center past visible edge = cannot move
          {
            const scrollable: DroppableDimension = makeScrollable(
              preset.foreign,
              pastVisibleEdge[axis.line],
            );
            const scrolled: DroppableDimension = scrollDroppable(
              scrollable,
              pastVisibleEdge,
            );
            const result: ?Result = moveToNewDroppable({
              pageBorderBoxCenter: preset.inHome1.page.borderBox.center,
              draggable: preset.inHome1,
              draggables: preset.draggables,
              moveRelativeTo: null,
              destination: scrolled,
              // pretending it is empty
              insideDestination: [],
              previousImpact: noImpact,
              viewport,
            });

            expect(result).toBe(null);
          }
        });

        it('should not move into the start of list if the position is not visible due to page scroll', () => {
          const distanceToStartOfViewport: number =
            foreignPageBox.marginBox.top;
          const onVisibleEdge: Position = patch(
            axis.line,
            distanceToStartOfViewport +
              distanceToStartOfDroppableContent +
              distanceToCenterOfDragging,
          );
          const pastVisibleEdge: Position = add(
            onVisibleEdge,
            patch(axis.line, 1),
          );
          // center on visible edge = can move
          {
            const scrolled: Viewport = scrollViewport(viewport, onVisibleEdge);

            const result: ?Result = moveToNewDroppable({
              pageBorderBoxCenter: preset.inHome1.page.borderBox.center,
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

            const result: ?Result = moveToNewDroppable({
              pageBorderBoxCenter: preset.inHome1.page.borderBox.center,
              draggable: preset.inHome1,
              draggables: preset.draggables,
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

    describe('is moving before the target', () => {
      // moving home1 into the second position of the list
      // always displace forward in foreign list
      const willDisplaceForward: boolean = true;
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        preset.inHome1.displaceBy,
        willDisplaceForward,
      );
      describe('without droppable scroll', () => {
        const result: ?Result = moveToNewDroppable({
          pageBorderBoxCenter: preset.inHome1.page.borderBox.center,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          // moving before target
          moveRelativeTo: preset.inForeign2,
          destination: preset.foreign,
          insideDestination: preset.inForeignList,
          previousImpact: noImpact,
          viewport,
        });

        if (!result) {
          throw new Error('invalid test setup');
        }

        it('should move before the displaced target', () => {
          const displaced: BoxModel = offset(
            preset.inForeign2.page,
            displacedBy.point,
          );

          const expected: Position = goBefore({
            axis,
            moveRelativeTo: displaced,
            isMoving: preset.inHome1.page,
          });

          expect(result.pageBorderBoxCenter).toEqual(expected);
        });

        it('should move the target and everything below it forward', () => {
          // ordered by closest impacted
          const displaced: Displacement[] = [
            {
              draggableId: preset.inForeign2.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inForeign3.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: preset.inForeign4.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
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
              index: 1,
            },
            merge: null,
          };

          expect(result.impact).toEqual(expected);
        });
      });

      describe('with droppable scroll', () => {
        const scrollable: DroppableDimension = makeScrollable(
          preset.foreign,
          10,
        );
        const scroll: Position = patch(axis.line, 10);
        const scrollDisplacement: Position = negate(scroll);
        const scrolled: DroppableDimension = scrollDroppable(
          scrollable,
          patch(axis.line, 10),
        );

        const result: ?Result = moveToNewDroppable({
          pageBorderBoxCenter: preset.inHome1.page.borderBox.center,
          draggable: preset.inHome1,
          draggables: preset.draggables,
          moveRelativeTo: preset.inForeign2,
          destination: scrolled,
          insideDestination: preset.inForeignList,
          previousImpact: noImpact,
          viewport,
        });

        if (!result) {
          throw new Error('Invalid result');
        }

        it('should move before the displaced target and account for changes in droppable scroll', () => {
          const displaced: BoxModel = offset(
            preset.inForeign2.page,
            displacedBy.point,
          );
          const before: Position = goBefore({
            axis,
            moveRelativeTo: displaced,
            isMoving: preset.inHome1.page,
          });
          const withScroll: Position = add(before, scrollDisplacement);

          expect(result.pageBorderBoxCenter).toEqual(withScroll);
        });
      });
    });

    describe('is moving after the target', () => {
      describe('without droppable scroll', () => {
        // moving home4 into the second position of the preset.foreign list
        const result: Result = moveToNewDroppable({
          pageBorderBoxCenter: preset.inHome4.page.borderBox.center,
          draggable: preset.inHome4,
          moveRelativeTo: preset.inForeign2,
          destination: preset.foreign,
          insideDestination: draggables,
          previousImpact: noImpact,
          viewport,
        });

        if (!result) {
          throw new Error('invalid test setup');
        }

        it('should move after the target', () => {
          const expected = moveToEdge({
            source: preset.inHome4.page.borderBox,
            sourceEdge: 'start',
            destination: preset.inForeign2.page.marginBox,
            // going after
            destinationEdge: 'end',
            destinationAxis: preset.foreign.axis,
          });

          expect(result.pageBorderBoxCenter).toEqual(expected);
        });

        it('should move everything after the proposed index forward', () => {
          const expected: DragImpact = {
            movement: {
              // ordered by closest impacted
              displaced: [
                {
                  draggableId: inForeign3.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
                {
                  draggableId: inForeign4.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
              ],
              amount: patch(
                preset.foreign.axis.line,
                preset.inHome4.page.marginBox[preset.foreign.axis.size],
              ),
              isInFrontOfStart: false,
            },
            direction: preset.foreign.axis.direction,
            destination: {
              droppableId: preset.foreign.descriptor.id,
              // going after target, so index is target index + 1
              index: 2,
            },
          };

          expect(result.impact).toEqual(expected);
        });
      });

      describe('with droppable scroll', () => {
        const scrollable: DroppableDimension = makeScrollable(
          preset.foreign,
          10,
        );
        const scroll: Position = patch(axis.line, 10);
        const displacement: Position = negate(scroll);
        const scrolled: DroppableDimension = scrollDroppable(
          scrollable,
          patch(axis.line, 10),
        );

        const result: Result = moveToNewDroppable({
          pageBorderBoxCenter: preset.inHome4.page.borderBox.center,
          draggable: preset.inHome4,
          moveRelativeTo: preset.inForeign2,
          destination: scrolled,
          insideDestination: draggables,
          previousImpact: noImpact,
          viewport,
        });

        if (!result) {
          throw new Error('Invalid result');
        }

        it('should account for changes in droppable scroll', () => {
          const withoutScroll: Position = moveToEdge({
            source: preset.inHome4.page.borderBox,
            sourceEdge: 'start',
            destination: preset.inForeign2.page.marginBox,
            // going after
            destinationEdge: 'end',
            destinationAxis: preset.foreign.axis,
          });
          const expected: Position = add(withoutScroll, displacement);

          expect(result.pageBorderBoxCenter).toEqual(expected);
        });
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

        const customInsideForeign: DraggableDimension[] = [customInForeign];
        // moving outside back into list with closest being 'outside'
        const expected: DragImpact = {
          movement: {
            displaced: [
              {
                draggableId: customInForeign.descriptor.id,
                isVisible: false,
                shouldAnimate: false,
              },
            ],
            amount: patch(axis.line, customInHome.page.marginBox[axis.size]),
            // always false in preset.foreign list
            isInFrontOfStart: false,
          },
          direction: axis.direction,
          // moving into the outside position
          destination: {
            droppableId: customForeign.descriptor.id,
            index: customInForeign.descriptor.index,
          },
        };

        const result: Result = moveToNewDroppable({
          pageBorderBoxCenter: dontCare,
          draggable: customInHome,
          moveRelativeTo: customInForeign,
          destination: customForeign,
          insideDestination: customInsideForeign,
          previousImpact: noImpact,
          viewport,
        });

        if (!result || !result.impact) {
          throw new Error('invalid result');
        }

        expect(result.impact).toEqual(expected);
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
            // exteding beyond the viewport
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

        const customInsideForeign: DraggableDimension[] = [customInForeign];
        // moving outside back into list with closest being 'outside'
        const expected: DragImpact = {
          movement: {
            displaced: [
              {
                draggableId: customInForeign.descriptor.id,
                isVisible: false,
                shouldAnimate: false,
              },
            ],
            amount: patch(axis.line, customInHome.page.marginBox[axis.size]),
            // always false in preset.foreign list
            isInFrontOfStart: false,
          },
          direction: axis.direction,
          // moving into the outside position
          destination: {
            droppableId: customForeign.descriptor.id,
            index: customInForeign.descriptor.index,
          },
        };

        const result: Result = moveToNewDroppable({
          pageBorderBoxCenter: dontCare,
          draggable: customInHome,
          moveRelativeTo: customInForeign,
          destination: customForeign,
          insideDestination: customInsideForeign,
          previousImpact: noImpact,
          viewport,
        });

        if (!result || !result.impact) {
          throw new Error('invalid result');
        }

        expect(result.impact).toEqual(expected);
      });
    });
  });
});
