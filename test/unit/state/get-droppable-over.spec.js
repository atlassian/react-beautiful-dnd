// @flow
import { type Position } from 'css-box-model';
import getDroppableOver from '../../../src/state/get-droppable-over';
import {
  disableDroppable,
  getDroppableDimension,
  getPreset,
} from '../../util/dimension';
import type {
  DraggableId,
  DraggableDimension,
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
} from '../../../src/types';

const preset = getPreset();

// Most functionality is tested by get get\InsideDimension
describe('get droppable over', () => {
  it('should return null if the target is not over any dimension', () => {
    const target: Position = {
      x: 100000,
      y: 100000,
    };

    const result: ?DroppableId = getDroppableOver({
      target,
      droppables: preset.droppables,
    });

    expect(result).toBe(null);
  });

  it('should return the id of the droppable that the target is over', () => {
    Object.keys(preset.draggables).forEach((id: DraggableId) => {
      const draggable: DraggableDimension = preset.draggables[id];

      const result: ?DroppableId = getDroppableOver({
        target: draggable.page.borderBox.center,
        droppables: preset.droppables,
      });

      expect(result).toBe(draggable.descriptor.droppableId);
    });
  });

  it('should ignore droppables that are disabled', () => {
    const target: Position = preset.inHome1.page.borderBox.center;
    const withDisabled: DroppableDimensionMap = {
      ...preset.droppables,
      [preset.home.descriptor.id]: disableDroppable(preset.home),
    };

    const whileEnabled: ?DroppableId = getDroppableOver({
      target,
      droppables: preset.droppables,
    });
    const whileDisabled: ?DroppableId = getDroppableOver({
      target,
      droppables: withDisabled,
    });

    expect(whileEnabled).toBe(preset.home.descriptor.id);
    expect(whileDisabled).toBe(null);
  });

  it('should ignore droppables that are partially hidden by their frames', () => {
    const droppable: DroppableDimension = getDroppableDimension({
      descriptor: {
        id: 'partially hidden subject',
        type: 'TYPE',
        mode: 'STANDARD',
      },
      borderBox: {
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      },
      closest: {
        // will partially hide the subject
        borderBox: {
          top: 0,
          left: 0,
          right: 50,
          bottom: 100,
        },
        scrollSize: {
          scrollHeight: 100,
          scrollWidth: 100,
        },
        scroll: { x: 0, y: 0 },
        shouldClipSubject: true,
      },
    });

    const result: ?DroppableId = getDroppableOver({
      // over the hidden part of the droppable subject
      target: { x: 60, y: 50 },
      droppables: { [droppable.descriptor.id]: droppable },
    });

    expect(result).toBe(null);
  });

  it('should ignore droppables that are totally hidden by their frames', () => {
    const droppable: DroppableDimension = getDroppableDimension({
      descriptor: {
        id: 'hidden subject',
        type: 'TYPE',
        mode: 'STANDARD',
      },
      borderBox: {
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      },
      closest: {
        // will totally hide the subject
        borderBox: {
          top: 0,
          // cutting off on horizontal plane
          left: 101,
          right: 200,
          bottom: 200,
        },
        scrollSize: {
          scrollHeight: 100,
          scrollWidth: 200,
        },
        scroll: { x: 0, y: 0 },
        shouldClipSubject: true,
      },
    });

    // totally hidden
    expect(droppable.subject.active).toBe(null);
    const result: ?DroppableId = getDroppableOver({
      target: { x: 50, y: 50 },
      droppables: { [droppable.descriptor.id]: droppable },
    });

    expect(result).toBe(null);
  });
});
