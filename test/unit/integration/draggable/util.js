// @flow
import { getRect } from 'css-box-model';
import {
  defaultItemRender,
  type RenderItem,
  type Item,
} from '../drag-handle/app';
import { getComputedSpacing } from '../../../utils/dimension';
import {
  type DraggableProvided,
  type DraggableStateSnapshot,
} from '../../../../src';

export const renderItemAndSpyOnSnapshot = (
  mock: JestMockFn<*, *>,
  forItemId?: string = '0',
): RenderItem => (item: Item) => {
  const render = defaultItemRender(item);
  return (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
    if (item.id === forItemId) {
      mock(snapshot);
    }
    return render(provided, snapshot);
  };
};

export const withPoorCombineDimensionMocks = (fn: () => void): void => {
  // lists and all items will have the same dimensions
  // This is so that when we move we are combining
  const protoSpy = jest
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(() =>
      getRect({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      }),
    );

  // Stubbing out totally - not including margins in this
  const styleSpy = jest
    .spyOn(window, 'getComputedStyle')
    .mockImplementation(() => getComputedSpacing({}));

  try {
    fn();
  } finally {
    protoSpy.mockRestore();
    styleSpy.mockRestore();
  }
};
