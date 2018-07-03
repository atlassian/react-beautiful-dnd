// @flow
import getDraggablesInsideDroppable from '../../../src/state/get-draggables-inside-droppable';
import { getPreset } from '../../utils/dimension';
import type { DraggableDimension } from '../../../src/types';

const preset = getPreset();

describe('get draggables inside a droppable', () => {
  it('should only return dimensions that are inside a droppable', () => {
    const result: DraggableDimension[] = getDraggablesInsideDroppable(
      preset.home,
      preset.draggables,
    );

    expect(result).toEqual(preset.inHomeList);
  });

  it('should order the dimensions by index', () => {
    const result: DraggableDimension[] = getDraggablesInsideDroppable(
      preset.home,
      preset.draggables,
    );

    expect(result).toEqual([
      preset.inHome1,
      preset.inHome2,
      preset.inHome3,
      preset.inHome4,
    ]);
  });
});
