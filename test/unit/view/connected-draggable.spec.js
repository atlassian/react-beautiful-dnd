// @flow
/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import { mount } from 'enzyme';
import Draggable, { makeSelector } from '../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../utils/dimension';
import { negate } from '../../../src/state/position';
import createDimensionMarshal from '../../../src/state/dimension-marshal/dimension-marshal';
import getStatePreset from '../../utils/get-simple-state-preset';
import {
  combine,
  withStore,
  withDroppableId,
  withDimensionMarshal,
  withStyleContext,
  withCanLift,
} from '../../utils/get-context-options';
import forceUpdate from '../../utils/force-update';
import type { DimensionMarshal } from '../../../src/state/dimension-marshal/dimension-marshal-types';
import type {
  Selector,
  OwnProps,
  MapProps,
  Provided,
} from '../../../src/view/draggable/draggable-types';
import type {
  Position,
  State,
  CurrentDragPositions,
  DragImpact,
  DraggableDimension,
} from '../../../src/types';

const preset = getPreset();
const state = getStatePreset();
const move = (previous: State, offset: Position): State => {
  const clientPositions: CurrentDragPositions = {
    offset,
    // not calculating for this test
    selection: { x: 0, y: 0 },
    center: { x: 0, y: 0 },
  };

  return {
    ...previous,
    drag: {
      ...previous.drag,
      current: {
        // $ExpectError - not checking for null
        ...previous.drag.current,
        client: clientPositions,
        page: clientPositions,
      },
    },
  };
};

const getOwnProps = (dimension: DraggableDimension): OwnProps => ({
  draggableId: dimension.descriptor.id,
  index: dimension.descriptor.index,
  isDragDisabled: false,
  disableInteractiveElementBlocking: false,
  children: () => null,
});

describe('Connected Draggable', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('is currently dragging', () => {
    const ownProps: OwnProps = getOwnProps(preset.inHome1);

    it('should log an error when there is invalid drag state', () => {
      const invalid: State = {
        ...state.dragging(),
        drag: null,
      };
      const selector: Selector = makeSelector();
      const defaultMapProps: MapProps = selector(state.idle, ownProps);

      const result: MapProps = selector(invalid, ownProps);

      expect(result).toBe(defaultMapProps);
      expect(console.error).toHaveBeenCalled();
    });

    it('should move the dragging item to the current offset', () => {
      const selector: Selector = makeSelector();

      const result: MapProps = selector(
        move(state.dragging(), { x: 20, y: 30 }),
        ownProps
      );

      expect(result).toEqual({
        isDropAnimating: false,
        isDragging: true,
        offset: { x: 20, y: 30 },
        shouldAnimateDragMovement: false,
        shouldAnimateDisplacement: false,
        dimension: preset.inHome1,
        direction: null,
        draggingOver: null,
      });
    });

    it('should control whether drag movement is allowed based the current state', () => {
      const selector: Selector = makeSelector();
      const previous: State = move(state.dragging(), { x: 20, y: 30 });

      // drag animation is allowed
      const allowed: State = {
        ...previous,
        drag: {
          ...previous.drag,
          current: {
            // $ExpectError - not checking for null
            ...previous.drag.current,
            shouldAnimate: true,
          },
        },
      };
      expect(selector(allowed, ownProps).shouldAnimateDragMovement).toBe(true);

      // drag animation is not allowed
      const notAllowed: State = {
        ...previous,
        drag: {
          ...previous.drag,
          current: {
            // $ExpectError - not checking for null
            ...previous.drag.current,
            shouldAnimate: false,
          },
        },
      };
      expect(selector(notAllowed, ownProps).shouldAnimateDragMovement).toBe(false);
    });

    it('should not break memoization on multiple calls to the same offset', () => {
      const selector: Selector = makeSelector();

      const result1: MapProps = selector(
        move(state.dragging(), { x: 100, y: 200 }),
        ownProps
      );
      const result2: MapProps = selector(
        move(state.dragging(), { x: 100, y: 200 }),
        ownProps
      );

      expect(result1).toBe(result2);
      expect(selector.recomputations()).toBe(1);
    });

    it('should break memoization on multiple calls if moving to a new position', () => {
      const selector: Selector = makeSelector();

      const result1: MapProps = selector(
        move(state.dragging(), { x: 100, y: 200 }),
        ownProps
      );
      const result2: MapProps = selector(
        move({ ...state.dragging() }, { x: 101, y: 200 }),
        ownProps
      );

      expect(result1).not.toBe(result2);
      expect(result1).not.toEqual(result2);
      expect(selector.recomputations()).toBe(2);
    });

    describe('drop animating', () => {
      it('should log an error when there is invalid drag state', () => {
        const invalid: State = {
          ...state.dropAnimating(),
          drop: null,
        };
        const selector: Selector = makeSelector();
        const defaultMapProps: MapProps = selector(state.idle, ownProps);

        const result: MapProps = selector(invalid, ownProps);

        expect(result).toBe(defaultMapProps);
        expect(console.error).toHaveBeenCalled();
      });

      it('should move the draggable to the new offset', () => {
        const selector: Selector = makeSelector();
        const current: State = state.dropAnimating();

        const result: MapProps = selector(
          current,
          ownProps,
        );

        expect(result).toEqual({
          // no longer dragging
          isDragging: false,
          // is now drop animating
          isDropAnimating: true,
          // $ExpectError - not testing for null
          offset: current.drop.pending.newHomeOffset,
          dimension: preset.inHome1,
          direction: null,
          // animation now controlled by isDropAnimating flag
          shouldAnimateDisplacement: false,
          shouldAnimateDragMovement: false,
          draggingOver: null,
        });
      });
    });

    describe('user cancel', () => {
      it('should move the draggable to the new offset', () => {
        const selector: Selector = makeSelector();
        const current: State = state.userCancel();

        const result: MapProps = selector(
          current,
          ownProps,
        );

        expect(result).toEqual({
          // no longer dragging
          isDragging: false,
          // is now drop animating
          isDropAnimating: true,
          // $ExpectError - not testing for null
          offset: current.drop.pending.newHomeOffset,
          dimension: preset.inHome1,
          direction: null,
          // animation now controlled by isDropAnimating flag
          shouldAnimateDisplacement: false,
          shouldAnimateDragMovement: false,
          draggingOver: null,
        });
      });
    });
  });

  describe('something else is dragging', () => {
    describe('nothing impacted by drag', () => {
      const ownProps: OwnProps = getOwnProps(preset.inHome2);

      it('should log an error when there is invalid drag state', () => {
        const invalid: State = {
          ...state.dragging(),
          drag: null,
        };
        const selector: Selector = makeSelector();
        const defaultMapProps: MapProps = selector(state.idle, ownProps);

        const result: MapProps = selector(invalid, ownProps);

        expect(result).toBe(defaultMapProps);
        expect(console.error).toHaveBeenCalled();
      });

      it('should return the default map props', () => {
        const selector: Selector = makeSelector();
        const defaultMapProps: MapProps = selector(state.idle, ownProps);

        const result: MapProps = selector(
          state.dragging(preset.inHome1.descriptor.id),
          ownProps
        );

        expect(result).toBe(defaultMapProps);
      });

      it('should not break memoization on multiple calls', () => {
        const selector: Selector = makeSelector();
        const defaultMapProps: MapProps = selector(state.idle, ownProps);

        const result1: MapProps = selector(
          move(state.dragging(preset.inHome1.descriptor.id), { x: 10, y: 40 }),
          ownProps
        );
        const result2: MapProps = selector(
          move(state.dragging(preset.inHome1.descriptor.id), { x: 15, y: 60 }),
          ownProps
        );

        expect(result1).toBe(defaultMapProps);
        expect(result1).toBe(result2);
        expect(selector.recomputations()).toBe(1);
      });
    });

    describe('other draggables impacted - but not this one', () => {
      it('should return the default props', () => {
        // looking at inHome3
        const ownProps: OwnProps = getOwnProps(preset.inHome3);
        const selector = makeSelector();
        const defaultMapProps: MapProps = selector(state.idle, ownProps);
        // moving inHome1 down beyond inHome2
        const impact: DragImpact = {
          direction: preset.home.axis.direction,
          destination: {
            index: 1,
            droppableId: preset.home.descriptor.id,
          },
          movement: {
            amount: { y: preset.inHome1.client.withMargin.height, x: 0 },
            isBeyondStartPosition: true,
            displaced: [
              {
                draggableId: preset.inHome2.descriptor.id,
                isVisible: true,
                shouldAnimate: true,
              },
            ],
          },
        };
        const previous: State = state.dragging(preset.inHome1.descriptor.id);
        const current: State = {
          ...previous,
          drag: {
            ...previous.drag,
            impact,
          },
        };

        const result: MapProps = selector(current, ownProps);

        expect(result).toEqual(defaultMapProps);
      });

      it('should not break memoization if not needing to move - even if other things draggables are', () => {
        // looking at inHome4
        const ownProps: OwnProps = {
          draggableId: preset.inHome4.descriptor.id,
          index: preset.inHome4.descriptor.index,
          isDragDisabled: false,
          disableInteractiveElementBlocking: false,
          children: () => null,
        };

        const selector = makeSelector();
        const defaultMapProps: MapProps = selector(state.idle, ownProps);
        // moving inHome1 down beyond inHome2
        const impact1: DragImpact = {
          direction: preset.home.axis.direction,
          destination: {
            index: 1,
            droppableId: preset.home.descriptor.id,
          },
          movement: {
            amount: { y: preset.inHome1.client.withMargin.height, x: 0 },
            isBeyondStartPosition: true,
            displaced: [
              {
                draggableId: preset.inHome2.descriptor.id,
                isVisible: true,
                shouldAnimate: true,
              },
            ],
          },
        };
        // moving inHome1 down beyond inHome3
        const impact2: DragImpact = {
          direction: preset.home.axis.direction,
          destination: {
            index: 2,
            droppableId: preset.home.descriptor.id,
          },
          movement: {
            amount: { y: preset.inHome1.client.withMargin.height, x: 0 },
            isBeyondStartPosition: true,
            displaced: [
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
            ],
          },
        };
        const original: State = state.dragging(preset.inHome1.descriptor.id);
        const first: State = {
          ...original,
          drag: {
            ...original.drag,
            impact: impact1,
          },
        };
        const second: State = {
          ...first,
          drag: {
            ...first.drag,
            impact: impact2,
          },
        };

        const result1: MapProps = selector(first, ownProps);
        const result2: MapProps = selector(second, ownProps);

        expect(result1).toEqual(defaultMapProps);
        expect(result1).toBe(result2);
      });
    });

    describe('impacted by the drag', () => {
      it('should move in backwards if the dragging item is moving beyond its start position', () => {
        // looking at inHome2
        const ownProps: OwnProps = getOwnProps(preset.inHome2);
        const selector = makeSelector();
        const amount: Position = { y: preset.inHome1.client.withMargin.height, x: 0 };
        // moving inHome1 down beyond inHome2
        const impact: DragImpact = {
          direction: preset.home.axis.direction,
          destination: {
            index: 1,
            droppableId: preset.home.descriptor.id,
          },
          movement: {
            amount,
            isBeyondStartPosition: true,
            displaced: [
              {
                draggableId: preset.inHome2.descriptor.id,
                isVisible: true,
                shouldAnimate: true,
              },
            ],
          },
        };
        const previous: State = state.dragging(preset.inHome1.descriptor.id);
        const current: State = {
          ...previous,
          drag: {
            ...previous.drag,
            impact,
          },
        };

        const result: MapProps = selector(current, ownProps);

        expect(result).toEqual({
          isDragging: false,
          isDropAnimating: false,
          // moving backwards
          offset: negate(amount),
          shouldAnimateDisplacement: true,
          shouldAnimateDragMovement: false,
          dimension: null,
          direction: null,
          draggingOver: null,
        });
      });

      it('should move forwards if the dragging item is not beyond its start position', () => {
        // looking at inHome1
        const ownProps: OwnProps = getOwnProps(preset.inHome1);
        const selector = makeSelector();
        const amount: Position = { y: preset.inHome2.client.withMargin.height, x: 0 };
        // moving inHome2 up beyond inHome1
        const impact: DragImpact = {
          direction: preset.home.axis.direction,
          destination: {
            index: 0,
            droppableId: preset.home.descriptor.id,
          },
          movement: {
            amount,
            isBeyondStartPosition: false,
            displaced: [
              {
                draggableId: preset.inHome1.descriptor.id,
                isVisible: true,
                shouldAnimate: true,
              },
            ],
          },
        };
        const previous: State = state.dragging(preset.inHome2.descriptor.id);
        const current: State = {
          ...previous,
          drag: {
            ...previous.drag,
            impact,
          },
        };

        const result: MapProps = selector(current, ownProps);

        expect(result).toEqual({
          isDragging: false,
          isDropAnimating: false,
          // moving forwards
          offset: amount,
          shouldAnimateDisplacement: true,
          shouldAnimateDragMovement: false,
          dimension: null,
          direction: null,
          draggingOver: null,
        });
      });

      it('should not move the item and return the default map props if the displacement is not visible', () => {
        // looking at inHome2
        const ownProps: OwnProps = getOwnProps(preset.inHome2);
        const selector = makeSelector();
        const defaultMapProps: MapProps = selector(state.idle, ownProps);
        const amount: Position = { y: preset.inHome1.client.withMargin.height, x: 0 };
        // moving inHome1 down beyond inHome2
        const impact: DragImpact = {
          direction: preset.home.axis.direction,
          destination: {
            index: 1,
            droppableId: preset.home.descriptor.id,
          },
          movement: {
            amount,
            isBeyondStartPosition: true,
            displaced: [
              {
                draggableId: preset.inHome2.descriptor.id,
                isVisible: false,
                shouldAnimate: true,
              },
            ],
          },
        };
        const previous: State = state.dragging(preset.inHome1.descriptor.id);
        const current: State = {
          ...previous,
          drag: {
            ...previous.drag,
            impact,
          },
        };

        const result: MapProps = selector(current, ownProps);

        expect(result).toBe(defaultMapProps);
      });

      it('should indicate whether the displacement should be animated based on the drag impact', () => {
        // looking at inHome2
        const ownProps: OwnProps = getOwnProps(preset.inHome2);
        const selector = makeSelector();
        const amount: Position = { y: preset.inHome1.client.withMargin.height, x: 0 };
        // moving inHome1 down beyond inHome2
        const impact: DragImpact = {
          direction: preset.home.axis.direction,
          destination: {
            index: 1,
            droppableId: preset.home.descriptor.id,
          },
          movement: {
            amount,
            isBeyondStartPosition: true,
            displaced: [
              {
                draggableId: preset.inHome2.descriptor.id,
                isVisible: true,
                shouldAnimate: false,
              },
            ],
          },
        };
        const previous: State = state.dragging(preset.inHome1.descriptor.id);
        const current: State = {
          ...previous,
          drag: {
            ...previous.drag,
            impact,
          },
        };

        const result: MapProps = selector(current, ownProps);

        expect(result).toEqual({
          isDragging: false,
          isDropAnimating: false,
          // moving backwards
          offset: negate(amount),
          shouldAnimateDisplacement: false,
          shouldAnimateDragMovement: false,
          dimension: null,
          direction: null,
          draggingOver: null,
        });
      });

      it('should not break memoization on multiple calls if displaced and remain displaced', () => {
        // looking at inHome4
        const ownProps: OwnProps = getOwnProps(preset.inHome2);
        const selector = makeSelector();
        const amount: Position = { y: preset.inHome1.client.withMargin.height, x: 0 };
        // moving inHome1 down beyond inHome2
        const impact1: DragImpact = {
          direction: preset.home.axis.direction,
          destination: {
            index: 1,
            droppableId: preset.home.descriptor.id,
          },
          movement: {
            amount,
            isBeyondStartPosition: true,
            displaced: [
              {
                draggableId: preset.inHome2.descriptor.id,
                isVisible: true,
                shouldAnimate: true,
              },
            ],
          },
        };
        // moving inHome1 down beyond inHome3
        // inHome2 is still displaced
        const impact2: DragImpact = {
          direction: preset.home.axis.direction,
          destination: {
            index: 2,
            droppableId: preset.home.descriptor.id,
          },
          movement: {
            amount,
            isBeyondStartPosition: true,
            displaced: [
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
            ],
          },
        };
        const original: State = state.dragging(preset.inHome1.descriptor.id);
        const first: State = {
          ...original,
          drag: {
            ...original.drag,
            impact: impact1,
          },
        };
        const second: State = {
          ...first,
          drag: {
            ...first.drag,
            impact: impact2,
          },
        };

        const result1: MapProps = selector(first, ownProps);
        const result2: MapProps = selector(second, ownProps);

        // checking memoization
        expect(result1).toBe(result2);
        expect(selector.recomputations()).toBe(1);
        // validating result
        expect(result1).toEqual({
          isDragging: false,
          isDropAnimating: false,
          // moving backwards
          offset: negate(amount),
          shouldAnimateDisplacement: true,
          shouldAnimateDragMovement: false,
          dimension: null,
          direction: null,
          draggingOver: null,
        });
      });

      describe('drop animating', () => {
        it('should log an error when there is invalid drag state', () => {
          const invalid: State = {
            ...state.dropAnimating(),
            // invalid
            drop: null,
          };
          const selector: Selector = makeSelector();
          const ownProps: OwnProps = getOwnProps(preset.inHome2);
          const defaultMapProps: MapProps = selector(state.idle, ownProps);

          const result: MapProps = selector(invalid, ownProps);

          expect(result).toBe(defaultMapProps);
          expect(console.error).toHaveBeenCalled();
        });

        it('should not break memoization from the dragging phase', () => {
          // looking at inHome2
          const ownProps: OwnProps = getOwnProps(preset.inHome2);
          const selector = makeSelector();
          const amount: Position = { y: preset.inHome1.client.withMargin.height, x: 0 };
          // moving inHome1 down beyond inHome2
          const impact: DragImpact = {
            direction: preset.home.axis.direction,
            destination: {
              index: 1,
              droppableId: preset.home.descriptor.id,
            },
            movement: {
              amount,
              isBeyondStartPosition: true,
              displaced: [
                {
                  draggableId: preset.inHome2.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
              ],
            },
          };
          const dragging: State = (() => {
            const previous: State = state.dragging(preset.inHome1.descriptor.id);
            return {
              ...previous,
              drag: {
                ...previous.drag,
                impact,
              },
            };
          })();
          const dropping: State = (() => {
            const previous: State = state.dropAnimating(preset.inHome1.descriptor.id);
            return {
              ...previous,
              drop: {
                ...previous.drop,
                pending: {
                  // $ExpectError - not checking for null
                  ...previous.drop.pending,
                  impact,
                },
              },
            };
          })();

          const duringDrag: MapProps = selector(dragging, ownProps);
          const duringDrop: MapProps = selector(dropping, ownProps);

          // memoization check
          expect(duringDrag).toBe(duringDrop);
          expect(selector.recomputations()).toBe(1);
          // validating result
          expect(duringDrop).toEqual({
            isDragging: false,
            isDropAnimating: false,
            // moving backwards
            offset: negate(amount),
            shouldAnimateDisplacement: true,
            shouldAnimateDragMovement: false,
            dimension: null,
            direction: null,
            draggingOver: null,
          });
        });
      });

      describe('drop animating', () => {
        it('should log an error when there is invalid drag state', () => {
          const invalid: State = {
            ...state.userCancel(),
            // invalid
            drop: null,
          };
          const selector: Selector = makeSelector();
          const ownProps: OwnProps = getOwnProps(preset.inHome2);
          const defaultMapProps: MapProps = selector(state.idle, ownProps);

          const result: MapProps = selector(invalid, ownProps);

          expect(result).toBe(defaultMapProps);
          expect(console.error).toHaveBeenCalled();
        });

        it('should not break memoization from the dragging phase', () => {
          // looking at inHome2
          const ownProps: OwnProps = getOwnProps(preset.inHome2);
          const selector = makeSelector();
          const amount: Position = { y: preset.inHome1.client.withMargin.height, x: 0 };
          // moving inHome1 down beyond inHome2
          const impact: DragImpact = {
            direction: preset.home.axis.direction,
            destination: {
              index: 1,
              droppableId: preset.home.descriptor.id,
            },
            movement: {
              amount,
              isBeyondStartPosition: true,
              displaced: [
                {
                  draggableId: preset.inHome2.descriptor.id,
                  isVisible: true,
                  shouldAnimate: true,
                },
              ],
            },
          };
          const dragging: State = (() => {
            const previous: State = state.dragging(preset.inHome1.descriptor.id);
            return {
              ...previous,
              drag: {
                ...previous.drag,
                impact,
              },
            };
          })();
          const dropping: State = (() => {
            const previous: State = state.userCancel(preset.inHome1.descriptor.id);
            return {
              ...previous,
              drop: {
                ...previous.drop,
                pending: {
                  // $ExpectError - not checking for null
                  ...previous.drop.pending,
                  impact,
                },
              },
            };
          })();

          const duringDrag: MapProps = selector(dragging, ownProps);
          const duringUserCancel: MapProps = selector(dropping, ownProps);

          // memoization check
          expect(duringDrag).toBe(duringUserCancel);
          expect(selector.recomputations()).toBe(1);
          // validating result
          expect(duringUserCancel).toEqual({
            isDragging: false,
            isDropAnimating: false,
            // moving backwards
            offset: negate(amount),
            shouldAnimateDisplacement: true,
            shouldAnimateDragMovement: false,
            dimension: null,
            direction: null,
            draggingOver: null,
          });
        });
      });
    });
  });

  describe('nothing is dragging', () => {
    it('should return the default map props and not break memoization on multiple calls', () => {
      const resting: State[] = [
        state.idle,
        state.dropComplete(),
      ];
      const ownProps: OwnProps = getOwnProps(preset.inHome1);
      const selector: Selector = makeSelector();
      const defaultMapProps: MapProps = selector(state.idle, ownProps);

      [...resting, ...resting.reverse()].forEach((current: State) => {
        Array.from({ length: 3 }).forEach(() => {
          const result: MapProps = selector(current, ownProps);
          expect(result).toBe(defaultMapProps);
          expect(selector.recomputations()).toBe(1);
        });
      });
    });
  });

  describe('selector isolation', () => {
    it('should not break memoization across selectors', () => {
      const inHome1Selector: Selector = makeSelector();
      const inHome1OwnProps: OwnProps = getOwnProps(preset.inHome1);
      const inHome2Selector: Selector = makeSelector();
      const inHome2OwnProps: OwnProps = getOwnProps(preset.inHome2);
      const defaultInHome2MapProps: MapProps = inHome2Selector(state.idle, inHome2OwnProps);

      state.allPhases(preset.inHome1.descriptor.id).forEach((current: State) => {
        // independent selector
        inHome1Selector(current, inHome1OwnProps);
        // should not break memoization of inHome2
        expect(inHome2Selector(current, inHome2OwnProps)).toBe(defaultInHome2MapProps);
      });
    });
  });

  describe('child render behavior', () => {
    // creating our own marshal so we can publish a droppable
    // so that the draggable can publish itself
    const marshal: DimensionMarshal = createDimensionMarshal({
      cancel: () => { },
      publishDraggable: () => { },
      publishDroppable: () => { },
      updateDroppableScroll: () => { },
      updateDroppableIsEnabled: () => { },
      bulkPublish: () => { },
    });
    const options: Object = combine(
      withStore(),
      withDroppableId(preset.home.descriptor.id),
      withDimensionMarshal(marshal),
      withStyleContext(),
      withCanLift(),
    );

    // registering a fake droppable so that when a draggable
    // registers itself the marshal can find its parent
    marshal.registerDroppable(preset.home.descriptor, {
      getDimension: () => preset.home,
      watchScroll: () => { },
      unwatchScroll: () => { },
      scroll: () => { },
    });

    class Person extends Component<{ name: string, provided: Provided}> {
      render() {
        const { provided, name } = this.props;
        return (
          <div
            ref={ref => provided.innerRef(ref)}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            hello {name}
          </div>
        );
      }
    }

    class App extends Component<{ currentUser: string }> {
      render() {
        return (
          <Draggable draggableId="drag-1">
            {(dragProvided: Provided) => (
              <Person
                name={this.props.currentUser}
                provided={dragProvided}
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
      const wrapper = mount(<App currentUser="Jake" />, options);

      // initial render causes two renders due to setting child ref
      expect(Person.prototype.render).toHaveBeenCalledTimes(2);
      expect(wrapper.find(Person).props().name).toBe('Jake');

      wrapper.unmount();
    });

    it('should render the child function when the parent re-renders', () => {
      const wrapper = mount(<App currentUser="Jake" />, options);

      forceUpdate(wrapper);

      // initial render causes two renders due to setting child ref
      expect(Person.prototype.render).toHaveBeenCalledTimes(3);
      expect(wrapper.find(Person).props().name).toBe('Jake');

      wrapper.unmount();
    });

    it('should render the child function when the parents props changes that cause a re-render', () => {
      const wrapper = mount(<App currentUser="Jake" />, options);

      wrapper.setProps({
        currentUser: 'Finn',
      });

      // initial render causes two renders due to setting child ref
      expect(Person.prototype.render).toHaveBeenCalledTimes(3);
      expect(wrapper.find(Person).props().name).toBe('Finn');

      wrapper.unmount();
    });
  });
});
