// @flow
import getInitialImpact from '../../../src/state/get-initial-impact';
import getDroppableWithDraggables from '../../utils/get-droppable-with-draggables';
import { getDraggableDimension } from '../../../src/state/dimension';
import getClientRect from '../../../src/state/get-client-rect';
import { noMovement } from '../../../src/state/no-impact';
import type { Result as Data } from '../../utils/get-droppable-with-draggables';
import type {
  DraggableDimensionMap,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
} from '../../../src/types';

const data: Data = getDroppableWithDraggables({
  droppableId: 'droppable',
  droppableRect: { top: 0, left: 0, right: 100, bottom: 100 },
  draggableRects: [
    { top: 0, left: 0, right: 100, bottom: 20 },
    { top: 20, left: 0, right: 100, bottom: 40 },
    { top: 40, left: 0, right: 100, bottom: 60 },
    { top: 60, left: 0, right: 100, bottom: 80 },
  ],
});

const droppable: DroppableDimension = data.droppable;
const draggables: DraggableDimensionMap = data.draggables;

describe('get initial impact', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('should return null if the draggable cannot be found in the droppable', () => {
    const mystery = getDraggableDimension({
      id: 'mystery',
      droppableId: 'some-cool-id',
      clientRect: getClientRect({
        top: 0, left: 100, right: 200, bottom: 20,
      }),
    });

    const result: ?DragImpact = getInitialImpact({
      draggable: mystery,
      droppable: data.droppable,
      draggables: data.draggables,
    });

    expect(result).toBe(null);
    expect(console.error).toHaveBeenCalled();
  });

  it('should return the initial location', () => {
    data.draggableDimensions.forEach((draggable: DraggableDimension, index: number) => {
      const expected: DragImpact = {
        movement: noMovement,
        direction: droppable.axis.direction,
        destination: {
          droppableId: droppable.id,
          index,
        },
      };
      const impact: ?DragImpact = getInitialImpact({
        draggable,
        droppable,
        draggables,
      });

      expect(impact).toEqual(expected);
    });
  });
});
