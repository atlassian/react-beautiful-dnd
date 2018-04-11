// @flow
/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import { mount } from 'enzyme';
import { withStore, combine, withDimensionMarshal, withStyleContext } from '../../utils/get-context-options';
import Droppable, { makeSelector } from '../../../src/view/droppable/connected-droppable';
import getStatePreset from '../../utils/get-simple-state-preset';
import forceUpdate from '../../utils/force-update';
import { getPreset } from '../../utils/dimension';
import type {
  Selector,
  MapProps,
  OwnProps,
  Provided,
} from '../../../src/view/droppable/droppable-types';
import type {
  DroppableDimension,
  State,
  DragImpact,
} from '../../../src/types';

const preset = getPreset();
const state = getStatePreset();
const clone = (value: State): State => (JSON.parse(JSON.stringify(value)) : any);

const getOwnProps = (dimension: DroppableDimension): OwnProps => ({
  type: dimension.descriptor.type,
  droppableId: dimension.descriptor.id,
  children: () => null,
  isDropDisabled: false,
  direction: dimension.axis.direction,
  ignoreContainerClipping: false,
});

describe('Connected Droppable', () => {
  describe('disabled', () => {
    it('should return the default map props regardless of phase', () => {
      const selector: Selector = makeSelector();
      const ownProps: OwnProps = getOwnProps(preset.home);
      const defaultMapProps: MapProps = selector(state.idle, ownProps);
      // $ExpectError - using spread
      const newProps: OwnProps = {
        ...ownProps,
        isDropDisabled: true,
      };

      state.allPhases().forEach((current: State) => {
        const disabledProps: MapProps = selector(current, newProps);
        expect(disabledProps).toBe(defaultMapProps);
      });
    });
  });

  describe('resting and preparing', () => {
    it('should return the default map props and not break memoization between calls', () => {
      const selector: Selector = makeSelector();
      const ownProps: OwnProps = getOwnProps(preset.home);
      const defaultMapProps: MapProps = selector(state.idle, ownProps);

      [
        state.idle,
        state.preparing,
        state.requesting(),
        state.dropComplete(),
      ].forEach((current: State) => {
        Array.from({ length: 3 }).forEach(() => {
          expect(selector(current, ownProps)).toBe(defaultMapProps);
        });
      });
    });
  });

  describe('dragging', () => {
    describe('is not dragging over', () => {
      const ownProps: OwnProps = getOwnProps(preset.home);

      it('should not render a placeholder or say that it is being dragged over', () => {
        const selector: Selector = makeSelector();
        const expected: MapProps = {
          isDraggingOver: false,
          draggingOverWith: null,
          placeholder: null,
        };

        // dragging over nothing
        const result: MapProps = selector(state.dragging(preset.inHome1.descriptor.id), ownProps);

        expect(result).toEqual(expected);
      });

      it('should not break memoization from previous phases', () => {
        const selector: Selector = makeSelector();
        const expected: MapProps = {
          isDraggingOver: false,
          draggingOverWith: null,
          placeholder: null,
        };

        // dragging over nothing
        const idle: MapProps = selector(state.idle, ownProps);
        const preparing: MapProps = selector(state.preparing, ownProps);
        const requesting: MapProps = selector(state.requesting(), ownProps);
        const dragging: MapProps = selector(state.dragging(), ownProps);

        // checking memoization
        expect(idle).toBe(preparing);
        expect(preparing).toBe(requesting);
        expect(requesting).toBe(dragging);
        // validating result
        expect(idle).toEqual(expected);
      });

      it('should not break memoization between drags', () => {
        const selector: Selector = makeSelector();

        // dragging over nothing
        const result1: MapProps = selector(state.dragging(), ownProps);
        const result2: MapProps = selector(state.dragging(), ownProps);

        expect(result1).toBe(result2);
      });
    });

    describe('is dragging over', () => {
      describe('home list', () => {
        // dragging inHome1 over home
        const ownProps: OwnProps = getOwnProps(preset.home);

        const current: State = (() => {
          const base = state.dragging();
          const impact: DragImpact = {
            movement: {
              displaced: [],
              amount: { x: 0, y: 0 },
              isBeyondStartPosition: false,
            },
            direction: preset.home.axis.direction,
            destination: {
              index: 0,
              droppableId: preset.home.descriptor.id,
            },
          };
          return {
            ...base,
            drag: {
              ...base.drag,
              impact,
            },
          };
        })();

        it('should say that it is being dragged over - and not add a placeholder (it is already taken care of by draggable)', () => {
          const selector: Selector = makeSelector();

          const result: MapProps = selector(current, ownProps);

          expect(result).toEqual({
            isDraggingOver: true,
            draggingOverWith: preset.inHome1.descriptor.id,
            placeholder: null,
          });
        });

        it('should not break memoization on multiple calls', () => {
          const selector: Selector = makeSelector();

          const result1: MapProps = selector(clone(current), ownProps);
          const result2: MapProps = selector(clone(current), ownProps);

          expect(result1).toBe(result2);
        });
      });

      describe('foreign list', () => {
        // dragging inHome1 over foreign
        const ownProps: OwnProps = getOwnProps(preset.foreign);

        const current: State = (() => {
          const base = state.dragging(preset.inHome1.descriptor.id);
          const impact: DragImpact = {
            movement: {
              displaced: [],
              amount: { x: 0, y: 0 },
              isBeyondStartPosition: false,
            },
            direction: preset.foreign.axis.direction,
            destination: {
              index: 0,
              droppableId: preset.foreign.descriptor.id,
            },
          };
          return {
            ...base,
            drag: {
              ...base.drag,
              impact,
            },
          };
        })();

        it('should add a placeholder', () => {
          const selector: Selector = makeSelector();
          const expected: MapProps = {
            isDraggingOver: true,
            draggingOverWith: preset.inHome1.descriptor.id,
            placeholder: preset.inHome1.placeholder,
          };

          const result: MapProps = selector(current, ownProps);

          expect(result).toEqual(expected);
        });

        it('should not break memoization on multiple calls', () => {
          const selector: Selector = makeSelector();

          // using spread rather than clone as we do not want to invalidate
          // the reference to the dimensions in the store
          const result1: MapProps = selector({ ...current }, ownProps);
          const result2: MapProps = selector({ ...current }, ownProps);

          expect(result1).toBe(result2);
        });
      });
    });
  });

  describe('dropping', () => {
    describe('home list', () => {
      const ownProps: OwnProps = getOwnProps(preset.home);
      describe('was not dragging over', () => {
        it('should not break memoization from the dragging phase', () => {
          const selector: Selector = makeSelector();

          const dragging: MapProps = selector(state.dragging(), ownProps);
          const dropping: MapProps = selector(state.dropAnimating(), ownProps);

          expect(dragging).toBe(dropping);
        });
      });

      describe('was dragging over', () => {
        const impact: DragImpact = {
          movement: {
            displaced: [],
            amount: { x: 0, y: 0 },
            isBeyondStartPosition: false,
          },
          direction: preset.home.axis.direction,
          destination: {
            index: 0,
            droppableId: preset.home.descriptor.id,
          },
        };

        const dragging: State = (() => {
          const base: State = state.dragging(preset.inHome1.descriptor.id);
          return {
            ...base,
            drag: {
              ...base.drag,
              impact,
            },
          };
        })();
        const dropping: State = (() => {
          const base: State = state.dropAnimating(preset.inHome1.descriptor.id);
          return {
            ...base,
            drop: {
              result: null,
              pending: {
                newHomeOffset: { x: 0, y: 0 },
                impact,
                result: {
                  draggableId: preset.inHome1.descriptor.id,
                  type: preset.home.descriptor.type,
                  source: {
                    index: preset.inHome1.descriptor.index,
                    droppableId: preset.home.descriptor.id,
                  },
                  destination: {
                    index: preset.inHome1.descriptor.index,
                    droppableId: preset.home.descriptor.id,
                  },
                  reason: 'DROP',
                },
              },
            },
          };
        })();

        it('should not break memoization from the dragging phase', () => {
          const selector: Selector = makeSelector();

          const result1: MapProps = selector(dragging, ownProps);
          const result2: MapProps = selector(dropping, ownProps);

          expect(result1).toBe(result2);
        });
      });
    });

    describe('foreign list', () => {
      // dragging inHome1
      const ownProps: OwnProps = getOwnProps(preset.foreign);
      describe('was not dragging over', () => {
        it('should not break memoization from the dragging phase', () => {
          const selector: Selector = makeSelector();

          const dragging: MapProps = selector(state.dragging(), ownProps);
          const dropping: MapProps = selector(state.dropAnimating(), ownProps);

          expect(dragging).toBe(dropping);
        });
      });

      describe('was dragging over', () => {
        // dragging inHome1 over foreign
        const impact: DragImpact = {
          movement: {
            // not populating correctly
            displaced: [],
            amount: { x: 0, y: 0 },
            isBeyondStartPosition: false,
          },
          direction: preset.foreign.axis.direction,
          destination: {
            index: 0,
            droppableId: preset.foreign.descriptor.id,
          },
        };
        const dragging: State = (() => {
          const base = state.dragging(preset.inHome1.descriptor.id);
          return {
            ...base,
            drag: {
              ...base.drag,
              impact,
            },
          };
        })();
        const dropping: State = (() => {
          const base: State = state.dropAnimating(preset.inHome1.descriptor.id);
          return {
            ...base,
            drop: {
              result: null,
              pending: {
                newHomeOffset: { x: 0, y: 0 },
                impact,
                result: {
                  draggableId: preset.inHome1.descriptor.id,
                  type: preset.home.descriptor.type,
                  source: {
                    index: preset.inHome1.descriptor.index,
                    droppableId: preset.home.descriptor.id,
                  },
                  destination: impact.destination,
                  reason: 'DROP',
                },
              },
            },
          };
        })();

        it('should not break memoization from the dragging phase', () => {
          const selector: Selector = makeSelector();

          const result1: MapProps = selector(dragging, ownProps);
          const result2: MapProps = selector(dropping, ownProps);

          expect(result1).toBe(result2);
        });
      });
    });
  });

  describe('selector isolation', () => {
    it('should not break memoization across selectors', () => {
      const homeSelector: Selector = makeSelector();
      const homeOwnProps: OwnProps = getOwnProps(preset.home);
      const foreignSelector: Selector = makeSelector();
      const foreignOwnProps: OwnProps = getOwnProps(preset.foreign);
      const defaultForeignMapProps: MapProps = foreignSelector(state.idle, foreignOwnProps);

      state.allPhases(preset.inHome1.descriptor.id).forEach((current: State) => {
        // independent selector
        homeSelector(current, homeOwnProps);
        // should not break memoization of inHome2
        expect(foreignSelector(current, foreignOwnProps)).toBe(defaultForeignMapProps);
      });
    });
  });

  describe('child render behavior', () => {
    const contextOptions = combine(
      withStore(),
      withDimensionMarshal(),
      withStyleContext(),
    );

    class Person extends Component<{ name: string, provided: Provided }> {
      render() {
        const { provided, name } = this.props;
        return (
          <div ref={ref => provided.innerRef(ref)} {...provided.droppableProps}>
            hello {name}
          </div>
        );
      }
    }

    class App extends Component<{ currentUser: string }> {
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
      const wrapper = mount(<App currentUser="Jake" />, contextOptions);

      expect(Person.prototype.render).toHaveBeenCalledTimes(1);
      expect(wrapper.find(Person).props().name).toBe('Jake');

      wrapper.unmount();
    });

    it('should render the child function when the parent re-renders', () => {
      const wrapper = mount(<App currentUser="Jake" />, contextOptions);

      forceUpdate(wrapper);

      expect(Person.prototype.render).toHaveBeenCalledTimes(2);
      expect(wrapper.find(Person).props().name).toBe('Jake');

      wrapper.unmount();
    });

    it('should render the child function when the parents props changes that cause a re-render', () => {
      const wrapper = mount(<App currentUser="Jake" />, contextOptions);

      wrapper.setProps({
        currentUser: 'Finn',
      });

      expect(Person.prototype.render).toHaveBeenCalledTimes(2);
      expect(wrapper.find(Person).props().name).toBe('Finn');

      wrapper.unmount();
    });
  });
});
