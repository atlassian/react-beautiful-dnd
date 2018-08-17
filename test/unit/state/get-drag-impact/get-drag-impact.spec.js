// @flow
import { type Position } from 'css-box-model';
import getDragImpact from '../../../../src/state/get-drag-impact';
import noImpact from '../../../../src/state/no-impact';
import { add, patch, subtract } from '../../../../src/state/position';
import { vertical, horizontal } from '../../../../src/state/axis';
import { scrollDroppable } from '../../../../src/state/droppable-dimension';
import {
  getPreset,
  disableDroppable,
  makeScrollable,
  getDroppableDimension,
  getDraggableDimension,
} from '../../../utils/dimension';
import getViewport from '../../../../src/view/window/get-viewport';
import type {
  Axis,
  DraggableDimension,
  DroppableDimension,
  DroppableDimensionMap,
  DragImpact,
  DraggableDimensionMap,
  Viewport,
} from '../../../../src/types';

const viewport: Viewport = getViewport();

describe('get drag impact', () => {
  [vertical, horizontal].forEach((axis: Axis) => {
    describe(`on ${axis.direction} axis`, () => {
      const {
        home,
        inHome1,
        inHome2,
        inHome3,
        inHome4,
        foreign,
        inForeign1,
        inForeign2,
        inForeign3,
        inForeign4,
        emptyForeign,
        droppables,
        draggables,
      } = getPreset(axis);

      it('should return no impact when not dragging over anything', () => {
        // dragging up above the list
        const farAway: Position = {
          x: 1000,
          y: 1000,
        };

        const impact: DragImpact = getDragImpact({
          pageBorderBoxCenter: farAway,
          draggable: inHome1,
          draggables,
          droppables,
          previousImpact: noImpact,
          viewport,
        });

        expect(impact).toEqual(noImpact);
      });

      describe('moving over home list', () => {
        it('should return no impact when home is disabled', () => {
          const disabled: DroppableDimension = disableDroppable(home);
          const withDisabled: DroppableDimensionMap = {
            ...droppables,
            [disabled.descriptor.id]: disabled,
          };
          // choosing the center of inHome2 which should have an impact
          const pageBorderBoxCenter: Position = inHome2.page.borderBox.center;

          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter,
            draggable: inHome1,
            draggables,
            droppables: withDisabled,
            previousImpact: noImpact,
            viewport,
          });

          expect(impact).toEqual(noImpact);
        });

        // moving inHome1 no where
        describe('moving over original position', () => {
          it('should return no impact', () => {
            const pageBorderBoxCenter: Position = inHome1.page.borderBox.center;
            const expected: DragImpact = {
              movement: {
                displaced: [],
                amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: home.descriptor.id,
                index: 0,
              },
            };

            const impact: DragImpact = getDragImpact({
              pageBorderBoxCenter,
              draggable: inHome1,
              draggables,
              droppables,
              previousImpact: noImpact,
              viewport,
            });

            expect(impact).toEqual(expected);
          });
        });

        // moving inHome1 forward towards but not past inHome2
        describe('have not moved enough to impact others', () => {
          it('should return no impact', () => {
            const pageBorderBoxCenter: Position = patch(
              axis.line,
              // up to the line but not over it
              inHome2.page.borderBox[axis.start],
              // no movement on cross axis
              inHome1.page.borderBox.center[axis.crossAxisLine],
            );
            const expected: DragImpact = {
              movement: {
                amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
                displaced: [],
                isBeyondStartPosition: true,
              },
              direction: axis.direction,
              destination: {
                droppableId: home.descriptor.id,
                index: 0,
              },
            };

            const impact: DragImpact = getDragImpact({
              pageBorderBoxCenter,
              draggable: inHome1,
              draggables,
              droppables,
              previousImpact: noImpact,
              viewport,
            });

            expect(impact).toEqual(expected);
          });
        });

        // moving inHome2 forwards past inHome4
        describe('moving beyond start position', () => {
          const pageBorderBoxCenter: Position = patch(
            axis.line,
            inHome4.page.borderBox[axis.start] + 1,
            // no change
            inHome2.page.borderBox.center[axis.crossAxisLine],
          );
          const expected: DragImpact = {
            movement: {
              amount: patch(axis.line, inHome2.page.marginBox[axis.size]),
              // ordered by closest to current location
              displaced: [
                {
                  draggableId: inHome4.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
                {
                  draggableId: inHome3.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
              ],
              isBeyondStartPosition: true,
            },
            direction: axis.direction,
            destination: {
              droppableId: home.descriptor.id,
              // is now after inHome4
              index: 3,
            },
          };

          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter,
            draggable: inHome2,
            draggables,
            droppables,
            previousImpact: noImpact,
            viewport,
          });

          expect(impact).toEqual(expected);
        });

        // moving inHome3 back past inHome1
        describe('moving back past start position', () => {
          it('should move into the correct position', () => {
            const pageBorderBoxCenter: Position = patch(
              axis.line,
              inHome1.page.borderBox[axis.end] - 1,
              // no change
              inHome3.page.borderBox.center[axis.crossAxisLine],
            );

            const expected: DragImpact = {
              movement: {
                amount: patch(axis.line, inHome3.page.marginBox[axis.size]),
                // ordered by closest to current location
                displaced: [
                  {
                    draggableId: inHome1.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: inHome2.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                ],
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: home.descriptor.id,
                // is now before inHome1
                index: 0,
              },
            };

            const impact: DragImpact = getDragImpact({
              pageBorderBoxCenter,
              draggable: inHome3,
              draggables,
              droppables,
              previousImpact: noImpact,
              viewport,
            });

            expect(impact).toEqual(expected);
          });
        });

        describe('home droppable scroll has changed during a drag', () => {
          const scrollableHome: DroppableDimension = makeScrollable(home);
          const withScrollableHome = {
            ...droppables,
            [home.descriptor.id]: scrollableHome,
          };

          // moving inHome1 past inHome2 by scrolling the dimension
          describe('moving beyond start position with own scroll', () => {
            it('should move past other draggables', () => {
              // the middle of the target edge
              const startOfInHome2: Position = patch(
                axis.line,
                inHome2.page.borderBox[axis.start],
                inHome2.page.borderBox.center[axis.crossAxisLine],
              );
              const distanceNeeded: Position = add(
                subtract(startOfInHome2, inHome1.page.borderBox.center),
                // need to move over the edge
                patch(axis.line, 1),
              );
              const scrolledHome: DroppableDimension = scrollDroppable(
                scrollableHome,
                distanceNeeded,
              );
              const updatedDroppables: DroppableDimensionMap = {
                ...withScrollableHome,
                [home.descriptor.id]: scrolledHome,
              };
              // no changes in current page center from original
              const pageBorderBoxCenter: Position =
                inHome1.page.borderBox.center;
              const expected: DragImpact = {
                movement: {
                  amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
                  // ordered by closest to current location
                  displaced: [
                    {
                      draggableId: inHome2.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                  ],
                  isBeyondStartPosition: true,
                },
                direction: axis.direction,
                destination: {
                  droppableId: home.descriptor.id,
                  // is now after inHome2
                  index: 1,
                },
              };

              const impact: DragImpact = getDragImpact({
                pageBorderBoxCenter,
                draggable: inHome1,
                draggables,
                droppables: updatedDroppables,
                previousImpact: noImpact,
                viewport,
              });

              expect(impact).toEqual(expected);
            });
          });

          // moving inHome4 back past inHome2
          describe('moving back past start position with own scroll', () => {
            it('should move back past inHome2', () => {
              // the middle of the target edge
              const endOfInHome2: Position = patch(
                axis.line,
                inHome2.page.borderBox[axis.end],
                inHome2.page.borderBox.center[axis.crossAxisLine],
              );
              const distanceNeeded: Position = add(
                subtract(endOfInHome2, inHome4.page.borderBox.center),
                // need to move over the edge
                patch(axis.line, -1),
              );
              const scrolledHome: DroppableDimension = scrollDroppable(
                scrollableHome,
                distanceNeeded,
              );
              const updatedDroppables: DroppableDimensionMap = {
                ...withScrollableHome,
                [home.descriptor.id]: scrolledHome,
              };
              // no changes in current page center from original
              const pageBorderBoxCenter: Position =
                inHome4.page.borderBox.center;
              const expected: DragImpact = {
                movement: {
                  amount: patch(axis.line, inHome4.page.marginBox[axis.size]),
                  // ordered by closest to current location
                  displaced: [
                    {
                      draggableId: inHome2.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                    {
                      draggableId: inHome3.descriptor.id,
                      isVisible: true,
                      shouldAnimate: true,
                    },
                  ],
                  isBeyondStartPosition: false,
                },
                direction: axis.direction,
                destination: {
                  droppableId: home.descriptor.id,
                  // is now before inHome2
                  index: 1,
                },
              };

              const impact: DragImpact = getDragImpact({
                pageBorderBoxCenter,
                draggable: inHome4,
                draggables,
                droppables: updatedDroppables,
                previousImpact: noImpact,
                viewport,
              });

              expect(impact).toEqual(expected);
            });
          });
        });

        describe('displacement of invisible items', () => {
          it('should indicate when a displacement is not visible due to being outside of the droppable frame', () => {
            const droppable: DroppableDimension = getDroppableDimension({
              descriptor: {
                id: 'my-custom-droppable',
                type: 'TYPE',
              },
              direction: axis.direction,
              borderBox: {
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                [axis.start]: 0,
                // will be cut by the frame
                [axis.end]: 200,
              },
              closest: {
                borderBox: {
                  [axis.crossAxisStart]: 0,
                  [axis.crossAxisEnd]: 100,
                  [axis.start]: 0,
                  // will cut the subject,
                  [axis.end]: 100,
                },
                scrollSize: {
                  scrollWidth: 100,
                  scrollHeight: 100,
                },
                scroll: { x: 0, y: 0 },
                shouldClipSubject: true,
              },
            });
            const visible: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'visible',
                droppableId: droppable.descriptor.id,
                type: droppable.descriptor.type,
                index: 0,
              },
              borderBox: {
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                [axis.start]: 0,
                [axis.end]: 100,
              },
            });
            const notVisible1: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'not-visible-1',
                droppableId: droppable.descriptor.id,
                type: droppable.descriptor.type,
                index: 1,
              },
              borderBox: {
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                // inside the frame, but not in the visible area
                [axis.start]: 110,
                [axis.end]: 120,
              },
            });
            const notVisible2: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'not-visible-2',
                droppableId: droppable.descriptor.id,
                type: droppable.descriptor.type,
                index: 2,
              },
              borderBox: {
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                // inside the frame, but not in the visible area
                [axis.start]: 130,
                [axis.end]: 140,
              },
            });
            const customDraggables: DraggableDimensionMap = {
              [visible.descriptor.id]: visible,
              [notVisible1.descriptor.id]: notVisible1,
              [notVisible2.descriptor.id]: notVisible2,
            };
            const customDroppables: DroppableDimensionMap = {
              [droppable.descriptor.id]: droppable,
            };
            const expected: DragImpact = {
              movement: {
                // ordered by closest to current position
                displaced: [
                  {
                    draggableId: visible.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: notVisible1.descriptor.id,
                    // showing that the displacement in non-visual
                    isVisible: false,
                    shouldAnimate: false,
                  },
                ],
                amount: patch(axis.line, notVisible2.page.marginBox[axis.size]),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              // moved into the first position
              destination: {
                droppableId: droppable.descriptor.id,
                index: 0,
              },
            };

            const impact: DragImpact = getDragImpact({
              // moving backwards to near the start of the droppable
              pageBorderBoxCenter: { x: 1, y: 1 },
              // dragging the notVisible2 draggable backwards
              draggable: notVisible2,
              draggables: customDraggables,
              droppables: customDroppables,
              previousImpact: noImpact,
              viewport,
            });

            expect(impact).toEqual(expected);
          });

          it('should indicate when a displacement is not visible due to being outside of the viewport', () => {
            const droppable: DroppableDimension = getDroppableDimension({
              descriptor: {
                id: 'my-custom-droppable',
                type: 'TYPE',
              },
              direction: axis.direction,
              borderBox: {
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                [axis.start]: 0,
                [axis.end]: viewport.frame[axis.end] + 100,
              },
            });
            const visible: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'visible',
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
            const notVisible1: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'not-visible-1',
                droppableId: droppable.descriptor.id,
                type: droppable.descriptor.type,
                index: 1,
              },
              borderBox: {
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                // inside the droppable, but not in the visible area
                [axis.start]: viewport.frame[axis.end] + 10,
                [axis.end]: viewport.frame[axis.end] + 20,
              },
            });
            const notVisible2: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'not-visible-2',
                droppableId: droppable.descriptor.id,
                type: droppable.descriptor.type,
                index: 2,
              },
              borderBox: {
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                // inside the droppable, but not in the visible area
                [axis.start]: viewport.frame[axis.end] + 30,
                [axis.end]: viewport.frame[axis.end] + 40,
              },
            });
            const customDraggables: DraggableDimensionMap = {
              [visible.descriptor.id]: visible,
              [notVisible1.descriptor.id]: notVisible1,
              [notVisible2.descriptor.id]: notVisible2,
            };
            const customDroppables: DroppableDimensionMap = {
              [droppable.descriptor.id]: droppable,
            };
            const expected: DragImpact = {
              movement: {
                // ordered by closest to current position
                displaced: [
                  {
                    draggableId: visible.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: notVisible1.descriptor.id,
                    // showing that the displacement in non-visual
                    isVisible: false,
                    shouldAnimate: false,
                  },
                ],
                amount: patch(axis.line, notVisible2.page.marginBox[axis.size]),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              // moved into the first position
              destination: {
                droppableId: droppable.descriptor.id,
                index: 0,
              },
            };

            const impact: DragImpact = getDragImpact({
              // moving backwards to near the start of the droppable
              pageBorderBoxCenter: { x: 1, y: 1 },
              // dragging the notVisible2 draggable backwards
              draggable: notVisible2,
              draggables: customDraggables,
              droppables: customDroppables,
              previousImpact: noImpact,
              viewport,
            });

            expect(impact).toEqual(expected);
          });
        });
      });

      describe('moving over foreign list', () => {
        it('should return no impact when list is disabled', () => {
          const disabled: DroppableDimension = disableDroppable(foreign);
          const withDisabled: DroppableDimensionMap = {
            ...droppables,
            [foreign.descriptor.id]: disabled,
          };
          // choosing the center of inForeign1 which should have an impact
          const pageBorderBoxCenter: Position =
            inForeign1.page.borderBox.center;

          const impact: DragImpact = getDragImpact({
            pageBorderBoxCenter,
            draggable: inHome1,
            draggables,
            droppables: withDisabled,
            previousImpact: noImpact,
            viewport,
          });

          expect(impact).toEqual(noImpact);
        });

        // moving inHome1 above inForeign1
        describe('moving into the start of a populated droppable', () => {
          it('should move everything in the foreign list forward', () => {
            const pageBorderBoxCenter: Position = patch(
              axis.line,
              // just before the end of the dimension which is the cut off
              inForeign1.page.borderBox[axis.end] - 1,
              inForeign1.page.borderBox.center[axis.crossAxisLine],
            );
            const expected: DragImpact = {
              movement: {
                amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
                // ordered by closest to current location
                displaced: [
                  {
                    draggableId: inForeign1.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
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
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                // now in a different droppable
                droppableId: foreign.descriptor.id,
                // is now before inForeign1
                index: 0,
              },
            };

            const impact: DragImpact = getDragImpact({
              pageBorderBoxCenter,
              draggable: inHome1,
              draggables,
              droppables,
              previousImpact: noImpact,
              viewport,
            });

            expect(impact).toEqual(expected);
          });
        });

        // moving inHome1 just after the start of inForeign2
        describe('moving into the middle of a populated droppable', () => {
          it('should move everything after inHome2 forward', () => {
            const pageBorderBoxCenter: Position = patch(
              axis.line,
              inForeign2.page.borderBox[axis.end] - 1,
              inForeign2.page.borderBox.center[axis.crossAxisLine],
            );
            const expected: DragImpact = {
              movement: {
                amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
                // ordered by closest to current location
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
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                // now in a different droppable
                droppableId: foreign.descriptor.id,
                // is now after inForeign1
                index: 1,
              },
            };

            const impact: DragImpact = getDragImpact({
              pageBorderBoxCenter,
              draggable: inHome1,
              draggables,
              droppables,
              previousImpact: noImpact,
              viewport,
            });

            expect(impact).toEqual(expected);
          });
        });

        // moving inHome1 after inForeign4
        describe('moving into the end of a populated dropppable', () => {
          it('should not displace anything', () => {
            const pageBorderBoxCenter: Position = patch(
              axis.line,
              inForeign4.page.borderBox[axis.end],
              inForeign4.page.borderBox.center[axis.crossAxisLine],
            );
            const expected: DragImpact = {
              movement: {
                amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
                // nothing is moved - moving to the end of the list
                displaced: [],
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                // now in a different droppable
                droppableId: foreign.descriptor.id,
                // is now after inForeign1
                index: 4,
              },
            };

            const impact: DragImpact = getDragImpact({
              pageBorderBoxCenter,
              draggable: inHome1,
              draggables,
              droppables,
              previousImpact: noImpact,
              viewport,
            });

            expect(impact).toEqual(expected);
          });
        });

        describe('moving to an empty droppable', () => {
          it('should not displace anything an move into the first position', () => {
            // over the center of the empty droppable
            const pageBorderBoxCenter: Position =
              emptyForeign.page.borderBox.center;
            const expected: DragImpact = {
              movement: {
                amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
                displaced: [],
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                // now in a different droppable
                droppableId: emptyForeign.descriptor.id,
                // first item in the empty list
                index: 0,
              },
            };

            const impact: DragImpact = getDragImpact({
              pageBorderBoxCenter,
              draggable: inHome1,
              draggables,
              droppables,
              previousImpact: noImpact,
              viewport,
            });

            expect(impact).toEqual(expected);
          });
        });

        describe('home droppable is updated during a drag', () => {
          const pageBorderBoxCenter: Position = patch(
            axis.line,
            inForeign2.page.borderBox[axis.end] - 1,
            inForeign2.page.borderBox.center[axis.crossAxisLine],
          );

          it('should have no impact impact the destination (actual)', () => {
            // will go over the threshold of inForeign2 so that it will not be displaced forward
            const scroll: Position = patch(axis.line, 1000);
            const scrollableHome: DroppableDimension = makeScrollable(
              home,
              1000,
            );
            const map: DroppableDimensionMap = {
              ...droppables,
              [home.descriptor.id]: scrollDroppable(scrollableHome, scroll),
            };

            const expected: DragImpact = {
              movement: {
                amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
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
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: foreign.descriptor.id,
                index: 1,
              },
            };

            const impact: DragImpact = getDragImpact({
              pageBorderBoxCenter,
              draggable: inHome1,
              draggables,
              droppables: map,
              previousImpact: noImpact,
              viewport,
            });

            expect(impact).toEqual(expected);
          });
          it('should impact the destination (control)', () => {
            const expected: DragImpact = {
              movement: {
                amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
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
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: foreign.descriptor.id,
                index: 1,
              },
            };

            const impact: DragImpact = getDragImpact({
              pageBorderBoxCenter,
              draggable: inHome1,
              draggables,
              droppables,
              previousImpact: noImpact,
              viewport,
            });

            expect(impact).toEqual(expected);
          });
        });

        describe('destination droppable scroll is updated during a drag', () => {
          const scrollableForeign: DroppableDimension = makeScrollable(foreign);
          const withScrollableForeign = {
            ...droppables,
            [foreign.descriptor.id]: scrollableForeign,
          };

          const pageBorderBoxCenter: Position = patch(
            axis.line,
            inForeign2.page.borderBox[axis.end] - 1,
            inForeign2.page.borderBox.center[axis.crossAxisLine],
          );

          it('should impact the destination (actual)', () => {
            // will go over the threshold of inForeign2 so that it will not
            // be displaced forward
            const scroll: Position = patch(axis.line, 1);
            const map: DroppableDimensionMap = {
              ...withScrollableForeign,
              [foreign.descriptor.id]: scrollDroppable(
                scrollableForeign,
                scroll,
              ),
            };

            const expected: DragImpact = {
              movement: {
                amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
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
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: foreign.descriptor.id,
                index: 2,
              },
            };

            const impact: DragImpact = getDragImpact({
              pageBorderBoxCenter,
              draggable: inHome1,
              draggables,
              droppables: map,
              previousImpact: noImpact,
              viewport,
            });

            expect(impact).toEqual(expected);
          });

          it('should impact the destination (control)', () => {
            const expected: DragImpact = {
              movement: {
                amount: patch(axis.line, inHome1.page.marginBox[axis.size]),
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
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              destination: {
                droppableId: foreign.descriptor.id,
                index: 1,
              },
            };

            const impact: DragImpact = getDragImpact({
              pageBorderBoxCenter,
              draggable: inHome1,
              draggables,
              droppables,
              previousImpact: noImpact,
              viewport,
            });

            expect(impact).toEqual(expected);
          });
        });

        describe('displacement of invisible items', () => {
          it('should indicate when a displacement is not visible due to being outside of the droppable frame', () => {
            const source: DroppableDimension = getDroppableDimension({
              descriptor: {
                id: 'source',
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
            const inSource1: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'inSource1',
                droppableId: source.descriptor.id,
                type: source.descriptor.type,
                index: 0,
              },
              borderBox: {
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                [axis.start]: 0,
                [axis.end]: 100,
              },
            });

            const foreignCrossAxisStart: number = 120;
            const foreignCrossAxisEnd: number = 200;

            const destination: DroppableDimension = getDroppableDimension({
              descriptor: {
                id: 'destination',
                type: 'TYPE',
              },
              direction: axis.direction,
              borderBox: {
                [axis.crossAxisStart]: foreignCrossAxisStart,
                [axis.crossAxisEnd]: foreignCrossAxisEnd,
                [axis.start]: 0,
                // will be cut off by the frame
                [axis.end]: 200,
              },
              closest: {
                borderBox: {
                  [axis.crossAxisStart]: foreignCrossAxisStart,
                  [axis.crossAxisEnd]: foreignCrossAxisEnd,
                  [axis.start]: 0,
                  // will cut off the subject
                  [axis.end]: 100,
                },
                scrollSize: {
                  scrollWidth: 100,
                  scrollHeight: 100,
                },
                scroll: { x: 0, y: 0 },
                shouldClipSubject: true,
              },
            });
            const visible: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'visible',
                droppableId: destination.descriptor.id,
                type: destination.descriptor.type,
                index: 0,
              },
              borderBox: {
                [axis.crossAxisStart]: foreignCrossAxisStart,
                [axis.crossAxisEnd]: foreignCrossAxisEnd,
                [axis.start]: 0,
                [axis.end]: viewport.frame[axis.end],
              },
            });
            const notVisible: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'not-visible-1',
                droppableId: destination.descriptor.id,
                type: destination.descriptor.type,
                index: 1,
              },
              borderBox: {
                [axis.crossAxisStart]: foreignCrossAxisStart,
                [axis.crossAxisEnd]: foreignCrossAxisEnd,
                // inside the droppable, but not in the visible area
                [axis.start]: 110,
                [axis.end]: 120,
              },
            });
            const customDraggables: DraggableDimensionMap = {
              [inSource1.descriptor.id]: inSource1,
              [visible.descriptor.id]: visible,
              [notVisible.descriptor.id]: notVisible,
            };
            const customDroppables: DroppableDimensionMap = {
              [source.descriptor.id]: source,
              [destination.descriptor.id]: destination,
            };
            const expected: DragImpact = {
              movement: {
                // ordered by closest to current position
                displaced: [
                  {
                    draggableId: visible.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: notVisible.descriptor.id,
                    // showing that the displacement in non-visual
                    isVisible: false,
                    shouldAnimate: false,
                  },
                ],
                amount: patch(axis.line, inSource1.page.marginBox[axis.size]),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              // moved into the first position
              destination: {
                droppableId: destination.descriptor.id,
                index: 0,
              },
            };
            const impact: DragImpact = getDragImpact({
              // moving into the top corner of the destination to move everything forward
              pageBorderBoxCenter: patch(
                axis.line,
                destination.page.borderBox[axis.start],
                destination.page.borderBox[axis.crossAxisStart],
              ),
              // dragging inSource1 over destination
              draggable: inSource1,
              draggables: customDraggables,
              droppables: customDroppables,
              previousImpact: noImpact,
              viewport,
            });

            expect(impact).toEqual(expected);
          });

          it('should indicate when a displacement is not visible due to being outside of the viewport', () => {
            const source: DroppableDimension = getDroppableDimension({
              descriptor: {
                id: 'source',
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
            const inSource1: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'inSource1',
                droppableId: source.descriptor.id,
                type: source.descriptor.type,
                index: 0,
              },
              borderBox: {
                [axis.crossAxisStart]: 0,
                [axis.crossAxisEnd]: 100,
                [axis.start]: 0,
                [axis.end]: 100,
              },
            });
            const foreignCrossAxisStart: number = 120;
            const foreignCrossAxisEnd: number = 200;
            const destination: DroppableDimension = getDroppableDimension({
              descriptor: {
                id: 'destination',
                type: 'TYPE',
              },
              direction: axis.direction,
              borderBox: {
                [axis.crossAxisStart]: foreignCrossAxisStart,
                [axis.crossAxisEnd]: foreignCrossAxisEnd,
                [axis.start]: 0,
                // stretches longer than viewport
                [axis.end]: viewport.frame[axis.end] + 100,
              },
            });
            const visible: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'visible',
                droppableId: destination.descriptor.id,
                type: destination.descriptor.type,
                index: 0,
              },
              borderBox: {
                [axis.crossAxisStart]: foreignCrossAxisStart,
                [axis.crossAxisEnd]: foreignCrossAxisEnd,
                [axis.start]: 0,
                [axis.end]: viewport.frame[axis.end],
              },
            });
            const notVisible: DraggableDimension = getDraggableDimension({
              descriptor: {
                id: 'not-visible-1',
                droppableId: destination.descriptor.id,
                type: destination.descriptor.type,
                index: 1,
              },
              borderBox: {
                [axis.crossAxisStart]: foreignCrossAxisStart,
                [axis.crossAxisEnd]: foreignCrossAxisEnd,
                // inside the droppable, but not in the visible area
                [axis.start]: viewport.frame[axis.end] + 10,
                [axis.end]: viewport.frame[axis.end] + 20,
              },
            });

            const customDraggables: DraggableDimensionMap = {
              [inSource1.descriptor.id]: inSource1,
              [visible.descriptor.id]: visible,
              [notVisible.descriptor.id]: notVisible,
            };
            const customDroppables: DroppableDimensionMap = {
              [source.descriptor.id]: source,
              [destination.descriptor.id]: destination,
            };
            const expected: DragImpact = {
              movement: {
                // ordered by closest to current position
                displaced: [
                  {
                    draggableId: visible.descriptor.id,
                    isVisible: true,
                    shouldAnimate: true,
                  },
                  {
                    draggableId: notVisible.descriptor.id,
                    // showing that the displacement in non-visual
                    isVisible: false,
                    shouldAnimate: false,
                  },
                ],
                amount: patch(axis.line, inSource1.page.marginBox[axis.size]),
                isBeyondStartPosition: false,
              },
              direction: axis.direction,
              // moved into the first position
              destination: {
                droppableId: destination.descriptor.id,
                index: 0,
              },
            };

            const impact: DragImpact = getDragImpact({
              // moving into the top corner of the destination to move everything forward
              pageBorderBoxCenter: patch(
                axis.line,
                destination.page.borderBox[axis.start],
                destination.page.borderBox[axis.crossAxisStart],
              ),
              // dragging inSource1 over destination
              draggable: inSource1,
              draggables: customDraggables,
              droppables: customDroppables,
              previousImpact: noImpact,
              viewport,
            });

            expect(impact).toEqual(expected);
          });
        });
      });
    });
  });
});
