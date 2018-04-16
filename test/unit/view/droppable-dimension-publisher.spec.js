// @flow
/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import { mount } from 'enzyme';
import DroppableDimensionPublisher from '../../../src/view/droppable-dimension-publisher/droppable-dimension-publisher';
import { getDroppableDimension } from '../../../src/state/dimension';
import { getPreset } from '../../utils/dimension';
import getArea from '../../../src/state/get-area';
import setWindowScroll from '../../utils/set-window-scroll';
import forceUpdate from '../../utils/force-update';
import { withDimensionMarshal } from '../../utils/get-context-options';
import type {
  DimensionMarshal,
  DroppableCallbacks,
} from '../../../src/state/dimension-marshal/dimension-marshal-types';
import type {
  Area,
  ScrollOptions,
  Spacing,
  DroppableId,
  DroppableDimension,
  Position,
  DroppableDescriptor,
  TypeId,
} from '../../../src/types';

const noMargin = {
  marginTop: '0',
  marginRight: '0',
  marginBottom: '0',
  marginLeft: '0',
};
const noPadding = {
  paddingTop: '0',
  paddingRight: '0',
  paddingBottom: '0',
  paddingLeft: '0',
};
const noBorder = {
  borderTopWidth: '0',
  borderRightWidth: '0',
  borderBottomWidth: '0',
  borderLeftWidth: '0',
};

const noComputedSpacing = {
  ...noMargin,
  ...noPadding,
  ...noBorder,
};

const preset = getPreset();

type ScrollableItemProps = {
  // scrollable item prop (default: false)
  isDropDisabled?: boolean,
  droppableId?: DroppableId,
  type?: TypeId,
}

class ScrollableItem extends Component<ScrollableItemProps> {
  /* eslint-disable react/sort-comp */
  ref: ?HTMLElement;

  setRef = (ref: ?HTMLElement) => {
    this.ref = ref;
  }

  getRef = (): ?HTMLElement => this.ref;

  render() {
    return (
      <DroppableDimensionPublisher
        droppableId={this.props.droppableId || preset.home.descriptor.id}
        type={this.props.type || preset.home.descriptor.type}
        direction={preset.home.axis.direction}
        isDropDisabled={this.props.isDropDisabled === true}
        ignoreContainerClipping={false}
        getDroppableRef={this.getRef}
      >
        <div
          className="scroll-container"
          style={{ overflowY: 'auto' }}
          ref={this.setRef}
        >
          hi
        </div>
      </DroppableDimensionPublisher>
    );
  }
}

type AppProps = {
  droppableIsScrollable?: boolean,
  parentIsScrollable?: boolean,
  ignoreContainerClipping: boolean,
};

const frame: Area = getArea({
  top: 0,
  left: 0,
  right: 150,
  bottom: 150,
});
const borderBox: Area = getArea({
  top: 0,
  left: 0,
  right: 100,
  bottom: 100,
});
const descriptor: DroppableDescriptor = {
  id: 'a cool droppable',
  type: 'cool',
};

class App extends Component<AppProps> {
  ref: ?HTMLElement
  static defaultProps = {
    onPublish: () => {},
    ignoreContainerClipping: false,
  }

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
          height: frame.height,
          width: frame.width,
          padding: 0,
          margin: 0,
          borderWidth: 0,
          overflow: parentIsScrollable ? 'scroll' : 'visible',
        }}
      >
        <div>
          <div
            ref={this.setRef}
            className="droppable"
            style={{
              height: borderBox.height,
              width: borderBox.width,
              padding: 0,
              margin: 0,
              borderWidth: 0,
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
        borderBox: getArea({
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        }),
      });

      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        top: expected.page.borderBox.top,
        bottom: expected.page.borderBox.bottom,
        left: expected.page.borderBox.left,
        right: expected.page.borderBox.right,
        height: expected.page.borderBox.height,
        width: expected.page.borderBox.width,
      }));
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => noComputedSpacing);

      mount(
        <ScrollableItem
          droppableId={expected.descriptor.id}
          type={expected.descriptor.type}
        />,
        withDimensionMarshal(marshal),
      );

      // pull the get dimension function out
      const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
      // execute it to get the dimension
      const result: DroppableDimension = callbacks.getDimension();

      expect(result).toEqual(expected);
    });

    it('should consider any margins when calculating dimensions', () => {
      const marshal: DimensionMarshal = getMarshalStub();
      const margin: Spacing = {
        top: 10,
        right: 30,
        bottom: 40,
        left: 50,
      };
      const expected: DroppableDimension = getDroppableDimension({
        descriptor: {
          id: 'fake-id',
          type: 'fake',
        },
        borderBox: getArea({
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        }),
        margin,
      });
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        top: expected.page.borderBox.top,
        bottom: expected.page.borderBox.bottom,
        left: expected.page.borderBox.left,
        right: expected.page.borderBox.right,
        height: expected.page.borderBox.height,
        width: expected.page.borderBox.width,
      }));
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
        marginTop: `${margin.top}`,
        marginRight: `${margin.right}`,
        marginBottom: `${margin.bottom}`,
        marginLeft: `${margin.left}`,
        ...noPadding,
        ...noBorder,
      }));

      mount(
        <ScrollableItem
          droppableId={expected.descriptor.id}
          type={expected.descriptor.type}
        />,
        withDimensionMarshal(marshal),
      );

      // pull the get dimension function out
      const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
      // execute it to get the dimension
      const result: DroppableDimension = callbacks.getDimension();

      expect(result).toEqual(expected);
    });

    it('should consider borders and padding when calculating the content box', () => {
      const marshal: DimensionMarshal = getMarshalStub();
      const border: Spacing = {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10,
      };
      const padding: Spacing = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      };
      const expected: DroppableDimension = getDroppableDimension({
        descriptor: {
          id: 'fake-id',
          type: 'fake',
        },
        borderBox,
        border,
        padding,
      });
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => borderBox);
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
        borderTopWidth: `${border.top}`,
        borderRightWidth: `${border.right}`,
        borderBottomWidth: `${border.bottom}`,
        borderLeftWidth: `${border.left}`,
        paddingTop: `${padding.top}`,
        paddingRight: `${padding.right}`,
        paddingBottom: `${padding.bottom}`,
        paddingLeft: `${padding.left}`,
        ...noMargin,
      }));

      mount(
        <ScrollableItem
          droppableId={expected.descriptor.id}
          type={expected.descriptor.type}
        />,
        withDimensionMarshal(marshal),
      );

      // pull the get dimension function out
      const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
      // execute it to get the dimension
      const result: DroppableDimension = callbacks.getDimension();

      expect(result).toEqual(expected);
      expect(result.client.contentBox).toEqual(getArea({
        top: borderBox.top + border.top + padding.top,
        right: borderBox.right - border.right - padding.right,
        left: borderBox.left + border.left + padding.left,
        bottom: borderBox.bottom - border.bottom - padding.bottom,
      }));
    });

    it('should consider the window scroll when calculating dimensions', () => {
      const marshal: DimensionMarshal = getMarshalStub();
      const windowScroll: Position = {
        x: 500,
        y: 1000,
      };
      setWindowScroll(windowScroll, { shouldPublish: false });
      const ourPaddingBox: Area = getArea({
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
      });
      const expected: DroppableDimension = getDroppableDimension({
        descriptor: {
          id: 'fake-id',
          type: 'fake',
        },
        windowScroll,
        borderBox: ourPaddingBox,
      });
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ourPaddingBox);
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => noComputedSpacing);

      mount(
        <ScrollableItem
          droppableId={expected.descriptor.id}
          type={expected.descriptor.type}
        />,
        withDimensionMarshal(marshal),
      );

      // pull the get dimension function out
      const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
      // execute it to get the dimension
      const result: DroppableDimension = callbacks.getDimension();

      expect(result).toEqual(expected);
    });

    it.skip('should throw an error if no ref is provided', () => {
      // TODO!
    });

    describe('closest scrollable', () => {
      describe('no closest scrollable', () => {
        it('should return null for the closest scrollable if there is no scroll container', () => {
          const expected: DroppableDimension = getDroppableDimension({
            descriptor,
            borderBox,
          });
          const marshal: DimensionMarshal = getMarshalStub();
          const wrapper = mount(
            <App
              parentIsScrollable={false}
            />,
            withDimensionMarshal(marshal),
          );
          const el: HTMLElement = wrapper.instance().getRef();
          jest.spyOn(el, 'getBoundingClientRect').mockImplementation(() => borderBox);

          // pull the get dimension function out
          const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
          // execute it to get the dimension
          const result: DroppableDimension = callbacks.getDimension();

          expect(result).toEqual(expected);
        });
      });

      describe('droppable is scrollable', () => {
        it('should capture the frame', () => {
          const expected: DroppableDimension = getDroppableDimension({
            descriptor,
            borderBox: frame,
            closest: {
              frameBorderBox: frame,
              scrollWidth: frame.width,
              scrollHeight: frame.height,
              scroll: { x: 0, y: 0 },
              shouldClipSubject: true,
            },
          });
          const marshal: DimensionMarshal = getMarshalStub();
          // both the droppable and the parent are scrollable
          const wrapper = mount(
            <App
              droppableIsScrollable
            />,
            withDimensionMarshal(marshal),
          );
          const el: HTMLElement = wrapper.instance().getRef();
          jest.spyOn(el, 'getBoundingClientRect').mockImplementation(() => frame);

          // pull the get dimension function out
          const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
          // execute it to get the dimension
          const result: DroppableDimension = callbacks.getDimension();

          expect(result).toEqual(expected);
        });
      });

      describe('parent of droppable is scrollable', () => {
        it('should capture the frame', () => {
          const marshal: DimensionMarshal = getMarshalStub();
          const wrapper = mount(
            <App
              parentIsScrollable
              droppableIsScrollable={false}
            />,
            withDimensionMarshal(marshal),
          );
          const parent: HTMLElement = wrapper.getDOMNode();
          const droppable: HTMLElement = wrapper.instance().getRef();
          jest.spyOn(parent, 'getBoundingClientRect').mockImplementation(() => frame);
          jest.spyOn(droppable, 'getBoundingClientRect').mockImplementation(() => borderBox);
          const expected: DroppableDimension = getDroppableDimension({
            descriptor,
            borderBox,
            closest: {
              frameBorderBox: frame,
              scrollWidth: frame.width,
              scrollHeight: frame.height,
              scroll: { x: 0, y: 0 },
              shouldClipSubject: true,
            },
          });

          // pull the get dimension function out
          const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
          // execute it to get the dimension
          const result: DroppableDimension = callbacks.getDimension();

          expect(result).toEqual(expected);
        });
      });

      describe('both droppable and parent is scrollable', () => {
        it('should only consider the closest scrollable - which is the droppable', () => {
          const marshal: DimensionMarshal = getMarshalStub();
          const wrapper = mount(
            <App
              parentIsScrollable
              droppableIsScrollable
            />,
            withDimensionMarshal(marshal),
          );
          const parent: HTMLElement = wrapper.getDOMNode();
          const droppable: HTMLElement = wrapper.instance().getRef();
          jest.spyOn(parent, 'getBoundingClientRect').mockImplementation(() => frame);
          jest.spyOn(droppable, 'getBoundingClientRect').mockImplementation(() => borderBox);
          const expected: DroppableDimension = getDroppableDimension({
            descriptor,
            borderBox,
            closest: {
              frameBorderBox: borderBox,
              scrollWidth: borderBox.width,
              scrollHeight: borderBox.height,
              scroll: { x: 0, y: 0 },
              shouldClipSubject: true,
            },
          });

          // pull the get dimension function out
          const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
          // execute it to get the dimension
          const result: DroppableDimension = callbacks.getDimension();

          expect(result).toEqual(expected);
        });
      });

      it('should capture the initial scroll of the scrollest scrollable', () => {
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
        jest.spyOn(parent, 'getBoundingClientRect').mockImplementation(() => frame);
        jest.spyOn(droppable, 'getBoundingClientRect').mockImplementation(() => borderBox);
        const expected: DroppableDimension = getDroppableDimension({
          descriptor,
          borderBox,
          closest: {
            frameBorderBox: frame,
            scrollWidth: frame.width,
            scrollHeight: frame.height,
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
        jest.spyOn(parent, 'getBoundingClientRect').mockImplementation(() => frame);
        jest.spyOn(droppable, 'getBoundingClientRect').mockImplementation(() => borderBox);
        const expected: DroppableDimension = getDroppableDimension({
          descriptor,
          borderBox,
          closest: {
            frameBorderBox: frame,
            scrollWidth: frame.width,
            scrollHeight: frame.height,
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
      const parent: HTMLElement = wrapper.getDOMNode();
      const droppable: HTMLElement = wrapper.instance().getRef();
      jest.spyOn(parent, 'getBoundingClientRect').mockImplementation(() => frame);
      jest.spyOn(droppable, 'getBoundingClientRect').mockImplementation(() => borderBox);

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
