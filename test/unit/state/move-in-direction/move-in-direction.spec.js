// @flow
import type {
  DraggableLocation,
  DraggingState,
  DroppableDimension,
  Axis,
} from '../../../../src/types';
import { invariant } from '../../../../src/invariant';
import type { PublicResult } from '../../../../src/state/move-in-direction/move-in-direction-types';
import moveInDirection from '../../../../src/state/move-in-direction';
import { vertical, horizontal } from '../../../../src/state/axis';
import { getPreset, disableDroppable } from '../../../util/dimension';
import getStatePreset from '../../../util/get-simple-state-preset';
import { tryGetDestination } from '../../../../src/state/get-impact-location';

describe('on the vertical axis', () => {
  const preset = getPreset(vertical);
  const state = getStatePreset(vertical);
  const draggables = Object.keys(state.preset.dimensions.draggables);

  it('should move forward on a MOVE_DOWN', () => {
    const result: ?PublicResult = moveInDirection({
      state: state.dragging(),
      type: 'MOVE_DOWN',
    });

    invariant(result, 'expected a result');
    const idx = 1;
    const newDraggableId = draggables[idx];
    const expected: DraggableLocation = {
      droppableId: preset.home.descriptor.id,
      index: idx,
      draggableId: newDraggableId,
    };
    expect(tryGetDestination(result.impact)).toEqual(expected);
  });

  it('should move backwards on a MOVE_UP', () => {
    const result: ?PublicResult = moveInDirection({
      state: state.dragging(preset.inHome2.descriptor.id),
      type: 'MOVE_UP',
    });

    invariant(result, 'expected a result');
    const idx = 0;
    const newDraggableId = draggables[idx];
    const expected: DraggableLocation = {
      droppableId: preset.home.descriptor.id,
      index: idx,
      draggableId: newDraggableId,
    };
    expect(tryGetDestination(result.impact)).toEqual(expected);
  });

  it('should move cross axis forwards on a MOVE_RIGHT', () => {
    const result: ?PublicResult = moveInDirection({
      state: state.dragging(),
      type: 'MOVE_RIGHT',
    });

    invariant(result, 'expected a result');
    const expected: DraggableLocation = {
      droppableId: preset.foreign.descriptor.id,
      index: 1,
      draggableId: preset.inForeign2.descriptor.id,
    };
    expect(tryGetDestination(result.impact)).toEqual(expected);
  });

  it('should move cross axis backwards on a MOVE_LEFT', () => {
    const result: ?PublicResult = moveInDirection({
      state: state.dragging(preset.inForeign1.descriptor.id),
      type: 'MOVE_LEFT',
    });

    invariant(result, 'expected a result');
    const expected: DraggableLocation = {
      droppableId: preset.home.descriptor.id,
      index: 0,
      draggableId: preset.inHome1.descriptor.id,
    };
    expect(tryGetDestination(result.impact)).toEqual(expected);
  });
});

describe('on the horizontal axis', () => {
  const preset = getPreset(horizontal);
  const state = getStatePreset(horizontal);
  const draggables = Object.keys(state.preset.dimensions.draggables);

  it('should move forward on a MOVE_RIGHT', () => {
    const result: ?PublicResult = moveInDirection({
      state: state.dragging(),
      type: 'MOVE_RIGHT',
    });

    invariant(result, 'expected a result');
    const idx = 1;
    const newDraggableId = draggables[idx];
    const expected: DraggableLocation = {
      droppableId: preset.home.descriptor.id,
      index: idx,
      draggableId: newDraggableId,
    };
    expect(tryGetDestination(result.impact)).toEqual(expected);
  });

  it('should move backwards on a MOVE_LEFT', () => {
    const result: ?PublicResult = moveInDirection({
      state: state.dragging(preset.inHome2.descriptor.id),
      type: 'MOVE_LEFT',
    });

    invariant(result, 'expected a result');
    const idx = 0;
    const newDraggableId = draggables[idx];
    const expected: DraggableLocation = {
      droppableId: preset.home.descriptor.id,
      index: idx,
      draggableId: newDraggableId,
    };
    expect(tryGetDestination(result.impact)).toEqual(expected);
  });

  it('should move cross axis forwards on a MOVE_DOWN', () => {
    const result: ?PublicResult = moveInDirection({
      state: state.dragging(),
      type: 'MOVE_DOWN',
    });

    invariant(result, 'expected a result');
    const expected: DraggableLocation = {
      droppableId: preset.foreign.descriptor.id,
      index: 1,
      draggableId: preset.inForeign2.descriptor.id,
    };
    expect(tryGetDestination(result.impact)).toEqual(expected);
  });

  it('should move cross axis backwards on a MOVE_UP', () => {
    const result: ?PublicResult = moveInDirection({
      state: state.dragging(preset.inForeign1.descriptor.id),
      type: 'MOVE_UP',
    });

    invariant(result, 'expected a result');
    const idx = 0;
    const newDraggableId = draggables[idx];
    const expected: DraggableLocation = {
      droppableId: preset.home.descriptor.id,
      index: idx,
      draggableId: newDraggableId,
    };
    expect(tryGetDestination(result.impact)).toEqual(expected);
  });
});

[vertical, horizontal].forEach((axis: Axis) => {
  const state = getStatePreset(axis);
  const preset = getPreset(axis);

  describe(`main axis blocking in the ${axis.direction} direction`, () => {
    it('should not allow movement on the main axis if lifting in a disabled droppable', () => {
      const custom: DraggingState = state.dragging();

      // no destination when lifting in disabled droppable
      custom.impact.at = null;
      // disabling the droppable for good measure
      const critical: DroppableDimension =
        custom.dimensions.droppables[custom.critical.droppable.id];
      custom.dimensions.droppables[
        custom.critical.droppable.id
      ] = disableDroppable(critical);

      // Main axis movement not allowed
      const forward = axis.direction === 'vertical' ? 'MOVE_DOWN' : 'MOVE_LEFT';
      const backward = axis.direction === 'vertical' ? 'MOVE_UP' : 'MOVE_RIGHT';
      expect(
        moveInDirection({
          state: custom,
          type: forward,
        }),
      ).toBe(null);
      expect(
        moveInDirection({
          state: custom,
          type: backward,
        }),
      ).toBe(null);

      // cross axis movement allowed
      const crossAxisForward =
        axis.direction === 'vertical' ? 'MOVE_RIGHT' : 'MOVE_DOWN';

      const result: ?PublicResult = moveInDirection({
        state: state.dragging(),
        type: crossAxisForward,
      });

      invariant(result, 'expected a result');
      const expected: DraggableLocation = {
        droppableId: preset.foreign.descriptor.id,
        index: 1,
        draggableId: preset.inForeign2.descriptor.id,
      };
      expect(tryGetDestination(result.impact)).toEqual(expected);
    });
  });
});
