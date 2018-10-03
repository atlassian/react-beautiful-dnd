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
} from '../../../../../src/types';
import moveToNewDroppable from '../../../../../src/state/move-in-direction/move-cross-axis/move-to-new-droppable';
import type { Result } from '../../../../../src/state/move-in-direction/move-cross-axis/move-cross-axis-types';
import scrollDroppable from '../../../../../src/state/droppable/scroll-droppable';
import { goBefore, goAfter } from '../../../../../src/state/move-relative-to';
import { add, negate, patch } from '../../../../../src/state/position';
import { horizontal, vertical } from '../../../../../src/state/axis';
import {
  getPreset,
  makeScrollable,
  getDraggableDimension,
  getDroppableDimension,
} from '../../../../utils/dimension';
import noImpact, { noMovement } from '../../../../../src/state/no-impact';
import getDisplacedBy from '../../../../../src/state/get-displaced-by';
import getDisplacementMap from '../../../../../src/state/get-displacement-map';
import { toDraggableMap } from '../../../../../src/state/dimension-structures';

const dontCare: Position = { x: 0, y: 0 };

describe('move to new droppable', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  [vertical, horizontal].forEach((axis: Axis) => {
    describe(`on ${axis.direction} axis`, () => {
      const preset = getPreset(axis);
      const viewport: Viewport = preset.viewport;

      describe('to preset.home list', () => {
        it('should not to anything if there is not target (can happen if invisibile)', () => {
          expect(
            moveToNewDroppable({
              pageBorderBoxCenter: dontCare,
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

        it('should throw if moving relative to something that is not inside the droppable', () => {
          expect(() =>
            moveToNewDroppable({
              pageBorderBoxCenter: dontCare,
              draggable: preset.inHome1,
              draggables: preset.draggables,
              // moving relative to item that is not in the destination
              moveRelativeTo: preset.inForeign1,
              destination: preset.home,
              insideDestination: preset.inHomeList,
              previousImpact: noImpact,
              viewport,
            }),
          ).toThrow();
        });

        describe('moving back into original index', () => {
          describe('without droppable scroll', () => {
            // the second draggable is moving back into its preset.home
            const result: ?Result = moveToNewDroppable({
              pageBorderBoxCenter: dontCare,
              draggable: preset.inHome2,
              draggables: preset.draggables,
              moveRelativeTo: preset.inHome2,
              destination: preset.home,
              insideDestination: preset.inHomeList,
              previousImpact: noImpact,
              viewport,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should return the original center without margin', () => {
              expect(result.pageBorderBoxCenter).toBe(
                preset.inHome2.page.borderBox.center,
              );
            });

            it('should return an empty impact with the original location', () => {
              const expected: DragImpact = {
                movement: noMovement,
                direction: axis.direction,
                destination: {
                  droppableId: preset.home.descriptor.id,
                  index: 1,
                },
                merge: null,
              };

              expect(result.impact).toEqual(expected);
            });
          });

          describe('with droppable scroll', () => {
            const scrollable: DroppableDimension = makeScrollable(
              preset.home,
              10,
            );
            const scroll: Position = patch(axis.line, 10);
            const displacement: Position = negate(scroll);
            const scrolled: DroppableDimension = scrollDroppable(
              scrollable,
              patch(axis.line, 10),
            );

            const result: ?Result = moveToNewDroppable({
              pageBorderBoxCenter: dontCare,
              draggable: preset.inHome2,
              draggables: preset.draggables,
              moveRelativeTo: preset.inHome2,
              destination: scrolled,
              insideDestination: preset.inHomeList,
              previousImpact: noImpact,
              viewport,
            });

            if (!result) {
              throw new Error('Invalid result');
            }

            it('should account for changes in droppable scroll', () => {
              const expected: Position = add(
                preset.inHome2.page.borderBox.center,
                displacement,
              );

              expect(result.pageBorderBoxCenter).toEqual(expected);
            });

            it('should return an empty impact with the original location', () => {
              const expected: DragImpact = {
                movement: noMovement,
                direction: axis.direction,
                destination: {
                  droppableId: preset.home.descriptor.id,
                  index: 1,
                },
                merge: null,
              };

              expect(result.impact).toEqual(expected);
            });
          });
        });

        describe('moving before the original index', () => {
          // moving preset.inHome4 into the preset.inHome2 position
          const willDisplaceForward: boolean = true;
          const displacedBy: DisplacedBy = getDisplacedBy(
            axis,
            preset.inHome4.displaceBy,
            willDisplaceForward,
          );

          describe('without droppable scroll', () => {
            const result: ?Result = moveToNewDroppable({
              pageBorderBoxCenter: dontCare,
              draggable: preset.inHome4,
              draggables: preset.draggables,
              moveRelativeTo: preset.inHome2,
              destination: preset.home,
              insideDestination: preset.inHomeList,
              previousImpact: noImpact,
              viewport,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should go before the displaced target', () => {
              const displaced: BoxModel = offset(
                preset.inHome2.page,
                displacedBy.point,
              );

              const expected: Position = goBefore({
                axis,
                moveRelativeTo: displaced,
                isMoving: preset.inHome4.page,
              });
              expect(result.pageBorderBoxCenter).toEqual(expected);
            });

            it('should move the everything from the target index to the original index forward', () => {
              const displaced: Displacement[] = [
                {
                  draggableId: preset.inHome2.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
                {
                  draggableId: preset.inHome3.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
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
                  // original index of target
                  index: 1,
                },
                merge: null,
              };

              expect(result.impact).toEqual(expected);
            });
          });

          describe('with droppable scroll', () => {
            const scrollable: DroppableDimension = makeScrollable(
              preset.home,
              10,
            );
            const scroll: Position = patch(axis.line, 10);
            const displacement: Position = negate(scroll);
            const scrolled: DroppableDimension = scrollDroppable(
              scrollable,
              patch(axis.line, 10),
            );

            const result: ?Result = moveToNewDroppable({
              pageBorderBoxCenter: dontCare,
              draggable: preset.inHome4,
              draggables: preset.draggables,
              moveRelativeTo: preset.inHome2,
              destination: scrolled,
              insideDestination: preset.inHomeList,
              previousImpact: noImpact,
              viewport,
            });

            if (!result) {
              throw new Error('Invalid result');
            }

            it('should should move before the displaced target and account for changes in droppable scroll', () => {
              const displaced: BoxModel = offset(
                preset.inHome2.page,
                displacedBy.point,
              );
              const before: Position = goBefore({
                axis,
                moveRelativeTo: displaced,
                isMoving: preset.inHome4.page,
              });
              const withScroll: Position = add(before, displacement);

              expect(result.pageBorderBoxCenter).toEqual(withScroll);
            });
          });
        });

        describe('moving after the original index', () => {
          // moving inHome1 into the preset.inHome4 position
          // displace backwards when in front of home
          const willDisplaceForward: boolean = false;
          const displacedBy: DisplacedBy = getDisplacedBy(
            axis,
            preset.inHome1.displaceBy,
            willDisplaceForward,
          );
          describe('without droppable scroll', () => {
            const result: ?Result = moveToNewDroppable({
              pageBorderBoxCenter: dontCare,
              draggable: preset.inHome1,
              draggables: preset.draggables,
              moveRelativeTo: preset.inHome4,
              destination: preset.home,
              insideDestination: preset.inHomeList,
              previousImpact: noImpact,
              viewport,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should move after the displaced target', () => {
              const displaced: BoxModel = offset(
                preset.inHome4.page,
                displacedBy.point,
              );

              const expected: Position = goAfter({
                axis,
                moveRelativeTo: displaced,
                isMoving: preset.inHome1.page,
              });
              expect(result.pageBorderBoxCenter).toEqual(expected);
            });

            it('should move the everything from the target index to the original index forward', () => {
              // ordered by closest impacted
              const displaced: Displacement[] = [
                {
                  draggableId: preset.inHome4.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
                {
                  draggableId: preset.inHome3.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
                {
                  draggableId: preset.inHome2.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
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
                  // original index of target
                  index: 3,
                },
                merge: null,
              };

              expect(result.impact).toEqual(expected);
            });
          });

          describe('with droppable scroll', () => {
            const scrollable: DroppableDimension = makeScrollable(
              preset.home,
              10,
            );
            const scroll: Position = patch(axis.line, 10);
            const displacement: Position = negate(scroll);
            const scrolled: DroppableDimension = scrollDroppable(
              scrollable,
              patch(axis.line, 10),
            );

            const result: ?Result = moveToNewDroppable({
              pageBorderBoxCenter: dontCare,
              draggable: preset.inHome1,
              draggables: preset.draggables,
              moveRelativeTo: preset.inHome4,
              destination: scrolled,
              insideDestination: preset.inHomeList,
              previousImpact: noImpact,
              viewport,
            });

            if (!result) {
              throw new Error('Invalid result');
            }

            it('should account for changes in droppable scroll', () => {
              const displaced: BoxModel = offset(
                preset.inHome4.page,
                displacedBy.point,
              );
              const after: Position = goAfter({
                axis,
                moveRelativeTo: displaced,
                isMoving: preset.inHome1.page,
              });
              const withScroll: Position = add(after, displacement);

              expect(result.pageBorderBoxCenter).toEqual(withScroll);
            });
          });
        });

        describe.only('visibility and displacement', () => {
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
            const displaced: Displacement[] = [
              {
                draggableId: outside.descriptor.id,
                isVisible: false,
                shouldAnimate: false,
              },
            ];
            // displace backwards when moving forward past start
            const willDisplaceForward: boolean = false;
            const displacedBy: DisplacedBy = getDisplacedBy(
              axis,
              inside.displaceBy,
              willDisplaceForward,
            );
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

            const result: ?Result = moveToNewDroppable({
              pageBorderBoxCenter: dontCare,
              draggable: inside,
              draggables: toDraggableMap(customDraggables),
              moveRelativeTo: outside,
              destination: droppable,
              insideDestination: customDraggables,
              previousImpact: noImpact,
              viewport,
            });

            if (!result || !result.impact) {
              throw new Error('invalid result');
            }

            expect(result.impact).toEqual(expected);
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

            const result: ?Result = moveToNewDroppable({
              pageBorderBoxCenter: dontCare,
              draggable: inside,
              draggables: toDraggableMap(customDraggables),
              moveRelativeTo: outside,
              destination: droppable,
              insideDestination: customDraggables,
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

      describe('to foreign list', () => {
        const draggables: DraggableDimension[] = [
          inForeign1,
          inForeign2,
          inForeign3,
          inForeign4,
        ];

        it('should throw when moving relative to something not in the destination', () => {
          const execute = () =>
            moveToNewDroppable({
              pageBorderBoxCenter: inHome1.page.borderBox.center,
              draggable: inHome1,
              moveRelativeTo: preset.inHome2,
              destination: foreign,
              insideDestination: draggables,
              previousImpact: noImpact,
              viewport,
            });

          expect(execute).toThrow();
        });

        describe('moving into an unpopulated list', () => {
          describe('without droppable scroll', () => {
            const result: Result = moveToNewDroppable({
              pageBorderBoxCenter: inHome1.page.borderBox.center,
              draggable: inHome1,
              moveRelativeTo: null,
              destination: foreign,
              insideDestination: [],
              previousImpact: noImpact,
              viewport,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should move to the start edge of the droppable (including its padding)', () => {
              const expected: Position = moveToEdge({
                source: inHome1.page.borderBox,
                sourceEdge: 'start',
                destination: foreign.page.contentBox,
                destinationEdge: 'start',
                destinationAxis: foreign.axis,
              });

              expect(result.pageBorderBoxCenter).toEqual(expected);
            });

            it('should return an empty impact', () => {
              const expected: DragImpact = {
                movement: {
                  displaced: [],
                  amount: patch(
                    foreign.axis.line,
                    inHome1.page.marginBox[foreign.axis.size],
                  ),
                  isInFrontOfStart: false,
                },
                direction: foreign.axis.direction,
                destination: {
                  droppableId: foreign.descriptor.id,
                  index: 0,
                },
              };

              expect(result.impact).toEqual(expected);
            });
          });

          describe('with droppable scroll', () => {
            const scrollable: DroppableDimension = makeScrollable(foreign, 10);
            const scroll: Position = patch(axis.line, 10);
            const displacement: Position = negate(scroll);
            const scrolled: DroppableDimension = scrollDroppable(
              scrollable,
              patch(axis.line, 10),
            );

            const result: Result = moveToNewDroppable({
              pageBorderBoxCenter: inHome1.page.borderBox.center,
              draggable: inHome1,
              moveRelativeTo: null,
              destination: scrolled,
              insideDestination: [],
              previousImpact: noImpact,
              viewport,
            });

            if (!result) {
              throw new Error('Invalid result');
            }

            it('should account for changes in droppable scroll', () => {
              const withoutScroll: Position = moveToEdge({
                source: inHome1.page.borderBox,
                sourceEdge: 'start',
                destination: foreign.page.contentBox,
                destinationEdge: 'start',
                destinationAxis: foreign.axis,
              });
              const expected: Position = add(withoutScroll, displacement);

              expect(result.pageBorderBoxCenter).toEqual(expected);
            });
          });
        });

        describe('is moving before the target', () => {
          describe('without droppable scroll', () => {
            // moving home1 into the second position of the list
            const result: Result = moveToNewDroppable({
              pageBorderBoxCenter: inHome1.page.borderBox.center,
              draggable: inHome1,
              moveRelativeTo: inForeign2,
              destination: foreign,
              insideDestination: draggables,
              previousImpact: noImpact,
              viewport,
            });

            if (!result) {
              throw new Error('invalid test setup');
            }

            it('should move before the target', () => {
              const expected: Position = moveToEdge({
                source: inHome1.page.borderBox,
                sourceEdge: 'start',
                destination: inForeign2.page.marginBox,
                destinationEdge: 'start',
                destinationAxis: foreign.axis,
              });

              expect(result.pageBorderBoxCenter).toEqual(expected);
            });

            it('should move the target and everything below it forward', () => {
              const expected: DragImpact = {
                movement: {
                  // ordered by closest impacted
                  displaced: [
                    {
                      draggableId: inForeign2.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
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
                    foreign.axis.line,
                    inHome1.page.marginBox[foreign.axis.size],
                  ),
                  isInFrontOfStart: false,
                },
                direction: foreign.axis.direction,
                destination: {
                  droppableId: foreign.descriptor.id,
                  // index of foreign2
                  index: 1,
                },
              };

              expect(result.impact).toEqual(expected);
            });
          });

          describe('with droppable scroll', () => {
            const scrollable: DroppableDimension = makeScrollable(foreign, 10);
            const scroll: Position = patch(axis.line, 10);
            const displacement: Position = negate(scroll);
            const scrolled: DroppableDimension = scrollDroppable(
              scrollable,
              patch(axis.line, 10),
            );

            const result: Result = moveToNewDroppable({
              pageBorderBoxCenter: inHome1.page.borderBox.center,
              draggable: inHome1,
              moveRelativeTo: inForeign2,
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
                source: inHome1.page.borderBox,
                sourceEdge: 'start',
                destination: inForeign2.page.marginBox,
                destinationEdge: 'start',
                destinationAxis: foreign.axis,
              });
              const expected: Position = add(withoutScroll, displacement);

              expect(result.pageBorderBoxCenter).toEqual(expected);
            });
          });
        });

        describe('is moving after the target', () => {
          describe('without droppable scroll', () => {
            // moving home4 into the second position of the foreign list
            const result: Result = moveToNewDroppable({
              pageBorderBoxCenter: preset.inHome4.page.borderBox.center,
              draggable: preset.inHome4,
              moveRelativeTo: inForeign2,
              destination: foreign,
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
                destination: inForeign2.page.marginBox,
                // going after
                destinationEdge: 'end',
                destinationAxis: foreign.axis,
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
                    foreign.axis.line,
                    preset.inHome4.page.marginBox[foreign.axis.size],
                  ),
                  isInFrontOfStart: false,
                },
                direction: foreign.axis.direction,
                destination: {
                  droppableId: foreign.descriptor.id,
                  // going after target, so index is target index + 1
                  index: 2,
                },
              };

              expect(result.impact).toEqual(expected);
            });
          });

          describe('with droppable scroll', () => {
            const scrollable: DroppableDimension = makeScrollable(foreign, 10);
            const scroll: Position = patch(axis.line, 10);
            const displacement: Position = negate(scroll);
            const scrolled: DroppableDimension = scrollDroppable(
              scrollable,
              patch(axis.line, 10),
            );

            const result: Result = moveToNewDroppable({
              pageBorderBoxCenter: preset.inHome4.page.borderBox.center,
              draggable: preset.inHome4,
              moveRelativeTo: inForeign2,
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
                destination: inForeign2.page.marginBox,
                // going after
                destinationEdge: 'end',
                destinationAxis: foreign.axis,
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
                id: 'foreign-with-frame',
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
                id: 'foreign-outside-frame',
                droppableId: customForeign.descriptor.id,
                type: customForeign.descriptor.type,
                index: 0,
              },
              borderBox: {
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                // outside of the foreign frame
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
                amount: patch(
                  axis.line,
                  customInHome.page.marginBox[axis.size],
                ),
                // always false in foreign list
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
                id: 'foreign',
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
                id: 'foreign',
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
                amount: patch(
                  axis.line,
                  customInHome.page.marginBox[axis.size],
                ),
                // always false in foreign list
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
  });
});
