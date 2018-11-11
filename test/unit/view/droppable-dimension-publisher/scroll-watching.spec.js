// @flow
import { mount } from 'enzyme';
import React from 'react';
import { type Position } from 'css-box-model';
import type {
  DimensionMarshal,
  DroppableCallbacks,
} from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import { getMarshalStub } from '../../../utils/dimension-marshal';
import { withDimensionMarshal } from '../../../utils/get-context-options';
import { setViewport } from '../../../utils/viewport';
import { immediate, preset, scheduled, ScrollableItem } from './util/shared';

const scroll = (el: HTMLElement, target: Position) => {
  el.scrollTop = target.y;
  el.scrollLeft = target.x;
  el.dispatchEvent(new Event('scroll'));
};

setViewport(preset.viewport);

describe('should immediately publish updates', () => {
  it('should immediately publish the scroll offset of the closest scrollable', () => {
    const marshal: DimensionMarshal = getMarshalStub();
    const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
    const container: HTMLElement = wrapper.getDOMNode();

    if (!container.classList.contains('scroll-container')) {
      throw new Error('incorrect dom node collected');
    }

    // tell the droppable to watch for scrolling
    const callbacks: DroppableCallbacks =
      marshal.registerDroppable.mock.calls[0][1];
    // watch scroll will only be called after the dimension is requested
    callbacks.getDimensionAndWatchScroll(preset.windowScroll, immediate);

    scroll(container, { x: 500, y: 1000 });

    expect(marshal.updateDroppableScroll).toHaveBeenCalledWith(
      preset.home.descriptor.id,
      { x: 500, y: 1000 },
    );
  });

  it('should not fire a scroll if the value has not changed since the previous call', () => {
    // this can happen if you scroll backward and forward super quick
    const marshal: DimensionMarshal = getMarshalStub();
    const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
    const container: HTMLElement = wrapper.getDOMNode();
    // tell the droppable to watch for scrolling
    const callbacks: DroppableCallbacks =
      marshal.registerDroppable.mock.calls[0][1];

    // watch scroll will only be called after the dimension is requested
    callbacks.getDimensionAndWatchScroll(preset.windowScroll, immediate);

    // first event
    scroll(container, { x: 500, y: 1000 });
    expect(marshal.updateDroppableScroll).toHaveBeenCalledTimes(1);
    expect(marshal.updateDroppableScroll).toHaveBeenCalledWith(
      preset.home.descriptor.id,
      { x: 500, y: 1000 },
    );
    marshal.updateDroppableScroll.mockReset();

    // second event - scroll to same spot
    scroll(container, { x: 500, y: 1000 });
    expect(marshal.updateDroppableScroll).not.toHaveBeenCalled();

    // third event - new value
    scroll(container, { x: 500, y: 1001 });
    expect(marshal.updateDroppableScroll).toHaveBeenCalledWith(
      preset.home.descriptor.id,
      { x: 500, y: 1001 },
    );
  });
});

describe('should schedule publish updates', () => {
  it('should publish the scroll offset of the closest scrollable', () => {
    const marshal: DimensionMarshal = getMarshalStub();
    const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
    const container: HTMLElement = wrapper.getDOMNode();

    if (!container.classList.contains('scroll-container')) {
      throw new Error('incorrect dom node collected');
    }

    // tell the droppable to watch for scrolling
    const callbacks: DroppableCallbacks =
      marshal.registerDroppable.mock.calls[0][1];
    // watch scroll will only be called after the dimension is requested
    callbacks.getDimensionAndWatchScroll(preset.windowScroll, scheduled);

    scroll(container, { x: 500, y: 1000 });
    // release the update animation frame
    requestAnimationFrame.step();

    expect(marshal.updateDroppableScroll).toHaveBeenCalledWith(
      preset.home.descriptor.id,
      { x: 500, y: 1000 },
    );
  });

  it('should throttle multiple scrolls into a animation frame', () => {
    const marshal: DimensionMarshal = getMarshalStub();
    const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
    const container: HTMLElement = wrapper.getDOMNode();
    // tell the droppable to watch for scrolling
    const callbacks: DroppableCallbacks =
      marshal.registerDroppable.mock.calls[0][1];

    // watch scroll will only be called after the dimension is requested
    callbacks.getDimensionAndWatchScroll(preset.windowScroll, scheduled);

    // first event
    scroll(container, { x: 500, y: 1000 });
    // second event in same frame
    scroll(container, { x: 200, y: 800 });

    // release the update animation frame
    requestAnimationFrame.step();

    expect(marshal.updateDroppableScroll).toHaveBeenCalledTimes(1);
    expect(marshal.updateDroppableScroll).toHaveBeenCalledWith(
      preset.home.descriptor.id,
      { x: 200, y: 800 },
    );

    // also checking that no loose frames are stored up
    requestAnimationFrame.flush();
    expect(marshal.updateDroppableScroll).toHaveBeenCalledTimes(1);
  });

  it('should not fire a scroll if the value has not changed since the previous frame', () => {
    // this can happen if you scroll backward and forward super quick
    const marshal: DimensionMarshal = getMarshalStub();
    const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
    const container: HTMLElement = wrapper.getDOMNode();
    // tell the droppable to watch for scrolling
    const callbacks: DroppableCallbacks =
      marshal.registerDroppable.mock.calls[0][1];

    // watch scroll will only be called after the dimension is requested
    callbacks.getDimensionAndWatchScroll(preset.windowScroll, scheduled);

    // first event
    scroll(container, { x: 500, y: 1000 });
    // release the frame
    requestAnimationFrame.step();
    expect(marshal.updateDroppableScroll).toHaveBeenCalledTimes(1);
    expect(marshal.updateDroppableScroll).toHaveBeenCalledWith(
      preset.home.descriptor.id,
      { x: 500, y: 1000 },
    );
    marshal.updateDroppableScroll.mockReset();

    // second event
    scroll(container, { x: 501, y: 1001 });
    // no frame to release change yet

    // third event - back to original value
    scroll(container, { x: 500, y: 1000 });
    // release the frame
    requestAnimationFrame.step();
    expect(marshal.updateDroppableScroll).not.toHaveBeenCalled();
  });

  it('should not publish a scroll update after requested not to update while an animation frame is occurring', () => {
    const marshal: DimensionMarshal = getMarshalStub();
    const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
    const container: HTMLElement = wrapper.getDOMNode();
    // tell the droppable to watch for scrolling
    const callbacks: DroppableCallbacks =
      marshal.registerDroppable.mock.calls[0][1];

    // watch scroll will only be called after the dimension is requested
    callbacks.getDimensionAndWatchScroll(preset.windowScroll, scheduled);

    // first event
    scroll(container, { x: 500, y: 1000 });
    requestAnimationFrame.step();
    expect(marshal.updateDroppableScroll).toHaveBeenCalledTimes(1);
    marshal.updateDroppableScroll.mockReset();

    // second event
    scroll(container, { x: 400, y: 100 });
    // no animation frame to release event fired yet

    // unwatching before frame fired
    callbacks.dragStopped();

    // flushing any frames
    requestAnimationFrame.flush();
    expect(marshal.updateDroppableScroll).not.toHaveBeenCalled();
  });
});

it('should stop watching scroll when no longer required to publish', () => {
  // this can happen if you scroll backward and forward super quick
  const marshal: DimensionMarshal = getMarshalStub();
  const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
  const container: HTMLElement = wrapper.getDOMNode();
  // tell the droppable to watch for scrolling
  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];

  // watch scroll will only be called after the dimension is requested
  callbacks.getDimensionAndWatchScroll(preset.windowScroll, immediate);

  // first event
  scroll(container, { x: 500, y: 1000 });
  expect(marshal.updateDroppableScroll).toHaveBeenCalledTimes(1);
  marshal.updateDroppableScroll.mockReset();

  callbacks.dragStopped();

  // scroll event after no longer watching
  scroll(container, { x: 190, y: 400 });
  expect(marshal.updateDroppableScroll).not.toHaveBeenCalled();
});

it('should stop watching for scroll events when the component is unmounted', () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const marshal: DimensionMarshal = getMarshalStub();
  const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
  const container: HTMLElement = wrapper.getDOMNode();
  // tell the droppable to watch for scrolling
  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];

  // watch scroll will only be called after the dimension is requested
  callbacks.getDimensionAndWatchScroll(preset.windowScroll, immediate);

  wrapper.unmount();

  // second event - will not fire any updates
  scroll(container, { x: 100, y: 300 });
  expect(marshal.updateDroppableScroll).not.toHaveBeenCalled();
  // also logs a warning
  expect(console.warn).toHaveBeenCalled();

  // cleanup
  console.warn.mockRestore();
});

it('should throw an error if asked to watch a scroll when already listening for scroll changes', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
  // tell the droppable to watch for scrolling
  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];

  // watch scroll will only be called after the dimension is requested
  const request = () =>
    callbacks.getDimensionAndWatchScroll(preset.windowScroll, immediate);
  request();
  expect(request).toThrow();

  // cleanup
  callbacks.dragStopped();
  wrapper.unmount();
});

// if this is not the case then it will break in IE11
it('should add and remove events with the same event options', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
  const container: HTMLElement = wrapper.getDOMNode();
  jest.spyOn(container, 'addEventListener');
  jest.spyOn(container, 'removeEventListener');

  // tell the droppable to watch for scrolling
  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];

  // watch scroll will only be called after the dimension is requested
  callbacks.getDimensionAndWatchScroll(preset.windowScroll, scheduled);

  // assertion
  const expectedOptions = {
    passive: true,
  };
  expect(container.addEventListener).toHaveBeenCalledWith(
    'scroll',
    expect.any(Function),
    expectedOptions,
  );
  expect(container.removeEventListener).not.toHaveBeenCalled();
  container.addEventListener.mockReset();

  // unwatching scroll
  callbacks.dragStopped();

  // assertion
  expect(container.removeEventListener).toHaveBeenCalledWith(
    'scroll',
    expect.any(Function),
    expectedOptions,
  );
  expect(container.removeEventListener).toHaveBeenCalledTimes(1);
  expect(container.addEventListener).not.toHaveBeenCalled();

  // cleanup
  container.addEventListener.mockRestore();
  container.removeEventListener.mockRestore();
});
