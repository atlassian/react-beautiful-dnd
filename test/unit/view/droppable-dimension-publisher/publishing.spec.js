// @flow
import { type Position } from 'css-box-model';
import { mount, type ReactWrapper } from 'enzyme';
import invariant from 'tiny-invariant';
import React from 'react';
import type {
  DimensionMarshal,
  DroppableCallbacks,
} from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import type { DroppableDimension, ScrollSize } from '../../../../src/types';
import { negate } from '../../../../src/state/position';
import { offsetByPosition } from '../../../../src/state/spacing';
import { getDroppableDimension } from '../../../utils/dimension';
import { getMarshalStub } from '../../../utils/dimension-marshal';
import { withDimensionMarshal } from '../../../utils/get-context-options';
import setWindowScroll from '../../../utils/set-window-scroll';
import {
  App,
  ScrollableItem,
  scheduled,
  immediate,
  preset,
  bigClient,
  margin,
  padding,
  border,
  descriptor,
  smallFrameClient,
} from './util/shared';
import { setViewport } from '../../../utils/viewport';
import tryCleanPrototypeStubs from '../../../utils/try-clean-prototype-stubs';

beforeEach(() => {
  setViewport(preset.viewport);
});

afterEach(() => {
  tryCleanPrototypeStubs();
});

it('should publish the dimensions of the target', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  const expected: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'fake-id',
      type: 'fake',
    },
    borderBox: bigClient.borderBox,
    margin,
    padding,
    border,
    windowScroll: { x: 0, y: 0 },
  });
  const wrapper: ReactWrapper<*> = mount(
    <ScrollableItem
      droppableId={expected.descriptor.id}
      type={expected.descriptor.type}
      isScrollable={false}
    />,
    withDimensionMarshal(marshal),
  );
  const el: ?HTMLElement = wrapper.instance().getRef();
  invariant(el);
  jest
    .spyOn(el, 'getBoundingClientRect')
    .mockImplementation(() => bigClient.borderBox);

  // pull the get dimension function out
  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];
  // execute it to get the dimension
  const result: DroppableDimension = callbacks.getDimensionAndWatchScroll(
    { x: 0, y: 0 },
    scheduled,
  );

  expect(result).toEqual(expected);
  // Goes without saying, but just being really clear here
  expect(result.client.border).toEqual(border);
  expect(result.client.margin).toEqual(margin);
  expect(result.client.padding).toEqual(padding);
});

it('should consider the window scroll when calculating dimensions', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  const windowScroll: Position = {
    x: 500,
    y: 1000,
  };
  setWindowScroll(windowScroll, { shouldPublish: false });
  const expected: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'fake-id',
      type: 'fake',
    },
    borderBox: bigClient.borderBox,
    margin,
    padding,
    border,
    windowScroll,
  });

  const wrapper: ReactWrapper<*> = mount(
    <ScrollableItem
      droppableId={expected.descriptor.id}
      type={expected.descriptor.type}
      isScrollable={false}
    />,
    withDimensionMarshal(marshal),
  );
  const el: ?HTMLElement = wrapper.instance().getRef();
  invariant(el);
  jest
    .spyOn(el, 'getBoundingClientRect')
    .mockImplementation(() => bigClient.borderBox);

  // pull the get dimension function out
  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];
  // execute it to get the dimension
  const result: DroppableDimension = callbacks.getDimensionAndWatchScroll(
    windowScroll,
    scheduled,
  );

  expect(result).toEqual(expected);
});

describe('no closest scrollable', () => {
  it('should return null for the closest scrollable if there is no scroll container', () => {
    const expected: DroppableDimension = getDroppableDimension({
      descriptor,
      borderBox: bigClient.borderBox,
      border,
      margin,
      padding,
      windowScroll: preset.windowScroll,
    });
    const marshal: DimensionMarshal = getMarshalStub();
    const wrapper = mount(
      <App parentIsScrollable={false} />,
      withDimensionMarshal(marshal),
    );
    const el: ?HTMLElement = wrapper.instance().getRef();
    invariant(el);
    jest
      .spyOn(el, 'getBoundingClientRect')
      .mockImplementation(() => bigClient.borderBox);

    // pull the get dimension function out
    const callbacks: DroppableCallbacks =
      marshal.registerDroppable.mock.calls[0][1];
    // execute it to get the dimension
    const result: DroppableDimension = callbacks.getDimensionAndWatchScroll(
      preset.windowScroll,
      immediate,
    );

    expect(result).toEqual(expected);
  });
});

describe('droppable is scrollable', () => {
  it('should collect information about the scrollable', () => {
    // When collecting a droppable that is itself scrollable we store
    // the client: BoxModel as if it did not have a frame. This brings
    // its usage into line with elements that have a wrapping scrollable
    // element.

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
    const marshal: DimensionMarshal = getMarshalStub();
    // both the droppable and the parent are scrollable
    const wrapper = mount(
      <App droppableIsScrollable />,
      withDimensionMarshal(marshal),
    );
    const el: ?HTMLElement = wrapper.instance().getRef();
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
    const result: DroppableDimension = callbacks.getDimensionAndWatchScroll(
      preset.windowScroll,
      immediate,
    );

    expect(result).toEqual(expected);
  });

  it('should account for a change in scroll when crafting its custom borderBox', () => {
    const scroll: Position = {
      x: 10,
      y: 10,
    };
    // the displacement of a scroll is in the opposite direction to a scroll
    const displacement: Position = negate(scroll);
    const expected: DroppableDimension = getDroppableDimension({
      descriptor,
      // as expected
      borderBox: offsetByPosition(bigClient.borderBox, displacement),
      margin,
      padding,
      border,
      closest: {
        // we are using the smallFrameClient as a stand in for the elements
        // actual borderBox which is cut off when it is a scroll container
        borderBox: smallFrameClient.borderBox,
        margin,
        padding,
        border,
        scrollSize: {
          scrollWidth: bigClient.paddingBox.width,
          scrollHeight: bigClient.paddingBox.height,
        },
        scroll,
        shouldClipSubject: true,
      },
      windowScroll: preset.windowScroll,
    });

    const marshal: DimensionMarshal = getMarshalStub();
    // both the droppable and the parent are scrollable
    const wrapper = mount(
      <App droppableIsScrollable />,
      withDimensionMarshal(marshal),
    );
    const el: ?HTMLElement = wrapper.instance().getRef();
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
    el.scrollTop = scroll.y;
    el.scrollLeft = scroll.x;

    // pull the get dimension function out
    const callbacks: DroppableCallbacks =
      marshal.registerDroppable.mock.calls[0][1];
    // execute it to get the dimension
    const result: DroppableDimension = callbacks.getDimensionAndWatchScroll(
      preset.windowScroll,
      immediate,
    );

    expect(result).toEqual(expected);
  });
});

describe('parent of droppable is scrollable', () => {
  it('should collect information about the scrollable', () => {
    const scrollSize: ScrollSize = {
      scrollHeight: bigClient.paddingBox.height,
      scrollWidth: bigClient.paddingBox.width,
    };
    const expected: DroppableDimension = getDroppableDimension({
      descriptor,
      borderBox: bigClient.borderBox,
      margin,
      padding,
      border,
      closest: {
        borderBox: smallFrameClient.borderBox,
        margin,
        padding,
        border,
        scrollSize,
        scroll: { x: 0, y: 0 },
        shouldClipSubject: true,
      },
      windowScroll: preset.windowScroll,
    });
    const marshal: DimensionMarshal = getMarshalStub();
    const wrapper = mount(
      <App parentIsScrollable droppableIsScrollable={false} />,
      withDimensionMarshal(marshal),
    );
    const droppable: ?HTMLElement = wrapper.instance().getRef();
    invariant(droppable);
    jest
      .spyOn(droppable, 'getBoundingClientRect')
      .mockImplementation(() => bigClient.borderBox);
    const parent: HTMLElement = wrapper.getDOMNode();
    jest
      .spyOn(parent, 'getBoundingClientRect')
      .mockImplementation(() => smallFrameClient.borderBox);
    Object.defineProperty(parent, 'scrollWidth', {
      value: scrollSize.scrollWidth,
    });
    Object.defineProperty(parent, 'scrollHeight', {
      value: scrollSize.scrollHeight,
    });
    // pull the get dimension function out
    const callbacks: DroppableCallbacks =
      marshal.registerDroppable.mock.calls[0][1];
    // execute it to get the dimension
    const result: DroppableDimension = callbacks.getDimensionAndWatchScroll(
      preset.windowScroll,
      immediate,
    );

    expect(result).toEqual(expected);
  });
});

describe('both droppable and parent is scrollable', () => {
  it('should log a warning as the use case is not supported', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const expected: DroppableDimension = getDroppableDimension({
      descriptor,
      borderBox: bigClient.borderBox,
      margin,
      padding,
      border,
      closest: {
        borderBox: smallFrameClient.borderBox,
        margin,
        padding,
        border,
        scrollSize: {
          scrollWidth: bigClient.paddingBox.width,
          scrollHeight: bigClient.paddingBox.height,
        },
        scroll: { x: 0, y: 0 },
        shouldClipSubject: true,
      },
      windowScroll: preset.windowScroll,
    });
    const marshal: DimensionMarshal = getMarshalStub();
    const wrapper = mount(
      <App parentIsScrollable droppableIsScrollable />,
      withDimensionMarshal(marshal),
    );
    const droppable: ?HTMLElement = wrapper.instance().getRef();
    invariant(droppable);
    const parent: HTMLElement = wrapper.getDOMNode();
    jest
      .spyOn(droppable, 'getBoundingClientRect')
      .mockImplementation(() => smallFrameClient.borderBox);
    Object.defineProperty(droppable, 'scrollWidth', {
      value: bigClient.paddingBox.width,
    });
    Object.defineProperty(droppable, 'scrollHeight', {
      value: bigClient.paddingBox.height,
    });
    // should never be called!
    jest.spyOn(parent, 'getBoundingClientRect').mockImplementation(() => {
      throw new Error(
        'Should not be getting the boundingClientRect on the parent',
      );
    });

    // pull the get dimension function out
    const callbacks: DroppableCallbacks =
      marshal.registerDroppable.mock.calls[0][1];
    // execute it to get the dimension
    expect(console.warn).not.toHaveBeenCalled();
    const result: DroppableDimension = callbacks.getDimensionAndWatchScroll(
      preset.windowScroll,
      immediate,
    );
    expect(console.warn).toHaveBeenCalled();

    expect(result).toEqual(expected);
    console.warn.mockRestore();
  });
});

it('should capture the initial scroll of the closest scrollable', () => {
  // in this case the parent of the droppable is the closest scrollable
  const frameScroll: Position = { x: 10, y: 20 };
  const marshal: DimensionMarshal = getMarshalStub();
  const wrapper = mount(
    <App parentIsScrollable droppableIsScrollable={false} />,
    withDimensionMarshal(marshal),
  );
  const droppable: ?HTMLElement = wrapper.instance().getRef();
  invariant(droppable);
  const parent: HTMLElement = wrapper.getDOMNode();
  // manually setting the scroll of the parent node
  parent.scrollTop = frameScroll.y;
  parent.scrollLeft = frameScroll.x;
  Object.defineProperty(parent, 'scrollWidth', {
    value: bigClient.paddingBox.width,
  });
  Object.defineProperty(parent, 'scrollHeight', {
    value: bigClient.paddingBox.height,
  });
  jest
    .spyOn(droppable, 'getBoundingClientRect')
    .mockImplementation(() => bigClient.borderBox);
  jest
    .spyOn(parent, 'getBoundingClientRect')
    .mockImplementation(() => smallFrameClient.borderBox);
  const expected: DroppableDimension = getDroppableDimension({
    descriptor,
    borderBox: bigClient.borderBox,
    margin,
    border,
    padding,
    closest: {
      borderBox: smallFrameClient.borderBox,
      margin,
      border,
      padding,
      scrollSize: {
        scrollWidth: bigClient.paddingBox.width,
        scrollHeight: bigClient.paddingBox.height,
      },
      scroll: frameScroll,
      shouldClipSubject: true,
    },
    windowScroll: preset.windowScroll,
  });

  // pull the get dimension function out
  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];
  // execute it to get the dimension
  const result: DroppableDimension = callbacks.getDimensionAndWatchScroll(
    preset.windowScroll,
    immediate,
  );

  expect(result).toEqual(expected);
});

it('should indicate if subject clipping is permitted based on the ignoreContainerClipping prop', () => {
  // in this case the parent of the droppable is the closest scrollable
  const marshal: DimensionMarshal = getMarshalStub();
  const wrapper = mount(
    <App
      parentIsScrollable
      droppableIsScrollable={false}
      ignoreContainerClipping
    />,
    withDimensionMarshal(marshal),
  );
  const droppable: ?HTMLElement = wrapper.instance().getRef();
  invariant(droppable);
  const parent: HTMLElement = wrapper.getDOMNode();
  const scrollSize: ScrollSize = {
    scrollWidth: bigClient.paddingBox.width,
    scrollHeight: bigClient.paddingBox.height,
  };
  Object.defineProperty(parent, 'scrollWidth', {
    value: scrollSize.scrollWidth,
  });
  Object.defineProperty(parent, 'scrollHeight', {
    value: scrollSize.scrollHeight,
  });
  jest
    .spyOn(droppable, 'getBoundingClientRect')
    .mockImplementation(() => bigClient.borderBox);
  jest
    .spyOn(parent, 'getBoundingClientRect')
    .mockImplementation(() => smallFrameClient.borderBox);
  const expected: DroppableDimension = getDroppableDimension({
    descriptor,
    borderBox: bigClient.borderBox,
    margin,
    padding,
    border,
    closest: {
      borderBox: smallFrameClient.borderBox,
      margin,
      padding,
      border,
      scrollSize,
      scroll: { x: 0, y: 0 },
      shouldClipSubject: false,
    },
    windowScroll: preset.windowScroll,
  });

  // pull the get dimension function out
  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];
  // execute it to get the dimension
  const result: DroppableDimension = callbacks.getDimensionAndWatchScroll(
    preset.windowScroll,
    immediate,
  );

  expect(result).toEqual(expected);
});
