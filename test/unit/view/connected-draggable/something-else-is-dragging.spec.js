// @flow
import type { Position } from 'css-box-model';
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import noImpact from '../../../../src/state/no-impact';
import getStatePreset from '../../../utils/get-simple-state-preset';
import getDisplacementMap from '../../../../src/state/get-displacement-map';
import { negate, patch } from '../../../../src/state/position';
import {
  draggingStates,
  withImpact,
  move,
  type IsDraggingState,
} from '../../../utils/dragging-state';
import getOwnProps from './get-own-props';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import type {
  Axis,
  DragImpact,
  DraggableLocation,
  Displacement,
} from '../../../../src/types';

const preset = getPreset();
const state = getStatePreset();
const ownProps: OwnProps = getOwnProps(preset.inHome2);
const axis: Axis = preset.home.axis;

const inHome1Amount: Position = patch(
  axis.line,
  preset.inHome1.client.marginBox[axis.size],
);

draggingStates.forEach((current: IsDraggingState) => {
  describe(`in phase: ${current.phase}`, () => {
    describe('nothing impacted by drag', () => {
      it('should return the default props if not impacted by the drag', () => {
        const selector: Selector = makeMapStateToProps();
        const defaultMapProps: MapProps = selector(state.idle, ownProps);

        expect(selector(withImpact(state.dragging(), noImpact), ownProps)).toBe(
          defaultMapProps,
        );
      });

      it('should not break memoization on mulitple calls', () => {
        const selector: Selector = makeMapStateToProps();
        const defaultMapProps: MapProps = selector(state.idle, ownProps);

        expect(
          selector(
            withImpact(move(state.dragging(), { x: 1, y: 2 }), noImpact),
            ownProps,
          ),
        ).toBe(defaultMapProps);
        expect(
          selector(
            withImpact(move(state.dragging(), { x: 1, y: 3 }), noImpact),
            ownProps,
          ),
        ).toBe(defaultMapProps);
        expect(
          selector(
            withImpact(move(state.dragging(), { x: 1, y: 4 }), noImpact),
            ownProps,
          ),
        ).toBe(defaultMapProps);
      });

      it('should not break memoization moving between different dragging phases', () => {
        const selector: Selector = makeMapStateToProps();
        const defaultMapProps: MapProps = selector(state.idle, ownProps);

        expect(selector(withImpact(state.dragging(), noImpact), ownProps)).toBe(
          defaultMapProps,
        );
        expect(
          selector(withImpact(state.collecting(), noImpact), ownProps),
        ).toBe(defaultMapProps);
        expect(
          selector(withImpact(state.dropPending(), noImpact), ownProps),
        ).toBe(defaultMapProps);
      });
    });

    describe('being displaced by drag', () => {
      const inHome2Location: DraggableLocation = {
        index: preset.inHome2.descriptor.index,
        droppableId: preset.home.descriptor.id,
      };
      it('should move out backwards of the way', () => {
        const displaced: Displacement[] = [
          {
            draggableId: ownProps.draggableId,
            isVisible: true,
            shouldAnimate: true,
          },
        ];
        const impact: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            amount: inHome1Amount,
            isInFrontOfStart: true,
          },
          direction: preset.home.axis.direction,
          destination: inHome2Location,
          group: null,
        };
        const impacted: IsDraggingState = withImpact(current, impact);

        const selector: Selector = makeMapStateToProps();

        const expected: MapProps = {
          isDropAnimating: false,
          dropDuration: 0,
          isDragging: false,
          // inHome2 will be moving backwards
          offset: negate(inHome1Amount),
          shouldAnimateDisplacement: true,
          // not relevant
          shouldAnimateDragMovement: false,
          dimension: null,
          draggingOver: null,
          groupingWith: null,
          groupedOverBy: null,
        };
        expect(selector(impacted, ownProps)).toEqual(expected);
      });

      it('should move out forwards of the way', () => {
        const selector: Selector = makeMapStateToProps();
        const displaced: Displacement[] = [
          {
            draggableId: ownProps.draggableId,
            isVisible: true,
            shouldAnimate: true,
          },
        ];
        const impact: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            amount: inHome1Amount,
            // does not make a lot of sense in this case, but this is fine
            isInFrontOfStart: false,
          },
          direction: preset.home.axis.direction,
          destination: inHome2Location,
          group: null,
        };
        const impacted: IsDraggingState = withImpact(current, impact);

        const expected: MapProps = {
          isDropAnimating: false,
          dropDuration: 0,
          isDragging: false,
          // inHome2 will be moving forwards
          offset: inHome1Amount,
          shouldAnimateDisplacement: true,
          // not relevant
          shouldAnimateDragMovement: false,
          dimension: null,
          draggingOver: null,
          groupingWith: null,
          groupedOverBy: null,
        };
        expect(selector(impacted, ownProps)).toEqual(expected);
      });

      it('should animate displacement if requested', () => {
        const selector: Selector = makeMapStateToProps();
        const displaceWithAnimation: Displacement[] = [
          {
            draggableId: ownProps.draggableId,
            isVisible: true,
            shouldAnimate: true,
          },
        ];
        const displaceWithoutAnimation: Displacement[] = [
          {
            draggableId: ownProps.draggableId,
            isVisible: true,
            shouldAnimate: false,
          },
        ];
        const withAnimation: DragImpact = {
          movement: {
            displaced: displaceWithAnimation,
            map: getDisplacementMap(displaceWithAnimation),
            amount: inHome1Amount,
            isInFrontOfStart: true,
          },
          direction: preset.home.axis.direction,
          destination: inHome2Location,
          group: null,
        };
        const withoutAnimation: DragImpact = {
          ...withAnimation,
          movement: {
            ...withAnimation.movement,
            displaced: displaceWithoutAnimation,
            map: getDisplacementMap(displaceWithoutAnimation),
          },
        };

        const first: MapProps = selector(
          withImpact(current, withAnimation),
          ownProps,
        );
        const second: MapProps = selector(
          withImpact(current, withoutAnimation),
          ownProps,
        );

        expect(first.shouldAnimateDisplacement).toBe(true);
        expect(second.shouldAnimateDisplacement).toBe(false);
      });

      it('should not move if displacement is not visible, and not break memoization', () => {
        const selector: Selector = makeMapStateToProps();
        const defaultMapProps: MapProps = selector(state.idle, ownProps);

        const displaced: Displacement[] = [
          {
            draggableId: ownProps.draggableId,
            isVisible: false,
            shouldAnimate: false,
          },
        ];
        const impact: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            amount: inHome1Amount,
            isInFrontOfStart: true,
          },
          direction: preset.home.axis.direction,
          destination: inHome2Location,
          group: null,
        };
        const impacted: IsDraggingState = withImpact(current, impact);

        // testing value and also that memoization has not broken
        expect(selector(impacted, ownProps)).toBe(defaultMapProps);
      });

      it('should not break memoization on multiple calls', () => {
        const selector: Selector = makeMapStateToProps();
        const displaced: Displacement[] = [
          {
            draggableId: ownProps.draggableId,
            isVisible: true,
            shouldAnimate: true,
          },
        ];
        const impact: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            amount: inHome1Amount,
            isInFrontOfStart: true,
          },
          direction: preset.home.axis.direction,
          destination: inHome2Location,
          group: null,
        };
        const first: MapProps = selector(withImpact(current, impact), ownProps);

        const expected: MapProps = {
          isDropAnimating: false,
          isDragging: false,
          dropDuration: 0,
          offset: negate(inHome1Amount),
          shouldAnimateDisplacement: true,
          // not relevant
          shouldAnimateDragMovement: false,
          dimension: null,
          draggingOver: null,
          groupingWith: null,
          groupedOverBy: null,
        };
        expect(first).toEqual(expected);

        // another call with an impact of the same value
        expect(selector(withImpact(current, impact), ownProps)).toBe(first);

        const secondDisplacement: Displacement[] = [
          // moved further forward an inHome3 has now moved
          {
            draggableId: preset.inHome3.descriptor.id,
            isVisible: true,
            shouldAnimate: true,
          },
          // still impacted (what we care about)
          {
            draggableId: ownProps.draggableId,
            isVisible: true,
            shouldAnimate: true,
          },
        ];
        const secondImpact: DragImpact = {
          movement: {
            displaced: secondDisplacement,
            map: getDisplacementMap(secondDisplacement),
            amount: inHome1Amount,
            isInFrontOfStart: true,
          },
          direction: preset.home.axis.direction,
          destination: {
            index: preset.inHome1.descriptor.index,
            droppableId: preset.home.descriptor.id,
          },
          group: null,
        };

        expect(selector(withImpact(current, secondImpact), ownProps)).toBe(
          first,
        );
      });

      it('should not break memoization moving between different dragging phases', () => {
        const selector: Selector = makeMapStateToProps();
        const displaced: Displacement[] = [
          {
            draggableId: ownProps.draggableId,
            isVisible: true,
            shouldAnimate: true,
          },
        ];
        const impact: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            amount: inHome1Amount,
            isInFrontOfStart: true,
          },
          direction: preset.home.axis.direction,
          destination: inHome2Location,
          group: null,
        };

        const first: MapProps = selector(
          withImpact(state.dragging(), impact),
          ownProps,
        );
        const second: MapProps = selector(
          withImpact(state.collecting(), impact),
          ownProps,
        );
        const third: MapProps = selector(
          withImpact(state.dropPending(), impact),
          ownProps,
        );

        expect(first).toBe(second);
        expect(second).toBe(third);
      });
    });
  });
});

describe('something else impacted by drag (testing for memoization leaks)', () => {
  it('should not break memoization moving between different dragging phases', () => {
    const selector: Selector = makeMapStateToProps();
    const inHome3OwnProps: OwnProps = getOwnProps(preset.inHome3);
    const displaced: Displacement[] = [
      {
        draggableId: preset.inHome2.descriptor.id,
        isVisible: true,
        shouldAnimate: true,
      },
    ];
    const impact: DragImpact = {
      movement: {
        // moving inHome2 - no impact on inHome3
        displaced,
        map: getDisplacementMap(displaced),
        amount: inHome1Amount,
        isInFrontOfStart: true,
      },
      direction: preset.home.axis.direction,
      destination: {
        index: preset.inHome2.descriptor.index,
        droppableId: preset.home.descriptor.id,
      },
      group: null,
    };
    const defaultMapProps: MapProps = selector(state.idle, inHome3OwnProps);

    const first: MapProps = selector(
      withImpact(state.dragging(), impact),
      inHome3OwnProps,
    );
    const second: MapProps = selector(
      withImpact(state.collecting(), impact),
      inHome3OwnProps,
    );
    const third: MapProps = selector(
      withImpact(state.dropPending(), impact),
      inHome3OwnProps,
    );

    expect(first).toBe(defaultMapProps);
    expect(second).toBe(defaultMapProps);
    expect(third).toBe(defaultMapProps);
  });
});
