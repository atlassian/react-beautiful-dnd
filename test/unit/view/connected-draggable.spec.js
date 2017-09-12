// @flow
/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import { mount } from 'enzyme';
import Draggable, { makeSelector } from '../../../src/view/draggable/connected-draggable';
import { getDraggableDimension } from '../../../src/state/dimension';
import noImpact from '../../../src/state/no-impact';
import { combine, withStore, withDroppableId } from '../../utils/get-context-options';
import getClientRect from '../../../src/state/get-client-rect';
import { add } from '../../../src/state/position';
import type {
  CurrentDrag,
  Phase,
  DragState,
  DropResult,
  PendingDrop,
  DragImpact,
  DraggableId,
  DroppableId,
  TypeId,
  InitialDrag,
  Position,
  DraggableDimension,
  InitialDragLocation,
  CurrentDragLocation,
} from '../../../src/types';
import type { MapProps, Provided, Selector } from '../../../src/view/draggable/draggable-types';

const droppableId: DroppableId = 'drop-1';
const origin: Position = { x: 0, y: 0 };

type MakeArgs = {|
  type: TypeId
|}

const defaultMakeArgs = {
  type: 'TYPE',
};

const make = (() => {
  let callCount = 0;

  return (params?: MakeArgs = defaultMakeArgs) => {
    const type: TypeId = params.type;
    callCount++;
    const id: DraggableId = `drag-id-${callCount}`;
    const selector: Selector = makeSelector();
    const dimension: DraggableDimension = getDraggableDimension({
      id,
      droppableId,
      clientRect: getClientRect({
        top: 100 * callCount,
        left: 0,
        right: 100,
        bottom: (100 * callCount) + 20,
      }),
    });
    // using the center position as the selection point
    const initial: InitialDrag = (() => {
      const client: InitialDragLocation = {
        selection: dimension.page.withoutMargin.center,
        center: dimension.page.withoutMargin.center,
      };

      // not worrying about window scroll for now
      const page = client;

      const value: InitialDrag = {
        source: {
          index: 0,
          droppableId,
        },
        client,
        page,
        windowScroll: origin,
        withinDroppable: {
          center: page.center,
        },
      };
      return value;
    })();

    const drag = (offset: Position, impact?: DragImpact = noImpact): DragState => {
      const client: CurrentDragLocation = {
        selection: add(initial.client.selection, offset),
        center: add(initial.client.center, offset),
        offset,
      };
      // not worrying about scroll for now
      const page = client;

      const current: CurrentDrag = {
        id,
        type,
        client,
        page,
        windowScroll: origin,
        withinDroppable: {
          center: page.center,
        },
        shouldAnimate: true,
        isScrollAllowed: true,
      };

      const state: DragState = {
        current,
        impact,
        initial,
      };
      return state;
    };
    const drop = (
      newHomeOffset: Position,
      impact?: DragImpact = noImpact,
    ): PendingDrop => {
      const result: DropResult = {
        draggableId: id,
        type,
        source: initial.source,
        destination: {
          index: initial.source.index + 1,
          droppableId: initial.source.droppableId,
        },
      };

      const pending: PendingDrop = {
        trigger: 'DROP',
        newHomeOffset,
        result,
        impact,
      };
      return pending;
    };
    const cancel = (): PendingDrop => {
      const result: DropResult = {
        draggableId: id,
        type,
        source: initial.source,
        destination: null,
      };

      const pending: PendingDrop = {
        trigger: 'CANCEL',
        newHomeOffset: origin,
        impact: noImpact,
        result,
      };

      return pending;
    };

    return { id, type, selector, dimension, initial, drag, drop, cancel };
  };
})();

const defaultMapProps: MapProps = {
  isDragging: false,
  isDropAnimating: false,
  canLift: true,
  canAnimate: false,
  // at the origin by default
  offset: origin,
  dimension: null,
  direction: null,
};

type ExecuteArgs = {|
  id: DraggableId,
  phase: Phase,
  type: TypeId,
  drag: ?DragState,
  pending: ?PendingDrop,
  dimension: ?DraggableDimension,
|}

const execute = (selector: Selector) =>
  ({ phase, drag, pending, id, dimension, type }: ExecuteArgs): MapProps =>
    selector.resultFunc(
      id,
      type,
      phase,
      drag,
      pending,
      dimension,
    );

describe('Draggable - connected', () => {
  describe('selector', () => {
    beforeAll(() => {
      requestAnimationFrame.reset();
    });

    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
      console.error.mockRestore();
    });

    describe('dragging', () => {
      it('should log an error and return default props if there is invalid drag state', () => {
        const { id, type, selector, dimension } = make();

        const result = execute(selector)({
          phase: 'DRAGGING',
          type,
          // drag should be provided
          drag: null,
          pending: null,
          id,
          dimension,
        });

        expect(result).toEqual(defaultMapProps);
        expect(console.error).toHaveBeenCalledTimes(1);
      });

      describe('item is dragging', () => {
        it('should return the current position of the item', () => {
          const { id, type, dimension, selector, drag } = make();
          const offset: Position = {
            x: 100,
            y: 200,
          };
          const expected: MapProps = {
            isDragging: true,
            isDropAnimating: false,
            canLift: false,
            canAnimate: true,
            offset,
            dimension,
            direction: null,
          };

          const result: MapProps = execute(selector)({
            id,
            type,
            phase: 'DRAGGING',
            drag: drag(offset),
            pending: null,
            dimension,
          });

          expect(result).toEqual(expected);
        });

        it('should break memoization on every call', () => {
          const { selector, id, drag, dimension, type } = make();
          const state: DragState = drag({ x: 100, y: 200 });

          const first: MapProps = execute(selector)({
            id,
            type,
            phase: 'DRAGGING',
            drag: state,
            pending: null,
            dimension,
          });
          const second: MapProps = execute(selector)({
            id,
            type,
            phase: 'DRAGGING',
            drag: state,
            pending: null,
            dimension,
          });

          // checking we did not get the same reference back
          expect(first).not.toBe(second);
          // even though we got the same value
          expect(first).toEqual(second);
        });

        it('should return the direction of a vertical impact', () => {
          const dragging = make();
          const notDragging = make();
          const impact: DragImpact = {
            movement: {
              draggables: [notDragging.id],
              amount: {
                y: dragging.dimension.page.withMargin.height,
                x: 0,
              },
              isBeyondStartPosition: true,
            },
            direction: 'vertical',
            destination: {
              index: dragging.initial.source.index + 1,
              droppableId: dragging.initial.source.droppableId,
            },
          };
          const offset = { x: 0, y: 100 };
          const expected: MapProps = {
            isDragging: true,
            isDropAnimating: false,
            canLift: false,
            canAnimate: true,
            offset,
            dimension: dragging.dimension,
            // property under test
            direction: 'vertical',
          };

          const result: MapProps = execute(dragging.selector)({
            id: dragging.id,
            type: dragging.type,
            phase: 'DRAGGING',
            drag: dragging.drag(offset, impact),
            pending: null,
            dimension: dragging.dimension,
          });

          expect(result).toEqual(expected);
        });

        it('should return the direction of a horizontal impact', () => {
          const dragging = make();
          const notDragging = make();
          const impact: DragImpact = {
            movement: {
              draggables: [notDragging.id],
              amount: {
                y: 0,
                x: dragging.dimension.page.withMargin.width,
              },
              isBeyondStartPosition: true,
            },
            direction: 'horizontal',
            destination: {
              index: dragging.initial.source.index + 1,
              droppableId: dragging.initial.source.droppableId,
            },
          };
          const offset = { x: 100, y: 0 };
          const expected: MapProps = {
            isDragging: true,
            isDropAnimating: false,
            canLift: false,
            canAnimate: true,
            offset,
            dimension: dragging.dimension,
            // property under test
            direction: 'horizontal',
          };

          const result: MapProps = execute(dragging.selector)({
            id: dragging.id,
            type: dragging.type,
            phase: 'DRAGGING',
            drag: dragging.drag(offset, impact),
            pending: null,
            dimension: dragging.dimension,
          });

          expect(result).toEqual(expected);
        });
      });

      describe('item is not dragging and is of the same type', () => {
        const dragging = make();
        const notDragging = make();
        it('should disallow lifting', () => {
          const expected: MapProps = {
            // property under test
            canLift: false,
            // other properties
            isDragging: false,
            isDropAnimating: false,
            canAnimate: true,
            offset: origin,
            dimension: null,
            direction: null,
          };

          const result: MapProps = execute(notDragging.selector)({
            id: notDragging.id,
            type: notDragging.type,
            phase: 'DRAGGING',
            drag: dragging.drag({ x: 100, y: 200 }),
            pending: null,
            dimension: null,
          });

          expect(result).toEqual(expected);
        });

        describe('memoization', () => {
          describe('item needs to move', () => {
            const impact: DragImpact = {
              movement: {
                draggables: [notDragging.id],
                amount: {
                  x: 0,
                  y: dragging.dimension.page.withMargin.height,
                },
                isBeyondStartPosition: true,
              },
              direction: 'vertical',
              destination: {
                index: dragging.initial.source.index + 1,
                droppableId: dragging.initial.source.droppableId,
              },
            };
            const first: MapProps = execute(notDragging.selector)({
              id: notDragging.id,
              type: notDragging.type,
              phase: 'DRAGGING',
              drag: dragging.drag({ x: 100, y: 200 }, impact),
              pending: null,
              dimension: null,
            });
            const second: MapProps = execute(notDragging.selector)({
              id: notDragging.id,
              type: notDragging.type,
              phase: 'DRAGGING',
              drag: dragging.drag({ x: 100, y: 200 }, impact),
              pending: null,
              dimension: null,
            });

            it('should not break memoization if amount to move does not change', () => {
              // checking that we got the same object back
              expect(first).toBe(second);
            });

            it('should break memoization when movement no longer needing to move', () => {
              const third: MapProps = execute(notDragging.selector)({
                id: notDragging.id,
                type: notDragging.type,
                phase: 'DRAGGING',
                drag: dragging.drag({ x: 100, y: 200 }, noImpact),
                pending: null,
                dimension: null,
              });

              expect(third).not.toBe(second);
              expect(third).not.toEqual(second);
            });
          });

          describe('item does not need to move', () => {
            it('should not break memoization on multiple calls', () => {
              const first: MapProps = execute(notDragging.selector)({
                id: notDragging.id,
                type: notDragging.type,
                phase: 'DRAGGING',
                drag: dragging.drag({ x: 100, y: 200 }, noImpact),
                pending: null,
                dimension: null,
              });
              const second: MapProps = execute(notDragging.selector)({
                id: notDragging.id,
                type: notDragging.type,
                phase: 'DRAGGING',
                drag: dragging.drag({ x: 100, y: 200 }, noImpact),
                pending: null,
                dimension: null,
              });

              // checking that we got the same object back
              expect(first).toBe(second);
            });
          });
        });
      });

      describe('item is not dragging and is of a different type', () => {
        it('should return the default props', () => {
          const dragging = make({ type: 'PERSON' });
          const notDragging = make({ type: 'PERSON' });
          const notRelated = make({ type: 'LOCATION' });
          const impact: DragImpact = {
            movement: {
              draggables: [notDragging.id],
              amount: {
                x: 0,
                y: dragging.dimension.page.withMargin.height,
              },
              isBeyondStartPosition: true,
            },
            direction: 'vertical',
            destination: {
              index: dragging.initial.source.index + 1,
              droppableId: dragging.initial.source.droppableId,
            },
          };

          const result: MapProps = execute(notRelated.selector)({
            id: notRelated.id,
            type: notRelated.type,
            phase: 'DRAGGING',
            // this will impact notDragging but not notRelated
            drag: dragging.drag({ x: 100, y: 200 }, impact),
            pending: null,
            dimension: null,
          });

          expect(result).toEqual(defaultMapProps);
          // this is not an error scenario
          expect(console.error).not.toHaveBeenCalled();
        });

        it('should not break memoization between drag updates', () => {
          const dragging = make({ type: 'A' });
          const notDragging = make({ type: 'A' });
          const notRelated = make({ type: 'B' });
          // notDragging need to move, but not notRelated
          const firstImpact: DragImpact = {
            movement: {
              draggables: [notDragging.id],
              amount: {
                x: 0,
                y: dragging.dimension.page.withMargin.height,
              },
              isBeyondStartPosition: true,
            },
            direction: 'vertical',
            destination: {
              index: dragging.initial.source.index + 1,
              droppableId: dragging.initial.source.droppableId,
            },
          };
          // $ExpectError - using spread
          const secondImpact: DragImpact = { ...firstImpact };
          const thirdImpact = noImpact;

          const first: MapProps = execute(notRelated.selector)({
            id: notRelated.id,
            type: notRelated.type,
            phase: 'DRAGGING',
            drag: dragging.drag({ x: 0, y: 100 }, firstImpact),
            pending: null,
            dimension: null,
          });
          const second: MapProps = execute(notRelated.selector)({
            id: notRelated.id,
            type: notRelated.type,
            phase: 'DROP_ANIMATING',
            drag: dragging.drag({ x: 0, y: 100 }, secondImpact),
            pending: null,
            dimension: null,
          });
          const third: MapProps = execute(notRelated.selector)({
            id: notRelated.id,
            type: notRelated.type,
            phase: 'DROP_ANIMATING',
            drag: dragging.drag({ x: 0, y: 100 }, thirdImpact),
            pending: null,
            dimension: null,
          });

          // checking they have the right values
          expect(first).toEqual(defaultMapProps);
          expect(second).toEqual(defaultMapProps);
          expect(third).toEqual(defaultMapProps);
          // checking that memoization did not break
          expect(first).toBe(second);
          expect(second).toBe(third);
        });
      });
    });

    describe('dropped', () => {
      it('should log an error and return default props if there is no pending drop', () => {
        const { id, type, selector, dimension } = make();

        const props: MapProps = execute(selector)({
          id,
          type,
          phase: 'DROP_ANIMATING',
          drag: null,
          pending: null,
          dimension,
        });

        expect(props).toEqual(defaultMapProps);
        expect(console.error).toHaveBeenCalledTimes(1);
      });

      describe('item was dragging', () => {
        it('should move to the new home offset', () => {
          const { id, type, dimension, selector, drop } = make();
          const newHomeOffset: Position = {
            x: 100,
            y: 10,
          };
          const expected: MapProps = {
            isDragging: false,
            isDropAnimating: true,
            // cannot lift while dropping
            canLift: false,
            canAnimate: true,
            offset: newHomeOffset,
            dimension,
            // direction no longer needed as drag handle is unbound
            direction: null,
          };
          const pending: PendingDrop = drop(newHomeOffset);

          const props: MapProps = execute(selector)({
            id,
            type,
            phase: 'DROP_ANIMATING',
            drag: null,
            pending,
            dimension,
          });

          expect(props).toEqual(expected);
        });
      });

      describe('item was not dragging and is of the same type', () => {
        describe('item was not dragging and not moved', () => {
          const expected: MapProps = {
            isDragging: false,
            isDropAnimating: false,
          // can lift while the other item is dropping
            canLift: true,
          // has not moved so still at the origin
            offset: origin,
            dimension: null,
            direction: null,
          // is the same as the default props except for
          // animation being permitted
            canAnimate: true,
          };

          it('should remain in its original position', () => {
            const dragging = make();
            const notDragging = make();

            const props: MapProps = execute(notDragging.selector)({
              id: notDragging.id,
              type: notDragging.type,
              phase: 'DROP_ANIMATING',
              drag: null,
              pending: dragging.drop({ x: 100, y: 200 }),
              dimension: null,
            });

            expect(props).toEqual(expected);
          });

          it('should break memoization when switching from dragging to dropping', () => {
            const dragging = make();
            const notDragging = make();
            const duringDragMapProps: MapProps = {
              isDragging: false,
              isDropAnimating: false,
              canLift: false,
              canAnimate: true,
            // at the origin by default
              offset: origin,
              dimension: null,
              direction: null,
            };

            const duringDrag: MapProps = execute(notDragging.selector)({
              id: notDragging.id,
              type: notDragging.type,
              phase: 'DRAGGING',
              drag: dragging.drag({ x: 100, y: 200 }),
              pending: null,
              dimension: null,
            });
            const duringDrop: MapProps = execute(notDragging.selector)({
              id: notDragging.id,
              type: notDragging.type,
              phase: 'DROP_ANIMATING',
              drag: null,
              pending: dragging.drop({ x: 200, y: 200 }),
              dimension: null,
            });

          // checking value
            expect(duringDrag).toEqual(duringDragMapProps);
            expect(duringDrop).toEqual(expected);
          });
        });

        describe('item was not dragging but was moved out of the way', () => {
          const dragging = make();
          const notDragging = make();

          it('should move to the final offset', () => {
            const impact: DragImpact = {
              movement: {
                draggables: [notDragging.id],
                amount: {
                  x: 0,
                  y: dragging.dimension.page.withMargin.height,
                },
                isBeyondStartPosition: true,
              },
              direction: 'vertical',
              destination: {
                index: dragging.initial.source.index + 1,
                droppableId: dragging.initial.source.droppableId,
              },
            };
            const expected: MapProps = {
              isDropAnimating: false,
              isDragging: false,
            // can lift while other item is dropping
              canLift: true,
            // Because the item is moving forward, this will
            // be moving backwards to get out of the way.
              offset: {
                x: 0,
                y: -dragging.dimension.page.withMargin.height,
              },
            // allowing item to move out of the way
              canAnimate: true,
              dimension: null,
              direction: null,
            };

            const props: MapProps = execute(notDragging.selector)({
              id: notDragging.id,
              type: notDragging.type,
              phase: 'DROP_ANIMATING',
              drag: null,
              pending: dragging.drop({ x: 100, y: 100 }, impact),
              dimension: null,
            });

            expect(props).toEqual(expected);
          });
        });
      });

      describe('item was not dragging and is not of the same type', () => {
        it('should return the default props', () => {
          const dragging = make({ type: 'PERSON' });
          const notDragging = make({ type: 'PERSON' });
          const notRelated = make({ type: 'LOCATION' });
          const impact: DragImpact = {
            movement: {
              draggables: [notDragging.id],
              amount: {
                x: 0,
                y: dragging.dimension.page.withMargin.height,
              },
              isBeyondStartPosition: true,
            },
            direction: 'vertical',
            destination: {
              index: dragging.initial.source.index + 1,
              droppableId: dragging.initial.source.droppableId,
            },
          };

          const result: MapProps = execute(notRelated.selector)({
            id: notRelated.id,
            type: notRelated.type,
            phase: 'DROP_ANIMATING',
            drag: null,
            // this will impact notDragging but not notRelated
            pending: dragging.drop({ x: 100, y: 200 }, impact),
            dimension: null,
          });

          expect(result).toEqual(defaultMapProps);
          // this is not an error scenario
          expect(console.error).not.toHaveBeenCalled();
        });

        it('should not break memoization from the dragging phase', () => {
          const dragging = make({ type: 'A' });
          const notDragging = make({ type: 'A' });
          const notRelated = make({ type: 'B' });
          // notDragging need to move, but not notRelated
          const impact: DragImpact = {
            movement: {
              draggables: [notDragging.id],
              amount: {
                x: 0,
                y: dragging.dimension.page.withMargin.height,
              },
              isBeyondStartPosition: true,
            },
            direction: 'vertical',
            destination: {
              index: dragging.initial.source.index + 1,
              droppableId: dragging.initial.source.droppableId,
            },
          };

          const whileDragging: MapProps = execute(notRelated.selector)({
            id: notRelated.id,
            type: notRelated.type,
            phase: 'DRAGGING',
            drag: dragging.drag({ x: 0, y: 100 }, impact),
            pending: null,
            dimension: null,
          });
          const whileDropping: MapProps = execute(notRelated.selector)({
            id: notRelated.id,
            type: notRelated.type,
            phase: 'DROP_ANIMATING',
            drag: null,
            pending: dragging.drop({ x: 0, y: 101 }),
            dimension: null,
          });

          // checking they have the right values
          expect(whileDragging).toEqual(defaultMapProps);
          expect(whileDropping).toEqual(defaultMapProps);
          // checking that memoization did not break
          expect(whileDragging).toBe(whileDropping);
        });
      });
    });

    describe('cancelled', () => {
      it('should log an error and return default props if there is no pending drop', () => {
        const { id, type, selector, dimension } = make();

        const props: MapProps = execute(selector)({
          id,
          type,
          phase: 'DROP_ANIMATING',
          drag: null,
          pending: null,
          dimension,
        });

        expect(props).toEqual(defaultMapProps);
        expect(console.error).toHaveBeenCalledTimes(1);
      });

      describe('item was dragging', () => {
        it('should move back to the origin', () => {
          const { id, type, dimension, selector, cancel } = make();
          const expected: MapProps = {
            isDragging: false,
            isDropAnimating: true,
            // not allowing lifting while a cancel drop is occurring
            canLift: false,
            canAnimate: true,
            offset: origin,
            dimension,
            // not required when dropping
            direction: null,
          };
          const pending: PendingDrop = cancel();

          const props: MapProps = execute(selector)({
            id,
            type,
            phase: 'DROP_ANIMATING',
            drag: null,
            pending,
            dimension,
          });

          expect(props).toEqual(expected);
        });
      });

      describe('item not dragging and was of the same type', () => {
        describe('item was moved during the drag', () => {
          it('should move to the final offset', () => {
            const dragging = make();
            const notDragging = make();
            const expected: MapProps = {
              isDropAnimating: false,
              isDragging: false,
              // cannot lift during a cancel
              canLift: false,
              // needs to move back to where it started
              offset: origin,
              // allowing item to move out of the way
              canAnimate: true,
              dimension: null,
              direction: null,
            };

            const props: MapProps = execute(notDragging.selector)({
              id: notDragging.id,
              type: notDragging.type,
              phase: 'DROP_ANIMATING',
              drag: null,
              pending: dragging.cancel(),
              dimension: null,
            });

            expect(props).toEqual(expected);
          });
        });

        describe('item was not moved during the drag', () => {
          const expected: MapProps = {
            isDragging: false,
            isDropAnimating: false,
            canLift: false,
            // has not moved so still at the origin
            offset: origin,
            dimension: null,
            direction: null,
            // is the same as the default props except for
            // animation being permitted
            canAnimate: true,
          };

          it('should remain in its original position', () => {
            const dragging = make();
            const notDragging = make();

            const props: MapProps = execute(notDragging.selector)({
              id: notDragging.id,
              type: notDragging.type,
              phase: 'DROP_ANIMATING',
              drag: null,
              pending: dragging.cancel(),
              dimension: null,
            });

            expect(props).toEqual(expected);
          });

          it('should not break memoization when switching from dragging to dropping', () => {
            const dragging = make();
            const notDragging = make();
            const duringDragMapProps: MapProps = {
              isDragging: false,
              isDropAnimating: false,
              canLift: false,
              canAnimate: true,
              // at the origin by default
              offset: origin,
              dimension: null,
              direction: null,
            };

            const duringDrag: MapProps = execute(notDragging.selector)({
              id: notDragging.id,
              type: notDragging.type,
              phase: 'DRAGGING',
              drag: dragging.drag({ x: 100, y: 200 }),
              pending: null,
              dimension: null,
            });
            const duringDrop: MapProps = execute(notDragging.selector)({
              id: notDragging.id,
              type: notDragging.type,
              phase: 'DROP_ANIMATING',
              drag: null,
              pending: dragging.cancel(),
              dimension: null,
            });

            // checking value
            expect(duringDrag).toEqual(duringDragMapProps);
            // checking equality
            expect(duringDrag).toBe(duringDrop);
          });
        });
      });

      describe('item not dragging and was not of the same type', () => {
        it('should return the default map props', () => {
          const dragging = make({ type: 'A' });
          const notRelated = make({ type: 'B' });

          const result: MapProps = execute(notRelated.selector)({
            id: notRelated.id,
            type: notRelated.type,
            phase: 'DROP_ANIMATING',
            drag: null,
            pending: dragging.cancel(),
            dimension: null,
          });

          expect(result).toEqual(defaultMapProps);
        });

        it('should not break memoization from the dragging phase', () => {
          const dragging = make({ type: 'A' });
          const notDragging = make({ type: 'A' });
          const notRelated = make({ type: 'B' });
          // notDragging need to move, but not notRelated
          const impact: DragImpact = {
            movement: {
              draggables: [notDragging.id],
              amount: {
                x: 0,
                y: dragging.dimension.page.withMargin.height,
              },
              isBeyondStartPosition: true,
            },
            direction: 'vertical',
            destination: {
              index: dragging.initial.source.index + 1,
              droppableId: dragging.initial.source.droppableId,
            },
          };

          const whileDragging: MapProps = execute(notRelated.selector)({
            id: notRelated.id,
            type: notRelated.type,
            phase: 'DRAGGING',
            drag: dragging.drag({ x: 0, y: 100 }, impact),
            pending: null,
            dimension: null,
          });
          const whileDropping: MapProps = execute(notRelated.selector)({
            id: notRelated.id,
            type: notRelated.type,
            phase: 'DROP_ANIMATING',
            drag: null,
            pending: dragging.cancel(),
            dimension: null,
          });

          // checking they have the right values
          expect(whileDragging).toEqual(defaultMapProps);
          expect(whileDropping).toEqual(defaultMapProps);
          // checking that memoization did not break
          expect(whileDragging).toBe(whileDropping);
        });
      });
    });

    describe('drop complete', () => {
      const dragging = make();
      const notDragging = make();

      describe('item was dragging', () => {
        it('should move to the origin with no animation', () => {
          const expected: MapProps = {
            offset: origin,
            isDragging: false,
            canLift: true,
            isDropAnimating: false,
            canAnimate: false,
            dimension: null,
            direction: null,
          };

          const props: MapProps = execute(dragging.selector)({
            id: dragging.id,
            type: dragging.type,
            phase: 'DROP_COMPLETE',
            drag: null,
            pending: null,
            dimension: null,
          });

          expect(props).toEqual(expected);
        });
      });

      describe('item was not dragging', () => {
        it('should move to the origin with no animation', () => {
          const expected: MapProps = {
            offset: origin,
            isDragging: false,
            isDropAnimating: false,
            canLift: true,
            canAnimate: false,
            dimension: null,
            direction: null,
          };

          const props: MapProps = execute(notDragging.selector)({
            id: notDragging.id,
            type: notDragging.type,
            phase: 'DROP_COMPLETE',
            drag: null,
            pending: null,
            dimension: null,
          });

          expect(props).toEqual(expected);
        });
      });
    });

    describe('other phases', () => {
      it('should return the default props', () => {
        const phases: Phase[] = ['IDLE', 'COLLECTING_DIMENSIONS'];
        const { id, type, selector } = make();

        phases.forEach((phase: Phase): void => {
          const props: MapProps = execute(selector)({
            id,
            type,
            phase,
            drag: null,
            pending: null,
            dimension: null,
          });

          expect(props).toEqual(defaultMapProps);
        });
      });
    });
  });

  describe('selector isolation', () => {
    it('should not break other Draggables memoization cache on updates', () => {
      // Scenario:
      // A is dragging
      // B and C are not dragging
      // B needs to move out of the way
      // Memoization cache of C should not break

      const a = make();
      const b = make();
      const c = make();

      // First update: both do not need to move
      // This will create a cache
      const firstB: MapProps = execute(b.selector)({
        id: b.id,
        type: b.type,
        phase: 'DRAGGING',
        drag: a.drag({ x: 100, y: 200 }, noImpact),
        pending: null,
        dimension: null,
      });
      const firstC: MapProps = execute(c.selector)({
        id: c.id,
        type: c.type,
        phase: 'DRAGGING',
        drag: a.drag({ x: 100, y: 200 }, noImpact),
        pending: null,
        dimension: null,
      });

      // initially they will both have the same value
      expect(firstB).toEqual(firstC);
      // but they will be different references
      expect(firstB).not.toBe(firstC);

      // Second update: still both do not need to move.
      // This is checking that the caches are created
      const secondB: MapProps = execute(b.selector)({
        id: b.id,
        type: b.type,
        phase: 'DRAGGING',
        drag: a.drag({ x: 100, y: 200 }, noImpact),
        pending: null,
        dimension: null,
      });
      const secondC: MapProps = execute(c.selector)({
        id: c.id,
        type: c.type,
        phase: 'DRAGGING',
        drag: a.drag({ x: 100, y: 200 }, noImpact),
        pending: null,
        dimension: null,
      });

      // Checking that the caches worked correctly
      expect(firstB).toBe(secondB);
      expect(firstC).toBe(secondC);

      // Third update: B needs to move out of the way
      // This is checking that cache of C does not break
      const impact: DragImpact = {
        movement: {
          // b has moved
          draggables: [b.id],
          amount: {
            x: 0,
            y: a.dimension.page.withMargin.height,
          },
          isBeyondStartPosition: true,
        },
        direction: 'vertical',
        destination: {
          index: a.initial.source.index + 1,
          droppableId: a.initial.source.droppableId,
        },
      };
      const thirdB: MapProps = execute(b.selector)({
        id: b.id,
        type: b.type,
        phase: 'DRAGGING',
        drag: a.drag({ x: 100, y: 200 }, impact),
        pending: null,
        dimension: null,
      });
      const thirdC: MapProps = execute(c.selector)({
        id: c.id,
        type: c.type,
        phase: 'DRAGGING',
        drag: a.drag({ x: 100, y: 200 }, impact),
        pending: null,
        dimension: null,
      });

      // B has needed to change
      expect(thirdB).not.toEqual(secondB);
      // C's cache should not have broken due to an update of B
      expect(thirdC).toBe(secondC);
    });
  });

  describe('child render behavior', () => {
    class Person extends Component {
      props: {
        name: string,
        provided: Provided
      }

      render() {
        const { provided, name } = this.props;
        return (
          <div
            ref={ref => provided.innerRef(ref)}
            style={provided.draggableStyle}
            {...provided.dragHandleProps}
          >
            hello {name}
          </div>
        );
      }
    }

    class App extends Component {
      props: {
        currentUser: string,
      }

      render() {
        return (
          <Draggable draggableId="drag-1">
            {(provided: Provided) => (
              <Person
                name={this.props.currentUser}
                provided={provided}
              />
            )}
          </Draggable>
        );
      }
    }

    beforeEach(() => {
      jest.spyOn(Person.prototype, 'render');
    });

    afterEach(() => {
      Person.prototype.render.mockRestore();
    });

    it('should render the child function when the parent renders', () => {
      const wrapper = mount(<App currentUser="Jake" />, combine(withStore(), withDroppableId(droppableId)));

      // initial render causes two renders due to setting child ref
      expect(Person.prototype.render).toHaveBeenCalledTimes(2);
      expect(wrapper.find(Person).props().name).toBe('Jake');
    });

    it('should render the child function when the parent re-renders', () => {
      const wrapper = mount(<App currentUser="Jake" />, combine(withStore(), withDroppableId(droppableId)));

      wrapper.update();

      // initial render causes two renders due to setting child ref
      expect(Person.prototype.render).toHaveBeenCalledTimes(3);
      expect(wrapper.find(Person).props().name).toBe('Jake');
    });

    it('should render the child function when the parents props changes that cause a re-render', () => {
      const wrapper = mount(<App currentUser="Jake" />, combine(withStore(), withDroppableId(droppableId)));

      wrapper.setProps({
        currentUser: 'Finn',
      });

      // initial render causes two renders due to setting child ref
      expect(Person.prototype.render).toHaveBeenCalledTimes(3);
      expect(wrapper.find(Person).props().name).toBe('Finn');
    });
  });
});
