// @flow
import getDraggablesInsideDroppable from '../../../src/state/get-draggables-inside-droppable';
import scrollDroppable from '../../../src/state/droppable/scroll-droppable';
import { getPreset, makeScrollable } from '../../util/dimension';
import type {
  DraggableDimension,
  DroppableDimension,
} from '../../../src/types';

const preset = getPreset();

describe('get draggables inside a droppable', () => {
  it('should only return dimensions that are inside a droppable', () => {
    const result: DraggableDimension[] = getDraggablesInsideDroppable(
      preset.home.descriptor.id,
      preset.draggables,
    );

    expect(result).toEqual(preset.inHomeList);
  });

  it('should order the dimensions by index', () => {
    const result: DraggableDimension[] = getDraggablesInsideDroppable(
      preset.home.descriptor.id,
      preset.draggables,
    );

    expect(result).toEqual([
      preset.inHome1,
      preset.inHome2,
      preset.inHome3,
      preset.inHome4,
    ]);
  });

  it('should memoize by the id and not the object reference', () => {
    const first: DraggableDimension[] = getDraggablesInsideDroppable(
      preset.home.descriptor.id,
      preset.draggables,
    );
    // even though we are scrolling the droppable (new reference) we are maintaining memoization
    const scrolledHome: DroppableDimension = scrollDroppable(
      makeScrollable(preset.home),
      { x: 10, y: 20 },
    );
    const second: DraggableDimension[] = getDraggablesInsideDroppable(
      scrolledHome.descriptor.id,
      preset.draggables,
    );

    expect(first).toBe(second);
  });
});
