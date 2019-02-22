// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import noImpact from '../../../../src/state/no-impact';
import getStatePreset from '../../../utils/get-simple-state-preset';
import getDisplacementMap from '../../../../src/state/get-displacement-map';
import {
  draggingStates,
  withImpact,
  move,
  type IsDraggingState,
} from '../../../utils/dragging-state';
import getOwnProps from './util/get-own-props';
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
  DisplacedBy,
} from '../../../../src/types';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import getNotAnimatedDisplacement from '../../../utils/get-displacement/get-not-animated-displacement';
import getVisibleDisplacement from '../../../utils/get-displacement/get-visible-displacement';
import getNotVisibleDisplacement from '../../../utils/get-displacement/get-not-visible-displacement';
import getHomeLocation from '../../../../src/state/get-home-location';
import cloneImpact from '../../../utils/clone-impact';

const preset = getPreset();
const state = getStatePreset();
const ownProps: OwnProps = getOwnProps(preset.inHome2);
const axis: Axis = preset.home.axis;
const inHome1Location: DraggableLocation = getHomeLocation(
  preset.inHome1.descriptor,
);
const displacedBy: DisplacedBy = getDisplacedBy(
  axis,
  preset.inHome1.displaceBy,
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
      it('should move out of the way (no animation)', () => {
        const selector: Selector = makeMapStateToProps();
        const displaced: Displacement[] = [
          getNotAnimatedDisplacement(preset.inHome2),
          getNotAnimatedDisplacement(preset.inHome3),
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const impact: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          direction: preset.home.axis.direction,
          destination: inHome1Location,
          merge: null,
        };
        const impacted: IsDraggingState = withImpact(current, impact);

        const expected: MapProps = {
          dragging: null,
          secondary: {
            shouldAnimateDisplacement: false,
            offset: displacedBy.point,
            combineTargetFor: null,
          },
        };
        expect(selector(impacted, ownProps)).toEqual(expected);
      });

      it('should move out of the way (with animation)', () => {
        const selector: Selector = makeMapStateToProps();
        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inHome2),
          getVisibleDisplacement(preset.inHome3),
          getVisibleDisplacement(preset.inHome4),
        ];
        const impact: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          direction: preset.home.axis.direction,
          destination: inHome1Location,
          merge: null,
        };
        const impacted: IsDraggingState = withImpact(current, impact);

        const expected: MapProps = {
          dragging: null,
          secondary: {
            shouldAnimateDisplacement: true,
            offset: displacedBy.point,
            combineTargetFor: null,
          },
        };
        expect(selector(impacted, ownProps)).toEqual(expected);
      });

      it('should not move if displacement is not visible, and not break memoization', () => {
        const selector: Selector = makeMapStateToProps();
        const defaultMapProps: MapProps = selector(state.idle, ownProps);

        const displaced: Displacement[] = [
          getNotVisibleDisplacement(preset.inHome2),
          getNotVisibleDisplacement(preset.inHome3),
          getNotVisibleDisplacement(preset.inHome4),
        ];
        const impact: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          direction: preset.home.axis.direction,
          destination: inHome1Location,
          merge: null,
        };
        const impacted: IsDraggingState = withImpact(current, impact);

        // testing value and also that memoization has not broken
        expect(selector(impacted, ownProps)).toBe(defaultMapProps);
      });

      it('should not break memoization on multiple calls', () => {
        const selector: Selector = makeMapStateToProps();
        const displaced: Displacement[] = [
          getVisibleDisplacement(preset.inHome2),
          getVisibleDisplacement(preset.inHome3),
          getVisibleDisplacement(preset.inHome4),
        ];
        const impact: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          direction: preset.home.axis.direction,
          destination: inHome1Location,
          merge: null,
        };
        const first: MapProps = selector(withImpact(current, impact), ownProps);

        const expected: MapProps = {
          dragging: null,
          secondary: {
            offset: displacedBy.point,
            shouldAnimateDisplacement: true,
            combineTargetFor: null,
          },
        };
        expect(first).toEqual(expected);

        expect(
          selector(withImpact(current, cloneImpact(impact)), ownProps),
        ).toBe(first);
        expect(
          selector(withImpact(current, cloneImpact(impact)), ownProps),
        ).toBe(first);
        expect(
          selector(withImpact(current, cloneImpact(impact)), ownProps),
        ).toBe(first);
      });

      it('should not break memoization moving between different dragging phases', () => {
        const selector: Selector = makeMapStateToProps();
        const displaced: Displacement[] = [
          getNotAnimatedDisplacement(preset.inHome2),
          getNotAnimatedDisplacement(preset.inHome3),
          getNotAnimatedDisplacement(preset.inHome4),
        ];
        const impact: DragImpact = {
          movement: {
            displaced,
            map: getDisplacementMap(displaced),
            displacedBy,
          },
          direction: preset.home.axis.direction,
          destination: inHome1Location,
          merge: null,
        };

        const first: MapProps = selector(
          withImpact(state.dragging(), cloneImpact(impact)),
          ownProps,
        );
        const second: MapProps = selector(
          withImpact(state.collecting(), cloneImpact(impact)),
          ownProps,
        );
        const third: MapProps = selector(
          withImpact(state.dropPending(), cloneImpact(impact)),
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
    const displaced: Displacement[] = [
      getNotAnimatedDisplacement(preset.inHome2),
      getNotAnimatedDisplacement(preset.inHome3),
      getNotAnimatedDisplacement(preset.inHome4),
    ];
    const impact: DragImpact = {
      movement: {
        displaced,
        map: getDisplacementMap(displaced),
        displacedBy,
      },
      direction: preset.home.axis.direction,
      destination: inHome1Location,
      merge: null,
    };
    // drag should have no impact on inForeign1
    const unrelatedToDrag: OwnProps = getOwnProps(preset.inForeign1);
    const unrelatedDefault: MapProps = selector(state.idle, unrelatedToDrag);

    const first: MapProps = selector(
      withImpact(state.dragging(), impact),
      unrelatedToDrag,
    );
    const second: MapProps = selector(
      withImpact(state.collecting(), impact),
      unrelatedToDrag,
    );
    const third: MapProps = selector(
      withImpact(state.dropPending(), impact),
      unrelatedToDrag,
    );

    expect(first).toBe(unrelatedDefault);
    expect(second).toBe(unrelatedDefault);
    expect(third).toBe(unrelatedDefault);
  });
});
