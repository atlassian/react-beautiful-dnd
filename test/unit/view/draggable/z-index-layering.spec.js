// @flow
import { zIndexOptions } from '../../../../src/view/draggable/draggable';
import mount from './util/mount';
import { whileDragging, whileDropping, atRestMapProps } from './util/get-props';

const dragging = mount({
  mapProps: whileDragging,
});
const dropping = mount({
  mapProps: whileDropping,
});
const resting = mount({
  mapProps: atRestMapProps,
});

it('should render a dragging item on top of a not dragging item', () => {
  expect(dragging.find('.item').props().style.zIndex).toBe(
    zIndexOptions.dragging,
  );
  expect(dragging.find('.item').props().style.position).toBe('fixed');
  // no z-index on resting item
  expect(resting.find('.item').props().style).not.toHaveProperty('zIndex');
});

it('should render a dropping item on top of an item that not dragging', () => {
  expect(dropping.find('.item').props().style.zIndex).toBe(
    zIndexOptions.dropAnimating,
  );
  expect(dropping.find('.item').props().style.position).toBe('fixed');
  // no z-index on resting item
  expect(resting.find('.item').props().style).not.toHaveProperty('zIndex');
});

it('should render a dragging item on top of an item that is dropping', () => {
  const drop: number = dropping.find('.item').props().style.zIndex;
  const drag: number = dragging.find('.item').props().style.zIndex;

  expect(drag).toBeGreaterThan(drop);
});
