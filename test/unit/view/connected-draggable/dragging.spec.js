// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import getHomeImpact from '../../../../src/state/get-home-impact';
import noImpact from '../../../../src/state/no-impact';
import getStatePreset from '../../../utils/get-simple-state-preset';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import {
  move,
  draggingStates,
  withImpact,
  type IsDraggingState,
} from '../../../utils/dragging-state';
import getOwnProps from './get-own-props';

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
        isDropAnimating: false,
        dropDuration: 0,
        isDragging: true,
        offset: { x: 20, y: 30 },
        shouldAnimateDragMovement: false,
        shouldAnimateDisplacement: false,
        dimension: preset.inHome1,
        draggingOver: preset.home.descriptor.id,
        groupingWith: null,
        groupedOverBy: null,
      };
      expect(result).toEqual(expected);
    });

    it('should control drag animation', () => {
      const selector: Selector = makeMapStateToProps();
      const withAnimation: IsDraggingState = ({
        ...current,
        shouldAnimate: true,
      }: any);

      expect(selector(withAnimation, ownProps).shouldAnimateDragMovement).toBe(
        true,
      );

      const withoutAnimation: IsDraggingState = ({
        ...current,
        shouldAnimate: false,
      }: any);

      expect(
        selector(withoutAnimation, ownProps).shouldAnimateDragMovement,
      ).toBe(false);
    });

    it('should indicate when over a droppable', () => {
      const selector: Selector = makeMapStateToProps();

      const inHome: IsDraggingState = withImpact(
        current,
        getHomeImpact(state.critical, preset.dimensions),
      );
      const noWhere: IsDraggingState = withImpact(current, noImpact);

      expect(selector(inHome, ownProps).draggingOver).toBe(
        state.critical.droppable.id,
      );
      expect(selector(noWhere, ownProps).draggingOver).toBe(null);
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
