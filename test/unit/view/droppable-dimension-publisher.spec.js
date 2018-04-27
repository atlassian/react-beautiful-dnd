// @flow
/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import { mount } from 'enzyme';
import {
  createBox,
  getRect,
  type BoxModel,
  type Spacing,
  type Position,
  type Rect,
} from 'css-box-model';
import DroppableDimensionPublisher from '../../../src/view/droppable-dimension-publisher/droppable-dimension-publisher';
import {
  getPreset,
  getComputedSpacing,
  getDroppableDimension,
} from '../../utils/dimension';
import { offsetByPosition } from '../../../src/state/spacing';
import { negate } from '../../../src/state/position';
import setWindowScroll from '../../utils/set-window-scroll';
import forceUpdate from '../../utils/force-update';
import { withDimensionMarshal } from '../../utils/get-context-options';
import type {
  DimensionMarshal,
  DroppableCallbacks,
} from '../../../src/state/dimension-marshal/dimension-marshal-types';
import type {
  ScrollOptions,
  DroppableId,
  DroppableDimension,
  DroppableDescriptor,
  TypeId,
} from '../../../src/types';

const preset = getPreset();

type ScrollableItemProps = {|
  // scrollable item prop (default: false)
  isScrollable: boolean,
  isDropDisabled: boolean,
  droppableId: DroppableId,
  type: TypeId,
|}

const margin: Spacing = {
  top: 1, right: 2, bottom: 3, left: 4,
};
const padding: Spacing = {
  top: 5, right: 6, bottom: 7, left: 8,
};
const border: Spacing = {
  top: 9, right: 10, bottom: 11, left: 12,
};
const smallFrameClient: BoxModel = createBox({
  borderBox: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
  },
  margin,
  padding,
  border,
});

const bigClient: BoxModel = createBox({
  borderBox: {
    top: 0,
    left: 0,
    right: 200,
    bottom: 200,
  },
  margin,
  padding,
  border,
});

const withSpacing = getComputedSpacing({ padding, margin, border });

class ScrollableItem extends Component<ScrollableItemProps> {
  static defaultProps = {
    isScrollable: true,
    type: preset.home.descriptor.type,
    droppableId: preset.home.descriptor.id,
    isDropDisabled: false,
  }
  /* eslint-disable react/sort-comp */
  ref: ?HTMLElement;

  setRef = (ref: ?HTMLElement) => {
    this.ref = ref;
  }

  getRef = (): ?HTMLElement => this.ref;

  render() {
    return (
      <DroppableDimensionPublisher
        droppableId={this.props.droppableId}
        type={this.props.type}
        direction={preset.home.axis.direction}
        isDropDisabled={this.props.isDropDisabled}
        ignoreContainerClipping={false}
        getDroppableRef={this.getRef}
      >
        <div
          className="scroll-container"
          style={{
            boxSizing: 'border-box',
            height: bigClient.borderBox.height,
            width: bigClient.borderBox.width,
            ...withSpacing,
            overflow: this.props.isScrollable ? 'scroll' : 'visible',
          }}
          ref={this.setRef}
        >
          hi
        </div>
      </DroppableDimensionPublisher>
    );
  }
}

const descriptor: DroppableDescriptor = {
  id: 'a cool droppable',
  type: 'cool',
};

type AppProps = {|
  droppableIsScrollable: boolean,
  parentIsScrollable: boolean,
  ignoreContainerClipping: boolean,
|};

class App extends Component<AppProps> {
  ref: ?HTMLElement
  static defaultProps = {
    ignoreContainerClipping: false,
    droppableIsScrollable: false,
    parentIsScrollable: false,
  };

  setRef = (ref: ?HTMLElement) => {
    this.ref = ref;
  }
  getRef = (): ?HTMLElement => this.ref;

  render() {
    const {
      droppableIsScrollable,
      parentIsScrollable,
      ignoreContainerClipping,
    } = this.props;
    return (
      <div
        className="scroll-parent"
        style={{
          boxSizing: 'border-box',
          height: smallFrameClient.borderBox.height,
          width: smallFrameClient.borderBox.width,
          ...withSpacing,
          overflow: parentIsScrollable ? 'scroll' : 'visible',
        }}
      >
        <div>
          <div
            ref={this.setRef}
            className="droppable"
            style={{
              boxSizing: 'border-box',
              height: bigClient.borderBox.height,
              width: bigClient.borderBox.width,
              ...withSpacing,
              overflow: droppableIsScrollable ? 'scroll' : 'visible',
            }}
          >
            <DroppableDimensionPublisher
              droppableId={descriptor.id}
              direction="vertical"
              isDropDisabled={false}
              type={descriptor.type}
              ignoreContainerClipping={ignoreContainerClipping}
              getDroppableRef={this.getRef}
            >
              <div>hello world</div>
            </DroppableDimensionPublisher>
          </div>
        </div>
      </div>
    );
  }
}

const getMarshalStub = (): DimensionMarshal => ({
  registerDraggable: jest.fn(),
  unregisterDraggable: jest.fn(),
  registerDroppable: jest.fn(),
  unregisterDroppable: jest.fn(),
  updateDroppableScroll: jest.fn(),
  updateDroppableIsEnabled: jest.fn(),
  onPhaseChange: jest.fn(),
  scrollDroppable: jest.fn(),
});

const scheduled: ScrollOptions = {
  shouldPublishImmediately: false,
};
const immediate: ScrollOptions = {
  shouldPublishImmediately: true,
};

describe('DraggableDimensionPublisher', () => {
  const originalWindowScroll: Position = {
    x: window.pageXOffset,
    y: window.pageYOffset,
  };

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  afterEach(() => {
    // clean up any stubs
    if (Element.prototype.getBoundingClientRect.mockRestore) {
      Element.prototype.getBoundingClientRect.mockRestore();
    }
    if (window.getComputedStyle.mockRestore) {
      window.getComputedStyle.mockRestore();
    }
    setWindowScroll(originalWindowScroll, { shouldPublish: false });
  });

  describe('dimension registration', () => {
    it('should register itself when mounting', () => {
      const marshal: DimensionMarshal = getMarshalStub();

      mount(<ScrollableItem />, withDimensionMarshal(marshal));

      expect(marshal.registerDroppable).toHaveBeenCalledTimes(1);
      expect(marshal.registerDroppable.mock.calls[0][0]).toEqual(preset.home.descriptor);
    });

    it('should unregister itself when unmounting', () => {
      const marshal: DimensionMarshal = getMarshalStub();

      const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
      expect(marshal.registerDroppable).toHaveBeenCalled();
      expect(marshal.unregisterDroppable).not.toHaveBeenCalled();

      wrapper.unmount();
      expect(marshal.unregisterDroppable).toHaveBeenCalledTimes(1);
      expect(marshal.unregisterDroppable).toHaveBeenCalledWith(preset.home.descriptor);
    });

    it('should update its registration when a descriptor property changes', () => {
      const marshal: DimensionMarshal = getMarshalStub();

      const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
      // asserting shape of original publish
      expect(marshal.registerDroppable.mock.calls[0][0]).toEqual(preset.home.descriptor);

      // updating the index
      wrapper.setProps({
        droppableId: 'some-fake-id',
      });
      // old descriptor unpublished
      expect(marshal.unregisterDroppable).toHaveBeenCalledTimes(1);
      expect(marshal.unregisterDroppable).toHaveBeenCalledWith(preset.home.descriptor);
      // newly published descriptor
      expect(marshal.registerDroppable.mock.calls[1][0]).toEqual({
        id: 'some-fake-id',
        type: preset.home.descriptor.type,
      });
    });

    it('should not update its registration when a descriptor property does not change on an update', () => {
      const marshal: DimensionMarshal = getMarshalStub();

      const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
      expect(marshal.registerDroppable).toHaveBeenCalledTimes(1);
      marshal.registerDroppable.mockReset();

      forceUpdate(wrapper);
      expect(marshal.registerDroppable).not.toHaveBeenCalled();
    });

    it('should unregister with the previous descriptor when changing', () => {
      const marshal: DimensionMarshal = getMarshalStub();

      const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
      // asserting shape of original publish
      expect(marshal.registerDroppable.mock.calls[0][0]).toEqual(preset.home.descriptor);

      // updating the index
      wrapper.setProps({
        droppableId: 'some-fake-id',
      });
      // old descriptor unpublished
      expect(marshal.unregisterDroppable).toHaveBeenCalledTimes(1);
      expect(marshal.unregisterDroppable).toHaveBeenCalledWith(preset.home.descriptor);
      // newly published descriptor
      expect(marshal.registerDroppable.mock.calls[1][0]).toEqual({
        id: 'some-fake-id',
        type: preset.home.descriptor.type,
      });
    });
  });

  describe('dimension publishing', () => {
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
      });

      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => expected.client.borderBox);

      mount(
        <ScrollableItem
          droppableId={expected.descriptor.id}
          type={expected.descriptor.type}
          isScrollable={false}
        />,
        withDimensionMarshal(marshal),
      );

      // pull the get dimension function out
      const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
      // execute it to get the dimension
      const result: DroppableDimension = callbacks.getDimension();

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
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => bigClient.borderBox);

      mount(
        <ScrollableItem
          droppableId={expected.descriptor.id}
          type={expected.descriptor.type}
          isScrollable={false}
        />,
        withDimensionMarshal(marshal),
      );

      // pull the get dimension function out
      const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
      // execute it to get the dimension
      const result: DroppableDimension = callbacks.getDimension();

      expect(result).toEqual(expected);
    });

    describe('closest scrollable', () => {
      describe('no closest scrollable', () => {
        it('should return null for the closest scrollable if there is no scroll container', () => {
          const expected: DroppableDimension = getDroppableDimension({
            descriptor,
            borderBox: bigClient.borderBox,
            border,
            margin,
            padding,
          });
          const marshal: DimensionMarshal = getMarshalStub();
          const wrapper = mount(
            <App
              parentIsScrollable={false}
            />,
            withDimensionMarshal(marshal),
          );
          const el: HTMLElement = wrapper.instance().getRef();
          jest.spyOn(el, 'getBoundingClientRect').mockImplementation(() => bigClient.borderBox);

          // pull the get dimension function out
          const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
          // execute it to get the dimension
          const result: DroppableDimension = callbacks.getDimension();

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
            closest: {
              // we are using the smallFrameClient as a stand in for the elements
              // actual borderBox which is cut off when it is a scroll container
              borderBox: smallFrameClient.borderBox,
              margin,
              padding,
              border,
              scrollWidth: bigClient.paddingBox.width,
              scrollHeight: bigClient.paddingBox.height,
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
          const el: HTMLElement = wrapper.instance().getRef();
          // returning smaller border box as this is what occurs when the element is scrollable
          jest.spyOn(el, 'getBoundingClientRect').mockImplementation(() => smallFrameClient.borderBox);
          // scrollWidth / scrollHeight are based on the paddingBox of an element
          Object.defineProperty(el, 'scrollWidth', {
            value: bigClient.paddingBox.width,
          });
          Object.defineProperty(el, 'scrollHeight', {
            value: bigClient.paddingBox.height,
          });

          // pull the get dimension function out
          const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
          // execute it to get the dimension
          const result: DroppableDimension = callbacks.getDimension();

          expect(result).toEqual(expected);
        });

        it.only('should account for a change in scroll when crafting its custom borderBox', () => {
          const scroll: Position = {
            x: 10,
            y: 10,
          };
          console.log('big client', bigClient);
          const expected: DroppableDimension = getDroppableDimension({
            descriptor,
            // as expected
            borderBox: bigClient.borderBox,
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
              scrollWidth: bigClient.paddingBox.width,
              scrollHeight: bigClient.paddingBox.height,
              scroll,
              shouldClipSubject: true,
            },
          });
          const actualBoundingRect: Rect =
            getRect(offsetByPosition(smallFrameClient.borderBox, scroll));

          const marshal: DimensionMarshal = getMarshalStub();
          // both the droppable and the parent are scrollable
          const wrapper = mount(
            <App droppableIsScrollable />,
            withDimensionMarshal(marshal),
          );
          const el: HTMLElement = wrapper.instance().getRef();
          // returning smaller border box as this is what occurs when the element is scrollable
          jest.spyOn(el, 'getBoundingClientRect')
            .mockImplementationOnce(() => actualBoundingRect)
            .mockImplementationOnce(() => smallFrameClient.borderBox);
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
          const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
          // execute it to get the dimension
          const result: DroppableDimension = callbacks.getDimension();

          expect(result).toEqual(expected);
        });
      });

      describe('parent of droppable is scrollable', () => {
        it('should collect information about the scrollable', () => {
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
              scrollWidth: smallFrameClient.paddingBox.width,
              scrollHeight: smallFrameClient.paddingBox.height,
              scroll: { x: 0, y: 0 },
              shouldClipSubject: true,
            },
          });
          const marshal: DimensionMarshal = getMarshalStub();
          const wrapper = mount(
            <App
              parentIsScrollable
              droppableIsScrollable={false}
            />,
            withDimensionMarshal(marshal),
          );
          const droppable: HTMLElement = wrapper.instance().getRef();
          jest.spyOn(droppable, 'getBoundingClientRect').mockImplementation(() => bigClient.borderBox);
          const parent: HTMLElement = wrapper.getDOMNode();
          jest.spyOn(parent, 'getBoundingClientRect').mockImplementation(() => smallFrameClient.borderBox);

          // pull the get dimension function out
          const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
          // execute it to get the dimension
          const result: DroppableDimension = callbacks.getDimension();

          expect(result).toEqual(expected);
        });
      });

      describe('both droppable and parent is scrollable', () => {
        it('should only consider the closest scrollable - which is the droppable', () => {
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
              scrollWidth: bigClient.paddingBox.width,
              scrollHeight: bigClient.paddingBox.height,
              scroll: { x: 0, y: 0 },
              shouldClipSubject: true,
            },
          });
          const marshal: DimensionMarshal = getMarshalStub();
          const wrapper = mount(
            <App
              parentIsScrollable
              droppableIsScrollable
            />,
            withDimensionMarshal(marshal),
          );
          const droppable: HTMLElement = wrapper.instance().getRef();
          const parent: HTMLElement = wrapper.getDOMNode();
          jest.spyOn(droppable, 'getBoundingClientRect').mockImplementation(() => smallFrameClient.borderBox);
          Object.defineProperty(droppable, 'scrollWidth', {
            value: bigClient.paddingBox.width,
          });
          Object.defineProperty(droppable, 'scrollHeight', {
            value: bigClient.paddingBox.height,
          });
          // should never be called!
          jest.spyOn(parent, 'getBoundingClientRect').mockImplementation(() => {
            throw new Error('Should not be getting the boundingClientRect on the parent');
          });

          // pull the get dimension function out
          const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
          // execute it to get the dimension
          const result: DroppableDimension = callbacks.getDimension();

          expect(result).toEqual(expected);
        });
      });

      it('should capture the initial scroll of the closest scrollable', () => {
        // in this case the parent of the droppable is the closest scrollable
        const frameScroll: Position = { x: 10, y: 20 };
        const marshal: DimensionMarshal = getMarshalStub();
        const wrapper = mount(
          <App
            parentIsScrollable
            droppableIsScrollable={false}
          />,
          withDimensionMarshal(marshal),
        );
        const droppable: HTMLElement = wrapper.instance().getRef();
        const parent: HTMLElement = wrapper.getDOMNode();
        // manually setting the scroll of the parent node
        parent.scrollTop = frameScroll.y;
        parent.scrollLeft = frameScroll.x;
        jest.spyOn(droppable, 'getBoundingClientRect').mockImplementation(() => bigClient.borderBox);
        jest.spyOn(parent, 'getBoundingClientRect').mockImplementation(() => smallFrameClient.borderBox);
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
            scrollWidth: smallFrameClient.paddingBox.width,
            scrollHeight: smallFrameClient.paddingBox.height,
            scroll: frameScroll,
            shouldClipSubject: true,
          },
        });

          // pull the get dimension function out
        const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
        // execute it to get the dimension
        const result: DroppableDimension = callbacks.getDimension();

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
        const droppable: HTMLElement = wrapper.instance().getRef();
        const parent: HTMLElement = wrapper.getDOMNode();
        jest.spyOn(droppable, 'getBoundingClientRect').mockImplementation(() => bigClient.borderBox);
        jest.spyOn(parent, 'getBoundingClientRect').mockImplementation(() => smallFrameClient.borderBox);
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
            scrollWidth: smallFrameClient.paddingBox.width,
            scrollHeight: smallFrameClient.paddingBox.height,
            scroll: { x: 0, y: 0 },
            shouldClipSubject: false,
          },
        });

          // pull the get dimension function out
        const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
        // execute it to get the dimension
        const result: DroppableDimension = callbacks.getDimension();

        expect(result).toEqual(expected);
      });
    });
  });

  describe('scroll watching', () => {
    const scroll = (el: HTMLElement, target: Position) => {
      el.scrollTop = target.y;
      el.scrollLeft = target.x;
      el.dispatchEvent(new Event('scroll'));
    };

    describe('should immediately publish updates', () => {
      it('should immediately publish the scroll offset of the closest scrollable', () => {
        const marshal: DimensionMarshal = getMarshalStub();
        const wrapper = mount(
          <ScrollableItem />,
          withDimensionMarshal(marshal),
        );
        const container: HTMLElement = wrapper.getDOMNode();

        if (!container.classList.contains('scroll-container')) {
          throw new Error('incorrect dom node collected');
        }

        // tell the droppable to watch for scrolling
        const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
        // watch scroll will only be called after the dimension is requested
        callbacks.getDimension();
        callbacks.watchScroll(immediate);

        scroll(container, { x: 500, y: 1000 });

        expect(marshal.updateDroppableScroll).toHaveBeenCalledWith(
          preset.home.descriptor.id, { x: 500, y: 1000 },
        );
      });

      it('should not fire a scroll if the value has not changed since the previous call', () => {
        // this can happen if you scroll backward and forward super quick
        const marshal: DimensionMarshal = getMarshalStub();
        const wrapper = mount(
          <ScrollableItem />,
          withDimensionMarshal(marshal),
        );
        const container: HTMLElement = wrapper.getDOMNode();
        // tell the droppable to watch for scrolling
        const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];

        // watch scroll will only be called after the dimension is requested
        callbacks.getDimension();
        callbacks.watchScroll(immediate);

        // first event
        scroll(container, { x: 500, y: 1000 });
        expect(marshal.updateDroppableScroll).toHaveBeenCalledTimes(1);
        expect(marshal.updateDroppableScroll).toHaveBeenCalledWith(
          preset.home.descriptor.id, { x: 500, y: 1000 }
        );
        marshal.updateDroppableScroll.mockReset();

        // second event - scroll to same spot
        scroll(container, { x: 500, y: 1000 });
        expect(marshal.updateDroppableScroll).not.toHaveBeenCalled();

        // third event - new value
        scroll(container, { x: 500, y: 1001 });
        expect(marshal.updateDroppableScroll).toHaveBeenCalledWith(
          preset.home.descriptor.id, { x: 500, y: 1001 }
        );
      });
    });

    describe('should schedule publish updates', () => {
      it('should publish the scroll offset of the closest scrollable', () => {
        const marshal: DimensionMarshal = getMarshalStub();
        const wrapper = mount(
          <ScrollableItem />,
          withDimensionMarshal(marshal),
        );
        const container: HTMLElement = wrapper.getDOMNode();

        if (!container.classList.contains('scroll-container')) {
          throw new Error('incorrect dom node collected');
        }

        // tell the droppable to watch for scrolling
        const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
        // watch scroll will only be called after the dimension is requested
        callbacks.getDimension();
        callbacks.watchScroll(scheduled);

        scroll(container, { x: 500, y: 1000 });
        // release the update animation frame
        requestAnimationFrame.step();

        expect(marshal.updateDroppableScroll).toHaveBeenCalledWith(
          preset.home.descriptor.id, { x: 500, y: 1000 },
        );
      });

      it('should throttle multiple scrolls into a animation frame', () => {
        const marshal: DimensionMarshal = getMarshalStub();
        const wrapper = mount(
          <ScrollableItem />,
          withDimensionMarshal(marshal),
        );
        const container: HTMLElement = wrapper.getDOMNode();
        // tell the droppable to watch for scrolling
        const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];

        // watch scroll will only be called after the dimension is requested
        callbacks.getDimension();
        callbacks.watchScroll(scheduled);

        // first event
        scroll(container, { x: 500, y: 1000 });
        // second event in same frame
        scroll(container, { x: 200, y: 800 });

        // release the update animation frame
        requestAnimationFrame.step();

        expect(marshal.updateDroppableScroll).toHaveBeenCalledTimes(1);
        expect(marshal.updateDroppableScroll).toHaveBeenCalledWith(
          preset.home.descriptor.id, { x: 200, y: 800 },
        );

        // also checking that no loose frames are stored up
        requestAnimationFrame.flush();
        expect(marshal.updateDroppableScroll).toHaveBeenCalledTimes(1);
      });

      it('should not fire a scroll if the value has not changed since the previous frame', () => {
        // this can happen if you scroll backward and forward super quick
        const marshal: DimensionMarshal = getMarshalStub();
        const wrapper = mount(
          <ScrollableItem />,
          withDimensionMarshal(marshal),
        );
        const container: HTMLElement = wrapper.getDOMNode();
        // tell the droppable to watch for scrolling
        const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];

        // watch scroll will only be called after the dimension is requested
        callbacks.getDimension();
        callbacks.watchScroll(scheduled);

        // first event
        scroll(container, { x: 500, y: 1000 });
        // release the frame
        requestAnimationFrame.step();
        expect(marshal.updateDroppableScroll).toHaveBeenCalledTimes(1);
        expect(marshal.updateDroppableScroll).toHaveBeenCalledWith(
          preset.home.descriptor.id, { x: 500, y: 1000 }
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
        const wrapper = mount(
          <ScrollableItem />,
          withDimensionMarshal(marshal),
        );
        const container: HTMLElement = wrapper.getDOMNode();
        // tell the droppable to watch for scrolling
        const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];

        // watch scroll will only be called after the dimension is requested
        callbacks.getDimension();
        callbacks.watchScroll(scheduled);

        // first event
        scroll(container, { x: 500, y: 1000 });
        requestAnimationFrame.step();
        expect(marshal.updateDroppableScroll).toHaveBeenCalledTimes(1);
        marshal.updateDroppableScroll.mockReset();

        // second event
        scroll(container, { x: 400, y: 100 });
        // no animation frame to release event fired yet

        // unwatching before frame fired
        callbacks.unwatchScroll();

        // flushing any frames
        requestAnimationFrame.flush();
        expect(marshal.updateDroppableScroll).not.toHaveBeenCalled();
      });
    });

    it('should stop watching scroll when no longer required to publish', () => {
      // this can happen if you scroll backward and forward super quick
      const marshal: DimensionMarshal = getMarshalStub();
      const wrapper = mount(
        <ScrollableItem />,
        withDimensionMarshal(marshal),
      );
      const container: HTMLElement = wrapper.getDOMNode();
      // tell the droppable to watch for scrolling
      const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];

      // watch scroll will only be called after the dimension is requested
      callbacks.getDimension();
      callbacks.watchScroll(immediate);

      // first event
      scroll(container, { x: 500, y: 1000 });
      expect(marshal.updateDroppableScroll).toHaveBeenCalledTimes(1);
      marshal.updateDroppableScroll.mockReset();

      callbacks.unwatchScroll();

      // scroll event after no longer watching
      scroll(container, { x: 190, y: 400 });
      expect(marshal.updateDroppableScroll).not.toHaveBeenCalled();
    });

    it('should stop watching for scroll events when the component is unmounted', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => { });
      const marshal: DimensionMarshal = getMarshalStub();
      const wrapper = mount(
        <ScrollableItem />,
        withDimensionMarshal(marshal),
      );
      const container: HTMLElement = wrapper.getDOMNode();
      // tell the droppable to watch for scrolling
      const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];

      // watch scroll will only be called after the dimension is requested
      callbacks.getDimension();
      callbacks.watchScroll(immediate);

      wrapper.unmount();

      // second event - will not fire any updates
      scroll(container, { x: 100, y: 300 });
      expect(marshal.updateDroppableScroll).not.toHaveBeenCalled();
      // also logs a warning
      expect(console.warn).toHaveBeenCalled();

      // cleanup
      console.warn.mockRestore();
    });
  });

  describe('forced scroll', () => {
    it('should not do anything if the droppable has no closest scrollable', () => {
      const marshal: DimensionMarshal = getMarshalStub();
      // no scroll parent
      const wrapper = mount(
        <App
          parentIsScrollable={false}
          droppableIsScrollable={false}
        />,
        withDimensionMarshal(marshal),
      );
      const droppable: HTMLElement = wrapper.instance().getRef();
      const parent: HTMLElement = wrapper.getDOMNode();
      jest.spyOn(droppable, 'getBoundingClientRect').mockImplementation(() => smallFrameClient.borderBox);
      jest.spyOn(parent, 'getBoundingClientRect').mockImplementation(() => bigClient.borderBox);

      // validating no initial scroll
      expect(parent.scrollTop).toBe(0);
      expect(parent.scrollLeft).toBe(0);
      expect(droppable.scrollTop).toBe(0);
      expect(droppable.scrollLeft).toBe(0);

      const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
      // request the droppable start listening for scrolling
      callbacks.getDimension();
      callbacks.watchScroll(scheduled);
      expect(console.error).not.toHaveBeenCalled();

      // ask it to scroll
      callbacks.scroll({ x: 100, y: 100 });

      expect(parent.scrollTop).toBe(0);
      expect(parent.scrollLeft).toBe(0);
      expect(droppable.scrollTop).toBe(0);
      expect(droppable.scrollLeft).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });

    describe('there is a closest scrollable', () => {
      it('should update the scroll of the closest scrollable', () => {
        const marshal: DimensionMarshal = getMarshalStub();
        const wrapper = mount(
          <ScrollableItem />,
          withDimensionMarshal(marshal),
        );
        const container: HTMLElement = wrapper.getDOMNode();

        if (!container.classList.contains('scroll-container')) {
          throw new Error('incorrect dom node collected');
        }

        expect(container.scrollTop).toBe(0);
        expect(container.scrollLeft).toBe(0);

        // tell the droppable to watch for scrolling
        const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
        // watch scroll will only be called after the dimension is requested
        callbacks.getDimension();
        callbacks.watchScroll(scheduled);

        callbacks.scroll({ x: 500, y: 1000 });

        expect(container.scrollLeft).toBe(500);
        expect(container.scrollTop).toBe(1000);
      });

      it('should not scroll if scroll is not currently being watched', () => {
        const marshal: DimensionMarshal = getMarshalStub();
        const wrapper = mount(
          <ScrollableItem />,
          withDimensionMarshal(marshal),
        );
        const container: HTMLElement = wrapper.getDOMNode();

        if (!container.classList.contains('scroll-container')) {
          throw new Error('incorrect dom node collected');
        }

        expect(container.scrollTop).toBe(0);
        expect(container.scrollLeft).toBe(0);

        // tell the droppable to watch for scrolling
        const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
        callbacks.getDimension();
        // not watching scroll yet

        callbacks.scroll({ x: 500, y: 1000 });

        expect(container.scrollLeft).toBe(0);
        expect(container.scrollTop).toBe(0);
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('is enabled changes', () => {
    it('should publish updates to the enabled state', () => {
      const marshal: DimensionMarshal = getMarshalStub();
      const wrapper = mount(
        <ScrollableItem />,
        withDimensionMarshal(marshal),
      );

      // not called yet
      expect(marshal.updateDroppableIsEnabled).not.toHaveBeenCalled();

      wrapper.setProps({
        isDropDisabled: true,
      });

      expect(marshal.updateDroppableIsEnabled)
        .toHaveBeenCalledTimes(1);
      expect(marshal.updateDroppableIsEnabled)
        .toHaveBeenCalledWith(preset.home.descriptor.id, false);
    });

    it('should not publish updates when there is no change', () => {
      const marshal: DimensionMarshal = getMarshalStub();
      const wrapper = mount(
        <ScrollableItem />,
        withDimensionMarshal(marshal),
      );

      // not called yet
      expect(marshal.updateDroppableIsEnabled).not.toHaveBeenCalled();

      wrapper.setProps({
        isDropDisabled: true,
      });

      expect(marshal.updateDroppableIsEnabled).toHaveBeenCalledTimes(1);
      marshal.updateDroppableIsEnabled.mockReset();

      forceUpdate(wrapper);
      expect(marshal.updateDroppableIsEnabled).not.toHaveBeenCalled();
    });
  });
});
