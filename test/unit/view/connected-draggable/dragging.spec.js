// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import noImpact from '../../../../src/state/no-impact';
import getStatePreset from '../../../utils/get-simple-state-preset';
import type {
  Selector,
  OwnProps,
  MapProps,
  DraggingMapProps,
} from '../../../../src/view/draggable/draggable-types';
import {
  move,
  draggingStates,
  withImpact,
  type IsDraggingState,
} from '../../../utils/dragging-state';
import getOwnProps from './util/get-own-props';
import getDraggingMapProps from './util/get-dragging-map-props';
import getHomeOnLift from '../../../../src/state/get-home-on-lift';

const preset = getPreset();
const state = getStatePreset();
const ownProps: OwnProps = getOwnProps(preset.inHome1);

draggingStates.forEach((current: IsDraggingState) => {
  describe(`in phase: ${current.phase}`, () => {
    it('should move the dragging item to the current offset', () => {
      const selector: Selector = makeMapStateToProps();

      const result: MapProps = selector(
        move(current, { x: 20, y: 30 }),
        ownProps,
      );

      const expected: MapProps = {
        dragging: {
          offset: { x: 20, y: 30 },
          mode: 'FLUID',
          dimension: preset.inHome1,
          draggingOver: preset.home.descriptor.id,
          dropping: null,
          combineWith: null,
          forceShouldAnimate: null,
        },
        secondary: null,
      };
      expect(result).toEqual(expected);
    });

    it('should allow force control of drag animation', () => {
      const selector: Selector = makeMapStateToProps();

      expect(
        getDraggingMapProps(selector(current, ownProps)).forceShouldAnimate,
      ).toBe(null);

      const withAnimation: IsDraggingState = ({
        ...current,
        forceShouldAnimate: true,
      }: any);

      expect(
        getDraggingMapProps(selector(withAnimation, ownProps))
          .forceShouldAnimate,
      ).toBe(true);

      const withoutAnimation: IsDraggingState = ({
        ...current,
        forceShouldAnimate: false,
      }: any);

      expect(
        getDraggingMapProps(selector(withoutAnimation, ownProps))
          .forceShouldAnimate,
      ).toBe(false);
    });

    it('should indicate when over a droppable', () => {
      const selector: Selector = makeMapStateToProps();
      const { impact: homeImpact } = getHomeOnLift({
        draggable: preset.inHome1,
        draggables: preset.draggables,
        viewport: preset.viewport,
        home: preset.home,
      });

      const inHome: IsDraggingState = withImpact(current, homeImpact);
      const overHome: DraggingMapProps = getDraggingMapProps(
        selector(inHome, ownProps),
      );
      const noWhere: IsDraggingState = withImpact(current, noImpact);
      const overNothing: DraggingMapProps = getDraggingMapProps(
        selector(noWhere, ownProps),
      );

      expect(overHome.draggingOver).toBe(state.critical.droppable.id);
      expect(overNothing.draggingOver).toBe(null);
    });

    it('should not break memoization on multiple calls to the same offset', () => {
      const selector: Selector = makeMapStateToProps();

      const result1: MapProps = selector(
        move(current, { x: 100, y: 200 }),
        ownProps,
      );
      const result2: MapProps = selector(
        move(current, { x: 100, y: 200 }),
        ownProps,
      );

      expect(result1).toBe(result2);

      // also checking with new top level reference
      const newCurrent: IsDraggingState = ({ ...current }: any);
      const result3: MapProps = selector(
        move(newCurrent, { x: 100, y: 200 }),
        ownProps,
      );

      expect(result1).toBe(result3);
    });

    it('should break memoization on multiple calls if moving to a new offset', () => {
      const selector: Selector = makeMapStateToProps();

      const result1: MapProps = selector(
        move(current, { x: 100, y: 200 }),
        ownProps,
      );
      const result2: MapProps = selector(
        move(current, { x: 101, y: 200 }),
        ownProps,
      );

      expect(result1).not.toBe(result2);
      expect(result1).not.toEqual(result2);
    });
  });
});

it('should not break memoization when moving between dragging phases', () => {
  const selector: Selector = makeMapStateToProps();

  const first: MapProps = selector(state.dragging(), ownProps);
  const second: MapProps = selector(state.collecting(), ownProps);
  const third: MapProps = selector(state.dropPending(), ownProps);

  expect(first).toBe(second);
  expect(second).toBe(third);
});
