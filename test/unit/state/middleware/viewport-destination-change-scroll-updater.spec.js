// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import passThrough from './util/pass-through-middleware';
import middleware from '../../../../src/state/middleware/viewport-destination-change-scroll-updater';
import createStore from './util/create-store';
import {
  updateViewportScroll,
  initialPublish,
  moveDown,
  moveRight,
  clean,
  updateDroppableIsCombineEnabled,
  type UpdateViewportScrollArgs,
} from '../../../../src/state/action-creators';
import type { Store } from '../../../../src/state/store-types';
import type {
  Viewport,
  State,
  DragImpact,
  DroppableId,
} from '../../../../src/types';
import getMaxScroll from '../../../../src/state/get-max-scroll';
import { setViewport, setWindowScroll } from '../../../utils/viewport';
import { initialPublishArgs, preset } from '../../../utils/preset-action-args';
// import getViewport from '../../../../src/view/window/get-viewport';
import { origin, add } from '../../../../src/state/position';

// using viewport from initial publish args
const viewport: Viewport = initialPublishArgs.viewport;
const doc: ?HTMLElement = document.documentElement;
invariant(doc, 'Cannot find document');

const scrollHeight: number = viewport.frame.height;
const scrollWidth: number = viewport.frame.width;
doc.scrollHeight = scrollHeight;
doc.scrollWidth = scrollWidth;

beforeEach(() => {
  setViewport(viewport);
});

describe('not dragging', () => {
  it('should not update the max viewport scroll if no drag is occurring', () => {
    const mock = jest.fn();
    const store: Store = createStore(middleware, passThrough(mock));

    doc.scrollHeight = scrollHeight + 10;
    doc.scrollWidth = scrollWidth + 10;

    store.dispatch(clean());

    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(clean());
  });
});

it('should update if the max scroll position has changed and the destination has changed', () => {
  const mock = jest.fn();
  const store: Store = createStore(middleware, passThrough(mock));

  // now dragging
  store.dispatch(initialPublish(initialPublishArgs));
  {
    const current: State = store.getState();
    invariant(current.isDragging);
    expect(current.isDragging).toBe(true);
  }
  mock.mockClear();

  // change in scroll size
  doc.scrollHeight = scrollHeight + 10;
  doc.scrollWidth = scrollWidth + 10;

  const newMax: Position = getMaxScroll({
    height: viewport.frame.height,
    width: viewport.frame.width,
    scrollHeight: scrollHeight + 10,
    scrollWidth: scrollWidth + 10,
  });
  const expected: UpdateViewportScrollArgs = {
    max: newMax,
    shift: origin,
    current: viewport.scroll.current,
  };
  // changing droppable
  store.dispatch(moveRight());
  expect(mock).toHaveBeenCalledTimes(2);
  expect(mock).toHaveBeenCalledWith(moveRight());
  expect(mock).toHaveBeenCalledWith(updateViewportScroll(expected));
});

it('should update if the current scroll position has changed and the destination has changed', () => {
  const mock = jest.fn();
  const store: Store = createStore(middleware, passThrough(mock));

  // now dragging
  store.dispatch(initialPublish(initialPublishArgs));
  {
    const current: State = store.getState();
    invariant(current.isDragging);
    expect(current.isDragging).toBe(true);
  }
  mock.mockClear();

  // change in scroll
  const shift: Position = { x: 10, y: 20 };
  const newScroll: Position = add(viewport.scroll.current, shift);
  setWindowScroll(newScroll);

  const expected: UpdateViewportScrollArgs = {
    max: viewport.scroll.max,
    shift,
    current: newScroll,
  };
  // changing droppable
  store.dispatch(moveRight());
  expect(mock).toHaveBeenCalledTimes(2);
  expect(mock).toHaveBeenCalledWith(moveRight());
  expect(mock).toHaveBeenCalledWith(updateViewportScroll(expected));
});

it('should not update if the max and current scroll have not changed and destination has', () => {
  const mock = jest.fn();
  const store: Store = createStore(middleware, passThrough(mock));

  // now dragging
  store.dispatch(initialPublish(initialPublishArgs));
  {
    const current: State = store.getState();
    invariant(current.isDragging);
    expect(current.isDragging).toBe(true);
  }
  mock.mockClear();

  // no change in scroll but there is a change in destination
  store.dispatch(moveRight());
  expect(mock).toHaveBeenCalledWith(moveRight());
  expect(mock).toHaveBeenCalledTimes(1);
});

it('should not update if the destination has not changed (even if the scroll size has changed)', () => {
  // the scroll size should not change in response to a drag if the destination has not changed
  const mock = jest.fn();
  const store: Store = createStore(middleware, passThrough(mock));

  // now dragging
  store.dispatch(initialPublish(initialPublishArgs));
  {
    const current: State = store.getState();
    invariant(current.isDragging);
    expect(current.isDragging).toBe(true);
  }
  mock.mockClear();

  // change in scroll size
  doc.scrollHeight = scrollHeight + 10;
  doc.scrollWidth = scrollWidth + 10;

  // not changing droppable
  store.dispatch(moveDown());
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenCalledWith(moveDown());
});

it('should not update if moving from a reorder to combine in the same list', () => {
  // the scroll size should not change in response to a drag if the destination has not changed
  const mock = jest.fn();
  const store: Store = createStore(middleware, passThrough(mock));
  const homeId: DroppableId = preset.home.descriptor.id;

  // now dragging
  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(
    updateDroppableIsCombineEnabled({
      id: homeId,
      isCombineEnabled: true,
    }),
  );
  // validation
  {
    const current: State = store.getState();
    invariant(current.isDragging);
    expect(current.isDragging).toBe(true);
    expect(current.dimensions.droppables[homeId].isCombineEnabled).toBe(true);
  }
  mock.mockClear();

  // change in scroll size - checking that this is not recorded
  doc.scrollHeight = scrollHeight + 10;
  doc.scrollWidth = scrollWidth + 10;

  // not changing droppable
  store.dispatch(moveDown());
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenCalledWith(moveDown());

  // validation: moved to combine impact
  {
    const current: State = store.getState();
    invariant(current.isDragging);
    const impact: DragImpact = current.impact;
    expect(impact.merge && impact.merge.combine.droppableId).toBe(homeId);
  }
});

it('should change if moving from combine to another list', () => {
  const mock = jest.fn();
  const store: Store = createStore(middleware, passThrough(mock));
  const homeId: DroppableId = preset.home.descriptor.id;

  // now dragging
  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(
    updateDroppableIsCombineEnabled({
      id: homeId,
      isCombineEnabled: true,
    }),
  );
  mock.mockClear();

  // change in scroll size - checking that this is not recorded
  // (we would want this recorded, but this is just to show that we did not read from the DOM)
  doc.scrollHeight = scrollHeight + 10;
  doc.scrollWidth = scrollWidth + 10;

  // moving to a combine
  store.dispatch(moveDown());
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenCalledWith(moveDown());
  mock.mockClear();
  {
    const current: State = store.getState();
    invariant(current.isDragging);
    const impact: DragImpact = current.impact;
    expect(impact.merge && impact.merge.combine.droppableId).toBe(homeId);
  }

  // change in max scroll
  doc.scrollHeight = scrollHeight + 20;
  doc.scrollWidth = scrollWidth + 20;

  const newMax: Position = getMaxScroll({
    height: viewport.frame.height,
    width: viewport.frame.width,
    scrollHeight: scrollHeight + 20,
    scrollWidth: scrollWidth + 20,
  });
  const expected: UpdateViewportScrollArgs = {
    max: newMax,
    shift: origin,
    current: viewport.scroll.current,
  };
  // changing droppable
  store.dispatch(moveRight());
  expect(mock).toHaveBeenCalledTimes(2);
  expect(mock).toHaveBeenCalledWith(moveRight());
  expect(mock).toHaveBeenCalledWith(updateViewportScroll(expected));
});
