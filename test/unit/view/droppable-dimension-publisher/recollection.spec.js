// @flow
import { mount } from 'enzyme';
import invariant from 'tiny-invariant';
import React from 'react';
import type {
  DimensionMarshal,
  DroppableCallbacks,
} from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import type { DroppableDimension } from '../../../../src/types';
import { getDroppableDimension } from '../../../utils/dimension';
import { getMarshalStub } from '../../../utils/dimension-marshal';
import tryCleanPrototypeStubs from '../../../utils/try-clean-prototype-stubs';
import { setViewport } from '../../../utils/viewport';
import {
  App,
  bigClient,
  border,
  descriptor,
  immediate,
  margin,
  padding,
  preset,
  smallFrameClient,
  WithAppContext,
} from './util/shared';

beforeEach(() => {
  setViewport(preset.viewport);
});

afterEach(() => {
  tryCleanPrototypeStubs();
});

const expected: DroppableDimension = getDroppableDimension({
  descriptor,
  // as expected
  borderBox: bigClient.borderBox,
  margin,
  padding,
  border,
  windowScroll: preset.windowScroll,
  closest: {
    // we are using the smallFrameClient as a stand in for the elements
    // actual borderBox which is cut off when it is a scroll container
    borderBox: smallFrameClient.borderBox,
    margin,
    padding,
    border,
    // scroll width and height are based on the padding box
    scrollSize: {
      scrollWidth: bigClient.paddingBox.width,
      scrollHeight: bigClient.paddingBox.height,
    },
    scroll: { x: 0, y: 0 },
    shouldClipSubject: true,
  },
});

it('should recollect a dimension if requested', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  // both the droppable and the parent are scrollable
  const wrapper = mount(
    <WithAppContext marshal={marshal}>
      <App droppableIsScrollable />
    </WithAppContext>,
  );
  const el: ?HTMLElement = wrapper.find('.droppable').getDOMNode();
  invariant(el);
  // returning smaller border box as this is what occurs when the element is scrollable
  jest
    .spyOn(el, 'getBoundingClientRect')
    .mockImplementation(() => smallFrameClient.borderBox);
  // scrollWidth / scrollHeight are based on the paddingBox of an element
  Object.defineProperty(el, 'scrollWidth', {
    value: bigClient.paddingBox.width,
  });
  Object.defineProperty(el, 'scrollHeight', {
    value: bigClient.paddingBox.height,
  });

  // pull the get dimension function out
  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];
  // execute it to get the dimension
  const initial: DroppableDimension = callbacks.getDimensionAndWatchScroll(
    preset.windowScroll,
    immediate,
  );

  expect(initial).toEqual(expected);

  // recollection
  const recollection: DroppableDimension = callbacks.recollect({
    withoutPlaceholder: true,
  });
  expect(recollection.client).toEqual(initial.client);
  // not considering window scroll when recollecting
  expect(recollection.page).toEqual(initial.client);
});

it('should hide any placeholder when recollecting dimensions if requested', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  // both the droppable and the parent are scrollable
  const wrapper = mount(
    <WithAppContext marshal={marshal}>
      <App droppableIsScrollable showPlaceholder />
    </WithAppContext>,
  );
  const el: ?HTMLElement = wrapper.find('.droppable').getDOMNode();
  invariant(el);
  const placeholderEl: ?HTMLElement = wrapper.find('.placeholder').getDOMNode();
  invariant(placeholderEl);
  // returning smaller border box as this is what occurs when the element is scrollable
  jest
    .spyOn(el, 'getBoundingClientRect')
    .mockImplementation(() => smallFrameClient.borderBox);
  // scrollWidth / scrollHeight are based on the paddingBox of an element
  Object.defineProperty(el, 'scrollWidth', {
    value: bigClient.paddingBox.width,
  });
  Object.defineProperty(el, 'scrollHeight', {
    value: bigClient.paddingBox.height,
  });

  // will be called when unhiding the element
  const spy = jest.spyOn(placeholderEl.style, 'display', 'set');
  jest.spyOn(placeholderEl.style, 'display', 'get').mockReturnValue('original');

  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];

  callbacks.getDimensionAndWatchScroll(preset.windowScroll, immediate);
  expect(spy).not.toHaveBeenCalled();

  callbacks.recollect({ withoutPlaceholder: true });
  // hidden at one point
  expect(spy).toHaveBeenCalledWith('none');
  // finishes back with the original value
  expect(placeholderEl.style.display).toBe('original');
});

it('should not hide any placeholder when recollecting dimensions if requested', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  // both the droppable and the parent are scrollable
  const wrapper = mount(
    <WithAppContext marshal={marshal}>
      <App droppableIsScrollable showPlaceholder />
    </WithAppContext>,
  );
  const el: ?HTMLElement = wrapper.find('.droppable').getDOMNode();
  invariant(el);
  const placeholderEl: ?HTMLElement = wrapper.find('.placeholder').getDOMNode();
  invariant(placeholderEl);
  // returning smaller border box as this is what occurs when the element is scrollable
  jest
    .spyOn(el, 'getBoundingClientRect')
    .mockImplementation(() => smallFrameClient.borderBox);
  // scrollWidth / scrollHeight are based on the paddingBox of an element
  Object.defineProperty(el, 'scrollWidth', {
    value: bigClient.paddingBox.width,
  });
  Object.defineProperty(el, 'scrollHeight', {
    value: bigClient.paddingBox.height,
  });

  // will be called when unhiding the element
  const spy = jest.spyOn(placeholderEl.style, 'display', 'set');

  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];

  callbacks.getDimensionAndWatchScroll(preset.windowScroll, immediate);
  expect(spy).not.toHaveBeenCalled();

  callbacks.recollect({ withoutPlaceholder: false });
  // never touched
  expect(spy).not.toHaveBeenCalled();
});

it('should throw if there is no drag occurring when a recollection is requested', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  // both the droppable and the parent are scrollable
  mount(
    <WithAppContext marshal={marshal}>
      <App droppableIsScrollable showPlaceholder />
    </WithAppContext>,
  );

  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];

  expect(() => callbacks.recollect({ withoutPlaceholder: true })).toThrow();
});

it('should throw if there if recollecting from droppable that is not a scroll container', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  // both the droppable and the parent are scrollable
  mount(
    <WithAppContext marshal={marshal}>
      <App />
    </WithAppContext>,
  );

  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];

  callbacks.getDimensionAndWatchScroll(preset.windowScroll, immediate);

  expect(() => callbacks.recollect({ withoutPlaceholder: true })).toThrow();
});
