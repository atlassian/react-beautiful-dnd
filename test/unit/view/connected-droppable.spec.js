// @flow
/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import { mount } from 'enzyme';
import Droppable, { makeSelector } from '../../../src/view/droppable/connected-droppable';
import noImpact from '../../../src/state/no-impact';
import { getDraggableDimension } from '../../../src/state/dimension';
import { withStore } from '../../utils/get-context-options';
import getClientRect from '../../utils/get-client-rect';
import type {
  Phase,
  DragState,
  PendingDrop,
  Position,
  DraggableId,
  DroppableId,
  InitialDrag,
  DragImpact,
  DropResult,
  CurrentDrag,
  DraggableDimension,
  InitialDragLocation,
  CurrentDragLocation,
} from '../../../src/types';
import type { MapProps, Provided } from '../../../src/view/droppable/droppable-types';

type SelectorArgs = {|
  id: DroppableId,
  phase: Phase,
  drag: ?DragState,
  pending: ?PendingDrop,
  isDropDisabled?: boolean
|}

const execute = (selector: Function) =>
  ({ phase, drag, pending, id, isDropDisabled = false }: SelectorArgs) =>
    selector.resultFunc(
      phase, drag, pending, id, isDropDisabled,
    );

const defaultMapProps: MapProps = {
  isDraggingOver: false,
};

const droppableId: DroppableId = 'drop-1';
const draggableId: DraggableId = 'drag-1';
const origin: Position = { x: 0, y: 0 };

type DragArgs = {|
  isDraggingOver: boolean
|}

const perform = (() => {
  const dimension: DraggableDimension = getDraggableDimension({
    id: draggableId,
    droppableId,
    clientRect: getClientRect({
      top: 100,
      left: 0,
      right: 100,
      bottom: 200,
    }),
  });

  const initial: InitialDrag = (() => {
    const client: InitialDragLocation = {
      selection: dimension.client.withoutMargin.center,
      center: dimension.client.withoutMargin.center,
    };

    const page: InitialDragLocation = {
      selection: dimension.page.withoutMargin.center,
      center: dimension.page.withoutMargin.center,
    };

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

  const current: CurrentDrag = (() => {
    const client: CurrentDragLocation = {
      selection: initial.client.center,
      center: initial.client.center,
      offset: origin,
    };

    const page: CurrentDragLocation = {
      selection: initial.page.center,
      center: initial.page.center,
      offset: origin,
    };

    const value: CurrentDrag = {
      id: draggableId,
      type: 'TYPE',
      client,
      page,
      windowScroll: origin,
      withinDroppable: {
        center: page.center,
      },
      shouldAnimate: true,
    };
    return value;
  })();

  const dragOverImpact: DragImpact = {
    movement: {
      draggables: [draggableId],
      amount: {
        y: dimension.page.withMargin.height,
        x: 0,
      },
      isBeyondStartPosition: true,
    },
    direction: 'vertical',
    destination: {
      index: initial.source.index + 1,
      droppableId,
    },
  };

  const drag = ({ isDraggingOver }: DragArgs): DragState => {
    const state: DragState = {
      current,
      impact: isDraggingOver ? dragOverImpact : noImpact,
      initial,
    };
    return state;
  };

  const drop = ({ isDraggingOver }: DragArgs): PendingDrop => {
    // some made up position
    const newHomeOffset: Position = {
      x: 100,
      y: 20,
    };

    const result: DropResult = {
      draggableId,
      type: 'TYPE',
      source: initial.source,
      destination: {
        index: initial.source.index + 1,
        droppableId: initial.source.droppableId,
      },
    };

    const pending: PendingDrop = {
      trigger: 'DROP',
      newHomeOffset,
      impact: isDraggingOver ? dragOverImpact : noImpact,
      result,
    };

    return pending;
  };

  return { drag, drop };
})();

describe('Droppable - connected', () => {
  describe('selector', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      console.error.mockRestore();
    });

    describe('dropping is disabled', () => {
      const phases: Phase[] = ['IDLE', 'COLLECTING_DIMENSIONS', 'DRAGGING', 'DROP_ANIMATING', 'DROP_COMPLETE'];

      it('should always return the default props', () => {
        phases.forEach((phase: Phase) => {
          const props: MapProps = execute(makeSelector())({
            phase,
            drag: null,
            pending: null,
            id: droppableId,
            isDropDisabled: true,
          });

          expect(props).toEqual(defaultMapProps);
        });
      });

      it('should not break memoization on multiple calls', () => {
        phases.forEach((phase: Phase) => {
          const selector = makeSelector();

          const first: MapProps = execute(selector)({
            phase,
            drag: null,
            pending: null,
            id: droppableId,
          });
          const second: MapProps = execute(selector)({
            phase,
            drag: null,
            pending: null,
            id: droppableId,
          });

          // checking object equality
          expect(first).toBe(second);
        });
      });
    });

    describe('while dragging', () => {
      it('should log an error an return the default props if no drag is available', () => {
        const props: MapProps = execute(makeSelector())({
          phase: 'DRAGGING',
          drag: null,
          pending: null,
          id: droppableId,
        });

        expect(props).toEqual(defaultMapProps);
        expect(console.error).toHaveBeenCalled();
      });

      describe('dragging over', () => {
        it('should return that it is dragging over', () => {
          const expected: MapProps = {
            isDraggingOver: true,
          };

          const props: MapProps = execute(makeSelector())({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: true }),
            pending: null,
            id: droppableId,
          });

          expect(props).toEqual(expected);
        });

        it('should not break memoization on multiple drags', () => {
          const selector = makeSelector();
          const expected: MapProps = {
            isDraggingOver: true,
          };

          const props1: MapProps = execute(selector)({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: true }),
            pending: null,
            id: droppableId,
          });
          const props2: MapProps = execute(selector)({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: true }),
            pending: null,
            id: droppableId,
          });

          // checking object equality
          expect(props1).toBe(props2);
          expect(props1).toEqual(expected);
          expect(props2).toEqual(expected);
        });
      });

      describe('not dragging over', () => {
        it('should return that it is not dragging over', () => {
          const expected: MapProps = {
            isDraggingOver: false,
          };

          const props: MapProps = execute(makeSelector())({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: false }),
            pending: null,
            id: droppableId,
          });

          expect(props).toEqual(expected);
        });

        it('should not break memoization on multiple drags', () => {
          const selector = makeSelector();
          const expected: MapProps = {
            isDraggingOver: false,
          };

          const props1: MapProps = execute(selector)({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: false }),
            pending: null,
            id: droppableId,
          });
          const props2: MapProps = execute(selector)({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: false }),
            pending: null,
            id: droppableId,
          });

          // checking object equality
          expect(props1).toBe(props2);
          expect(props1).toEqual(expected);
          expect(props2).toEqual(expected);
        });
      });
    });

    describe('while drop animating', () => {
      it('should log an error an return the default props if no pending drop is available', () => {
        const props: MapProps = execute(makeSelector())({
          phase: 'DROP_ANIMATING',
          drag: null,
          pending: null,
          id: droppableId,
        });

        expect(props).toEqual(defaultMapProps);
        expect(console.error).toHaveBeenCalled();
      });

      describe('dragging over', () => {
        it('should return that it is dragging over', () => {
          const expected: MapProps = {
            isDraggingOver: true,
          };

          const props: MapProps = execute(makeSelector())({
            phase: 'DROP_ANIMATING',
            drag: null,
            pending: perform.drop({ isDraggingOver: true }),
            id: droppableId,
          });

          expect(props).toEqual(expected);
        });

        it('should not break memoization from a previous DRAGGING phase', () => {
          const selector = makeSelector();
          const expected: MapProps = {
            isDraggingOver: true,
          };

          const dragging: MapProps = execute(selector)({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: true }),
            pending: null,
            id: droppableId,
          });
          const dropAnimating: MapProps = execute(selector)({
            phase: 'DROP_ANIMATING',
            drag: null,
            pending: perform.drop({ isDraggingOver: true }),
            id: droppableId,
          });

          expect(dragging).toEqual(expected);
          expect(dropAnimating).toEqual(expected);
          // checking object equality
          expect(dragging).toBe(dropAnimating);
        });
      });

      describe('not dragging over', () => {
        it('should return that it is not dragging over', () => {
          const expected: MapProps = {
            isDraggingOver: false,
          };

          const props: MapProps = execute(makeSelector())({
            phase: 'DROP_ANIMATING',
            drag: null,
            pending: perform.drop({ isDraggingOver: false }),
            id: droppableId,
          });

          expect(props).toEqual(expected);
        });

        it('should not break memoization from a previous DRAGGING phase', () => {
          const selector = makeSelector();
          const expected: MapProps = {
            isDraggingOver: false,
          };

          const dragging: MapProps = execute(selector)({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: false }),
            pending: null,
            id: droppableId,
          });
          const dropAnimating: MapProps = execute(selector)({
            phase: 'DROP_ANIMATING',
            drag: null,
            pending: perform.drop({ isDraggingOver: false }),
            id: droppableId,
          });

          expect(dragging).toEqual(expected);
          expect(dropAnimating).toEqual(expected);
          // checking object equality
          expect(dragging).toBe(dropAnimating);
        });
      });
    });

    describe('other phases', () => {
      const other: Phase[] = ['IDLE', 'COLLECTING_DIMENSIONS', 'DROP_COMPLETE'];

      it('should return the default props', () => {
        const selector = makeSelector();

        other.forEach((phase: Phase): void => {
          const props: MapProps = execute(selector)({
            phase,
            drag: null,
            pending: null,
            id: droppableId,
          });

          expect(props).toEqual(defaultMapProps);
        });
      });

      it('should not break memoization on multiple calls', () => {
        const selector = makeSelector();

        other.forEach((phase: Phase): void => {
          const first: MapProps = execute(selector)({
            phase,
            drag: null,
            pending: null,
            id: droppableId,
          });
          const second: MapProps = execute(selector)({
            phase,
            drag: null,
            pending: null,
            id: droppableId,
          });

          expect(first).toEqual(defaultMapProps);
          expect(second).toEqual(defaultMapProps);
          // checking object equality
          expect(first).toBe(second);
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
          <div ref={ref => provided.innerRef(ref)}>
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
          <Droppable droppableId="drop-1">
            {(provided: Provided) => (
              <Person
                name={this.props.currentUser}
                provided={provided}
              />
            )}
          </Droppable>
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
      const wrapper = mount(<App currentUser="Jake" />, withStore());

      // initial render causes two renders due to setting child ref
      expect(Person.prototype.render).toHaveBeenCalledTimes(2);
      expect(wrapper.find(Person).props().name).toBe('Jake');
    });

    it('should render the child function when the parent re-renders', () => {
      const wrapper = mount(<App currentUser="Jake" />, withStore());

      wrapper.update();

      // initial render causes two renders due to setting child ref
      expect(Person.prototype.render).toHaveBeenCalledTimes(3);
      expect(wrapper.find(Person).props().name).toBe('Jake');
    });

    it('should render the child function when the parents props changes that cause a re-render', () => {
      const wrapper = mount(<App currentUser="Jake" />, withStore());

      wrapper.setProps({
        currentUser: 'Finn',
      });

      // initial render causes two renders due to setting child ref
      expect(Person.prototype.render).toHaveBeenCalledTimes(3);
      expect(wrapper.find(Person).props().name).toBe('Finn');
    });
  });
});
