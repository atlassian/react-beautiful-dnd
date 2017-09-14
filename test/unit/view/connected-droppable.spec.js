// @flow
/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import { mount } from 'enzyme';
import Droppable, { makeSelector } from '../../../src/view/droppable/connected-droppable';
import noImpact from '../../../src/state/no-impact';
import { getDraggableDimension } from '../../../src/state/dimension';
import { withStore } from '../../utils/get-context-options';
import getClientRect from '../../../src/state/get-client-rect';
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
  DraggableLocation,
  InitialDragLocation,
  CurrentDragLocation,
  Spacing,
} from '../../../src/types';
import type {
  MapProps,
  Provided,
  Selector,
  Placeholder,
} from '../../../src/view/droppable/droppable-types';

type ExecuteArgs = {|
  droppableId: DroppableId,
  phase: Phase,
  drag: ?DragState,
  pending: ?PendingDrop,
  draggable: ?DraggableDimension,
  // being simple and defaulting to false (droppable is enabled)
  isDropDisabled?: boolean,
|}

const execute = (selector: Selector) =>
  ({ phase, drag, draggable, pending, droppableId, isDropDisabled = false }: ExecuteArgs) =>
    selector.resultFunc(
      phase, drag, draggable, pending, droppableId, isDropDisabled,
    );

const defaultMapProps: MapProps = {
  isDraggingOver: false,
  placeholder: null,
};

const homeDroppableId: DroppableId = 'home-id';
const foreignDroppableId: DroppableId = 'foreign-droppable';
const draggableId: DraggableId = 'drag-1';
const origin: Position = { x: 0, y: 0 };

type DragArgs = {|
  isDraggingOver: false | 'home' | 'foreign'
|}

const margin: Spacing = {
  top: 1, left: 2, bottom: 3, right: 4,
};

const draggable: DraggableDimension = getDraggableDimension({
  id: draggableId,
  droppableId: homeDroppableId,
  margin,
  clientRect: getClientRect({
    top: 100,
    left: 0,
    right: 100,
    bottom: 200,
  }),
});

const placeholder: Placeholder = {
  width: draggable.page.withoutMargin.width,
  height: draggable.page.withoutMargin.height,
};

const perform = (() => {
  const initial: InitialDrag = (() => {
    const client: InitialDragLocation = {
      selection: draggable.client.withoutMargin.center,
      center: draggable.client.withoutMargin.center,
    };

    const page: InitialDragLocation = {
      selection: draggable.page.withoutMargin.center,
      center: draggable.page.withoutMargin.center,
    };

    const value: InitialDrag = {
      source: {
        index: 0,
        droppableId: homeDroppableId,
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
      isScrollAllowed: true,
    };
    return value;
  })();

  const homeDestination: DraggableLocation = {
    index: initial.source.index + 1,
    droppableId: homeDroppableId,
  };
  const foreignDestination: DraggableLocation = {
    index: 0,
    droppableId: foreignDroppableId,
  };

  const dragOverHomeImpact: DragImpact = {
    movement: {
      draggables: [draggableId],
      amount: {
        y: draggable.page.withMargin.height,
        x: 0,
      },
      isBeyondStartPosition: true,
    },
    direction: 'vertical',
    destination: homeDestination,
  };

  const dragOverForeignImpact: DragImpact = {
    movement: {
      draggables: [],
      amount: {
        y: draggable.page.withMargin.height,
        x: 0,
      },
      isBeyondStartPosition: false,
    },
    direction: 'vertical',
    destination: foreignDestination,
  };

  const drag = ({ isDraggingOver }: DragArgs): DragState => {
    const impact: DragImpact = (() => {
      if (isDraggingOver === 'home') {
        return dragOverHomeImpact;
      }
      if (isDraggingOver === 'foreign') {
        return dragOverForeignImpact;
      }
      return noImpact;
    })();
    const state: DragState = {
      current,
      impact,
      initial,
    };
    return state;
  };

  const drop = ({ isDraggingOver }: DragArgs): PendingDrop => {
    // some made up position
    const dontCare: Position = {
      x: 100,
      y: 20,
    };

    const destination: ?DraggableLocation = (() => {
      if (isDraggingOver === 'home') {
        return homeDestination;
      }
      if (isDraggingOver === 'foreign') {
        return foreignDestination;
      }
      return null;
    })();

    const impact: DragImpact = drag({ isDraggingOver }).impact;

    const result: DropResult = {
      draggableId,
      type: 'TYPE',
      source: initial.source,
      destination,
    };

    const pending: PendingDrop = {
      trigger: 'DROP',
      newHomeOffset: dontCare,
      impact,
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
            draggable: null,
            droppableId: homeDroppableId,
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
            draggable: null,
            droppableId: homeDroppableId,
            isDropDisabled: true,
          });
          const second: MapProps = execute(selector)({
            phase,
            drag: null,
            pending: null,
            draggable: null,
            droppableId: homeDroppableId,
            isDropDisabled: true,
          });

          // checking object equality
          expect(first).toBe(second);
        });
      });

      it('should not break memoization between phases', () => {
        let previous: MapProps;
        const selector = makeSelector();

        phases.forEach((phase: Phase) => {
          const result: MapProps = execute(selector)({
            phase,
            drag: null,
            pending: null,
            draggable: null,
            droppableId: homeDroppableId,
            isDropDisabled: true,
          });

          // seed previous
          if (!previous) {
            previous = result;
            return;
          }

          // checking object equality
          expect(result).toBe(previous);
          expect(result).toEqual(defaultMapProps);
        });
      });
    });

    describe('while dragging', () => {
      it('should log an error an return the default props if no drag is available', () => {
        const props: MapProps = execute(makeSelector())({
          phase: 'DRAGGING',
          drag: null,
          draggable: null,
          pending: null,
          droppableId: homeDroppableId,
        });

        expect(props).toEqual(defaultMapProps);
        expect(console.error).toHaveBeenCalled();
      });

      describe('over home droppable', () => {
        it('should return that it is dragging over', () => {
          const expected: MapProps = {
            isDraggingOver: true,
            placeholder: null,
          };

          const props: MapProps = execute(makeSelector())({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: 'home' }),
            draggable,
            pending: null,
            droppableId: homeDroppableId,
          });

          expect(props).toEqual(expected);
        });

        it('should not break memoization on multiple drags', () => {
          const selector = makeSelector();
          const expected: MapProps = {
            isDraggingOver: true,
            placeholder: null,
          };

          const props1: MapProps = execute(selector)({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: 'home' }),
            pending: null,
            draggable,
            droppableId: homeDroppableId,
          });
          const props2: MapProps = execute(selector)({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: 'home' }),
            pending: null,
            draggable,
            droppableId: homeDroppableId,
          });

          // checking object equality
          expect(props1).toBe(props2);
          expect(props1).toEqual(expected);
          expect(props2).toEqual(expected);
        });
      });

      describe('over foreign droppable', () => {
        it('should return that it is dragging over and a placeholder', () => {
          const expected: MapProps = {
            isDraggingOver: true,
            placeholder,
          };

          const props: MapProps = execute(makeSelector())({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: 'foreign' }),
            draggable,
            pending: null,
            droppableId: foreignDroppableId,
          });

          expect(props).toEqual(expected);
        });

        it('should not break memoization on multiple drags', () => {
          const selector = makeSelector();
          const expected: MapProps = {
            isDraggingOver: true,
            placeholder,
          };

          const props1: MapProps = execute(selector)({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: 'foreign' }),
            pending: null,
            draggable,
            droppableId: foreignDroppableId,
          });
          const props2: MapProps = execute(selector)({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: 'foreign' }),
            pending: null,
            draggable,
            droppableId: foreignDroppableId,
          });

          // checking object equality
          expect(props1).toBe(props2);
          expect(props1.placeholder).toBe(props2.placeholder);
          expect(props1).toEqual(expected);
          expect(props2).toEqual(expected);
        });
      });

      describe('not dragging over', () => {
        it('should return that it is not dragging over', () => {
          const expected: MapProps = {
            isDraggingOver: false,
            placeholder: null,
          };

          const props: MapProps = execute(makeSelector())({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: false }),
            pending: null,
            draggable,
            droppableId: homeDroppableId,
          });

          expect(props).toEqual(expected);
        });

        it('should not break memoization on multiple drags', () => {
          const selector = makeSelector();
          const expected: MapProps = {
            isDraggingOver: false,
            placeholder: null,
          };

          const props1: MapProps = execute(selector)({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: false }),
            pending: null,
            draggable,
            droppableId: homeDroppableId,
          });
          const props2: MapProps = execute(selector)({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: false }),
            pending: null,
            draggable,
            droppableId: homeDroppableId,
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
          draggable,
          droppableId: homeDroppableId,
        });

        expect(props).toEqual(defaultMapProps);
        expect(console.error).toHaveBeenCalled();
      });

      describe('was dragging over home droppable', () => {
        it('should return that it is dragging over', () => {
          const expected: MapProps = {
            isDraggingOver: true,
            placeholder: null,
          };

          const props: MapProps = execute(makeSelector())({
            phase: 'DROP_ANIMATING',
            drag: null,
            draggable,
            pending: perform.drop({ isDraggingOver: 'home' }),
            droppableId: homeDroppableId,
          });

          expect(props).toEqual(expected);
        });

        it('should not break memoization from a previous DRAGGING phase', () => {
          const selector = makeSelector();
          const expected: MapProps = {
            isDraggingOver: true,
            placeholder: null,
          };

          const dragging: MapProps = execute(selector)({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: 'home' }),
            pending: null,
            draggable,
            droppableId: homeDroppableId,
          });
          const dropAnimating: MapProps = execute(selector)({
            phase: 'DROP_ANIMATING',
            drag: null,
            pending: perform.drop({ isDraggingOver: 'home' }),
            draggable,
            droppableId: homeDroppableId,
          });

          expect(dragging).toEqual(expected);
          expect(dropAnimating).toEqual(expected);
          // checking object equality
          expect(dragging).toBe(dropAnimating);
        });
      });

      describe('was dragging over foreign droppable', () => {
        it('should return that it is dragging over and provide a placeholder', () => {
          const expected: MapProps = {
            isDraggingOver: true,
            placeholder,
          };

          const props: MapProps = execute(makeSelector())({
            phase: 'DROP_ANIMATING',
            drag: null,
            pending: perform.drop({ isDraggingOver: 'foreign' }),
            draggable,
            droppableId: foreignDroppableId,
          });

          expect(props).toEqual(expected);
        });

        it('should not break memoization from a previous DRAGGING phase', () => {
          const selector = makeSelector();
          const expected: MapProps = {
            isDraggingOver: true,
            placeholder,
          };

          const dragging: MapProps = execute(selector)({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: 'foreign' }),
            pending: null,
            draggable,
            droppableId: foreignDroppableId,
          });
          const dropAnimating: MapProps = execute(selector)({
            phase: 'DROP_ANIMATING',
            drag: null,
            pending: perform.drop({ isDraggingOver: 'foreign' }),
            draggable,
            droppableId: foreignDroppableId,
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
            placeholder: null,
          };

          const props: MapProps = execute(makeSelector())({
            phase: 'DROP_ANIMATING',
            drag: null,
            draggable,
            pending: perform.drop({ isDraggingOver: false }),
            droppableId: homeDroppableId,
          });

          expect(props).toEqual(expected);
        });

        it('should not break memoization from a previous DRAGGING phase', () => {
          const selector = makeSelector();
          const expected: MapProps = {
            isDraggingOver: false,
            placeholder: null,
          };

          const dragging: MapProps = execute(selector)({
            phase: 'DRAGGING',
            drag: perform.drag({ isDraggingOver: false }),
            pending: null,
            draggable,
            droppableId: homeDroppableId,
          });
          const dropAnimating: MapProps = execute(selector)({
            phase: 'DROP_ANIMATING',
            drag: null,
            pending: perform.drop({ isDraggingOver: false }),
            draggable,
            droppableId: homeDroppableId,
          });

          expect(dragging).toEqual(expected);
          expect(dropAnimating).toEqual(expected);
          // checking object equality
          expect(dragging).toBe(dropAnimating);
        });
      });
    });

    describe('other phases', () => {
      const others: Phase[] = ['IDLE', 'COLLECTING_DIMENSIONS', 'DROP_COMPLETE'];

      it('should return the default props', () => {
        const selector = makeSelector();

        others.forEach((phase: Phase): void => {
          const props: MapProps = execute(selector)({
            phase,
            drag: null,
            pending: null,
            draggable: null,
            droppableId: homeDroppableId,
          });

          expect(props).toEqual(defaultMapProps);
        });
      });

      it('should not break memoization on multiple calls', () => {
        const selector = makeSelector();

        others.forEach((phase: Phase): void => {
          const first: MapProps = execute(selector)({
            phase,
            drag: null,
            pending: null,
            draggable: null,
            droppableId: homeDroppableId,
          });
          const second: MapProps = execute(selector)({
            phase,
            drag: null,
            pending: null,
            draggable: null,
            droppableId: homeDroppableId,
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
