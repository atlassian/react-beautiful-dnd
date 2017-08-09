// @flow
/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import { mount } from 'enzyme';
import Draggable, { makeSelector } from '../../../src/view/draggable/connected-draggable';
import { getDraggableDimension } from '../../../src/state/dimension';
import noImpact from '../../../src/state/no-impact';
import { combine, withStore, withDroppableId } from '../../utils/get-context-options';
import getClientRect from '../../utils/get-client-rect';
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
import type { MapProps, Provided } from '../../../src/view/draggable/draggable-types';

const droppableId: DroppableId = 'drop-1';
const type: TypeId = 'TYPE';
const origin: Position = { x: 0, y: 0 };

const make = (() => {
  let callCount = 0;

  return () => {
    callCount++;
    const id: DraggableId = `drag-id-${callCount}`;
    const selector = makeSelector();
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
        source: initial.source,
        destination: {
          index: initial.source.index + 1,
          droppableId: initial.source.droppableId,
        },
      };

      const pending: PendingDrop = {
        newHomeOffset,
        result,
        last: drag(newHomeOffset, impact),
      };
      return pending;
    };

    return { id, selector, dimension, initial, drag, drop };
  };
})();

const defaultMapProps: MapProps = {
  isDragging: false,
  isDropAnimating: false,
  isAnotherDragging: false,
  canAnimate: false,
  // at the origin by default
  offset: origin,
  dimension: null,
};

type SelectorArgs = {|
  id: DraggableId,
  phase: Phase,
  drag: ?DragState,
  pending: ?PendingDrop,
  dimension: ?DraggableDimension,
|}

const execute = (selector: Function) =>
  ({ phase, drag, pending, id, dimension }: SelectorArgs): MapProps =>
    selector.resultFunc(
      id,
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
        const { id, selector, dimension } = make();

        const result = execute(selector)({
          phase: 'DRAGGING',
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
          const { id, dimension, selector, drag } = make();
          const offset: Position = {
            x: 100,
            y: 200,
          };
          const expected: MapProps = {
            isDragging: true,
            isDropAnimating: false,
            isAnotherDragging: false,
            canAnimate: true,
            offset,
            dimension,
          };

          const result: MapProps = execute(selector)({
            id,
            phase: 'DRAGGING',
            drag: drag(offset),
            pending: null,
            dimension,
          });

          expect(result).toEqual(expected);
        });

        it('should break memoization on every call', () => {
          const { selector, id, drag, dimension } = make();
          const state: DragState = drag({ x: 100, y: 200 });

          const first: MapProps = execute(selector)({
            id,
            phase: 'DRAGGING',
            drag: state,
            pending: null,
            dimension,
          });
          const second: MapProps = execute(selector)({
            id,
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
      });

      describe('item is not dragging', () => {
        const dragging = make();
        const notDragging = make();
        it('should return indicate that another item is dragging', () => {
          const expected: MapProps = {
            // property under test
            isAnotherDragging: true,
            // other properties
            isDragging: false,
            isDropAnimating: false,
            canAnimate: true,
            offset: origin,
            dimension: null,
          };

          const result: MapProps = execute(notDragging.selector)({
            id: notDragging.id,
            phase: 'DRAGGING',
            drag: dragging.drag({ x: 100, y: 200 }),
            pending: null,
            dimension: null,
          });

          expect(result).toEqual(expected);
        });

        it('should not break memoization on multiple calls', () => {
          const first: MapProps = execute(notDragging.selector)({
            id: notDragging.id,
            phase: 'DRAGGING',
            drag: dragging.drag({ x: 100, y: 200 }),
            pending: null,
            dimension: null,
          });
          const second: MapProps = execute(notDragging.selector)({
            id: notDragging.id,
            phase: 'DRAGGING',
            drag: dragging.drag({ x: 100, y: 200 }),
            pending: null,
            dimension: null,
          });

          // checking that we got the same object back
          expect(first).toBe(second);
        });
      });
    });

    describe('drop animating', () => {
      it('should log an error and return default props if there is no pending drop', () => {
        const { id, selector, dimension } = make();

        const props: MapProps = execute(selector)({
          id,
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
          const { id, dimension, selector, drop } = make();
          const newHomeOffset: Position = {
            x: 100,
            y: 10,
          };
          const expected: MapProps = {
            isDragging: false,
            isDropAnimating: true,
            isAnotherDragging: false,
            canAnimate: true,
            offset: newHomeOffset,
            dimension,
          };
          const pending: PendingDrop = drop(newHomeOffset);

          const props: MapProps = execute(selector)({
            id,
            phase: 'DROP_ANIMATING',
            drag: null,
            pending,
            dimension,
          });

          expect(props).toEqual(expected);
        });
      });

      describe('item was not dragging and not moved', () => {
        const expected: MapProps = {
          isDragging: false,
          isDropAnimating: false,
          isAnotherDragging: false,
          // has not moved so still at the origin
          offset: origin,
          dimension: null,
          // is the same as the default props except for
          // animation being permitted
          canAnimate: true,
        };

        it('should remain in its original position', () => {
          const dragging = make();
          const notDragging = make();

          const props: MapProps = execute(notDragging.selector)({
            id: notDragging.id,
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
            isAnotherDragging: true,
            canAnimate: true,
            // at the origin by default
            offset: origin,
            dimension: null,
          };

          const duringDrag: MapProps = execute(notDragging.selector)({
            id: notDragging.id,
            phase: 'DRAGGING',
            drag: dragging.drag({ x: 100, y: 200 }),
            pending: null,
            dimension: null,
          });
          const duringDrop: MapProps = execute(notDragging.selector)({
            id: notDragging.id,
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
              amount: dragging.dimension.page.withMargin.height,
              isMovingForward: true,
            },
            destination: {
              index: dragging.initial.source.index + 1,
              droppableId: dragging.initial.source.droppableId,
            },
          };
          const expected: MapProps = {
            isDropAnimating: false,
            isDragging: false,
            // Other item is no longer dragging
            isAnotherDragging: false,
            // Because the item is moving forward, this will
            // be moving backwards to get out of the way.
            offset: {
              x: 0,
              y: -dragging.dimension.page.withMargin.height,
            },
            // allowing item to move out of the way
            canAnimate: true,
            dimension: null,
          };

          const props: MapProps = execute(notDragging.selector)({
            id: notDragging.id,
            phase: 'DROP_ANIMATING',
            drag: null,
            pending: dragging.drop({ x: 100, y: 100 }, impact),
            dimension: null,
          });

          expect(props).toEqual(expected);
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
            isAnotherDragging: false,
            isDropAnimating: false,
            canAnimate: false,
            dimension: null,
          };

          const props: MapProps = execute(dragging.selector)({
            id: dragging.id,
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
            isDropAnimating: false,
            isAnotherDragging: false,
            isDragging: false,
            canAnimate: false,
            dimension: null,
          };

          const props: MapProps = execute(notDragging.selector)({
            id: notDragging.id,
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
        const { id, selector } = make();

        phases.forEach((phase: Phase): void => {
          const props: MapProps = execute(selector)({
            id,
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
