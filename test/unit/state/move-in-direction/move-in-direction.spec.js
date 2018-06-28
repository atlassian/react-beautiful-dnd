// @flow
import invariant from 'tiny-invariant';
import type { DraggableLocation } from '../../../../src/types';
import { vertical, horizontal } from '../../../../src/state/axis';
import { getPreset } from '../../../utils/dimension';
import getStatePreset from '../../../utils/get-simple-state-preset';
import moveInDirection, {
  type Result,
} from '../../../../src/state/move-in-direction';

describe('on the vertical axis', () => {
  const preset = getPreset(vertical);
  const state = getStatePreset(vertical);

  it('should move forward on a MOVE_DOWN', () => {
    const result: ?Result = moveInDirection({
      state: state.dragging(),
      action: 'MOVE_DOWN',
    });

    invariant(result, 'expected a result');
    const expected: DraggableLocation = {
      droppableId: preset.home.descriptor.id,
      index: 1,
    };
    expect(result.impact.destination).toEqual(expected);
  });

  it('should move backwards on a MOVE_UP', () => {
    const result: ?Result = moveInDirection({
      state: state.dragging(preset.inHome2.descriptor.id),
      action: 'MOVE_UP',
    });

    invariant(result, 'expected a result');
    const expected: DraggableLocation = {
      droppableId: preset.home.descriptor.id,
      index: 0,
    };
    expect(result.impact.destination).toEqual(expected);
  });

  it('should move cross axis forwards on a MOVE_RIGHT', () => {
    const result: ?Result = moveInDirection({
      state: state.dragging(),
      action: 'MOVE_RIGHT',
    });

    invariant(result, 'expected a result');
    const expected: DraggableLocation = {
      droppableId: preset.foreign.descriptor.id,
      index: 1,
    };
    expect(result.impact.destination).toEqual(expected);
  });

  it('should move cross axis backwards on a MOVE_LEFT', () => {
    const result: ?Result = moveInDirection({
      state: state.dragging(preset.inForeign1.descriptor.id),
      action: 'MOVE_LEFT',
    });

    invariant(result, 'expected a result');
    const expected: DraggableLocation = {
      droppableId: preset.home.descriptor.id,
      index: 1,
    };
    expect(result.impact.destination).toEqual(expected);
  });
});

describe('on the horizontal axis', () => {
  const preset = getPreset(horizontal);
  const state = getStatePreset(horizontal);

  it('should move forward on a MOVE_RIGHT', () => {
    const result: ?Result = moveInDirection({
      state: state.dragging(),
      action: 'MOVE_RIGHT',
    });

    invariant(result, 'expected a result');
    const expected: DraggableLocation = {
      droppableId: preset.home.descriptor.id,
      index: 1,
    };
    expect(result.impact.destination).toEqual(expected);
  });

  it('should move backwards on a MOVE_LEFT', () => {
    const result: ?Result = moveInDirection({
      state: state.dragging(preset.inHome2.descriptor.id),
      action: 'MOVE_LEFT',
    });

    invariant(result, 'expected a result');
    const expected: DraggableLocation = {
      droppableId: preset.home.descriptor.id,
      index: 0,
    };
    expect(result.impact.destination).toEqual(expected);
  });

  it('should move cross axis forwards on a MOVE_DOWN', () => {
    const result: ?Result = moveInDirection({
      state: state.dragging(),
      action: 'MOVE_DOWN',
    });

    invariant(result, 'expected a result');
    const expected: DraggableLocation = {
      droppableId: preset.foreign.descriptor.id,
      index: 1,
    };
    expect(result.impact.destination).toEqual(expected);
  });

  it('should move cross axis backwards on a MOVE_UP', () => {
    const result: ?Result = moveInDirection({
      state: state.dragging(preset.inForeign1.descriptor.id),
      action: 'MOVE_UP',
    });

    invariant(result, 'expected a result');
    const expected: DraggableLocation = {
      droppableId: preset.home.descriptor.id,
      index: 1,
    };
    expect(result.impact.destination).toEqual(expected);
  });
});
