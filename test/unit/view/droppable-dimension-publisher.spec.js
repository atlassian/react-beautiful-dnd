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

const noSpacing = {
  ...noMargin,
  ...noPadding,
};

const preset = getPreset();

type ScrollableItemProps = {
  // scrollable item prop (default: false)
  isDropDisabled?: boolean,
  droppableId?: DroppableId,
  type?: TypeId,
}

type ScrollableItemState = {|
  ref: ?HTMLElement
|}

class ScrollableItem extends Component<ScrollableItemProps, ScrollableItemState> {
  /* eslint-disable react/sort-comp */

  state = {
    ref: null,
  }

  setRef = (ref: ?HTMLElement) => {
    this.setState({
      ref,
    });
  }

  render() {
    return (
      <DroppableDimensionPublisher
        droppableId={this.props.droppableId || preset.home.descriptor.id}
        type={this.props.type || preset.home.descriptor.type}
        direction={preset.home.axis.direction}
        isDropDisabled={this.props.isDropDisabled === true}
        ignoreContainerClipping={false}
        targetRef={this.state.ref}
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

const getMarshalStub = (): DimensionMarshal => ({
  registerDraggable: jest.fn(),
  unregisterDraggable: jest.fn(),
  registerDroppable: jest.fn(),
  unregisterDroppable: jest.fn(),
  updateDroppableScroll: jest.fn(),
  updateDroppableIsEnabled: jest.fn(),
  onPhaseChange: jest.fn(),
});

describe('DraggableDimensionPublisher', () => {
  const originalWindowScroll: Position = {
    x: window.pageXOffset,
    y: window.pageYOffset,
  };

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
        client: getArea({
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        }),
      });

      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        top: expected.page.withoutMargin.top,
        bottom: expected.page.withoutMargin.bottom,
        left: expected.page.withoutMargin.left,
        right: expected.page.withoutMargin.right,
        height: expected.page.withoutMargin.height,
        width: expected.page.withoutMargin.width,
      }));
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => noSpacing);

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
        client: getArea({
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        }),
        margin,
      });
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        top: expected.page.withoutMargin.top,
        bottom: expected.page.withoutMargin.bottom,
        left: expected.page.withoutMargin.left,
        right: expected.page.withoutMargin.right,
        height: expected.page.withoutMargin.height,
        width: expected.page.withoutMargin.width,
      }));
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
        marginTop: `${margin.top}`,
        marginRight: `${margin.right}`,
        marginBottom: `${margin.bottom}`,
        marginLeft: `${margin.left}`,
        ...noPadding,
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

    it('should consider the window scroll when calculating dimensions', () => {
      const marshal: DimensionMarshal = getMarshalStub();
      const windowScroll: Position = {
        x: 500,
        y: 1000,
      };
      setWindowScroll(windowScroll, { shouldPublish: false });
      const client: Area = getArea({
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
        client,
      });
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => client);
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => noSpacing);

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

    it('should capture the initial scroll containers current scroll', () => {
      const marshal: DimensionMarshal = getMarshalStub();
      const frameScroll: Position = {
        x: 500,
        y: 1000,
      };
      const expected: DroppableDimension = getDroppableDimension({
        descriptor: {
          id: 'my-fake-id',
          type: 'fake',
        },
        client: getArea({
          top: 0,
          right: 100,
          bottom: 200,
          left: 0,
        }),
        frameScroll,
      });
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        top: expected.page.withoutMargin.top,
        bottom: expected.page.withoutMargin.bottom,
        left: expected.page.withoutMargin.left,
        right: expected.page.withoutMargin.right,
        height: expected.page.withoutMargin.height,
        width: expected.page.withoutMargin.width,
      }));
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
        overflow: 'auto',
        ...noSpacing,
      }));
      const wrapper = mount(
        <ScrollableItem
          droppableId={expected.descriptor.id}
          type={expected.descriptor.type}
        />,
        withDimensionMarshal(marshal)
      );
      // setting initial scroll
      const container: HTMLElement = wrapper.getDOMNode();
      container.scrollLeft = frameScroll.x;
      container.scrollTop = frameScroll.y;

      // pull the get dimension function out
      const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
      // execute it to get the dimension
      const result: DroppableDimension = callbacks.getDimension();

      expect(result).toEqual(expected);
    });

    describe('calculating the frame', () => {
      const frame: Area = getArea({
        top: 0,
        left: 0,
        right: 150,
        bottom: 150,
      });
      const client: Area = getArea({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      });
      const descriptor: DroppableDescriptor = {
        id: 'a cool droppable',
        type: 'cool',
      };

      const dimensionWithoutScrollParent: DroppableDimension = getDroppableDimension({
        descriptor,
        client,
      });
      const dimensionWithScrollParent: DroppableDimension = getDroppableDimension({
        descriptor,
        client,
        frameClient: frame,
      });

      type AppProps = {
        droppableIsScrollable?: boolean,
        parentIsScrollable?: boolean,
        ignoreContainerClipping: boolean,
      };
      type AppState = {
        ref: ?HTMLElement,
      }

      class App extends Component<AppProps, AppState> {
        static defaultProps = {
          onPublish: () => {},
          ignoreContainerClipping: false,
        }

        state = { ref: null }
        setRef = ref => this.setState({ ref })
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
                overflow: parentIsScrollable ? 'scroll' : 'visible',
              }}
            >
              <div>
                <div
                  ref={this.setRef}
                  className="droppable"
                  style={{
                    height: client.height,
                    width: client.width,
                    padding: 0,
                    margin: 0,
                    overflow: droppableIsScrollable ? 'scroll' : 'visible',
                  }}
                >
                  <DroppableDimensionPublisher
                    droppableId={descriptor.id}
                    direction="vertical"
                    isDropDisabled={false}
                    type={descriptor.type}
                    targetRef={this.state.ref}
                    ignoreContainerClipping={ignoreContainerClipping}
                  >
                    <div>hello world</div>
                  </DroppableDimensionPublisher>
                </div>
              </div>
            </div>
          );
        }
      }

      it('should detect a scrollable parent', () => {
        const marshal: DimensionMarshal = getMarshalStub();
        const wrapper = mount(
          <App
            parentIsScrollable
            droppableIsScrollable={false}
          />,
          withDimensionMarshal(marshal),
        );
        const parentNode = wrapper.getDOMNode();
        const droppableNode = wrapper.state().ref;
        jest.spyOn(parentNode, 'getBoundingClientRect').mockImplementation(() => frame);
        jest.spyOn(droppableNode, 'getBoundingClientRect').mockImplementation(() => client);

        // pull the get dimension function out
        const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
        // execute it to get the dimension
        const result: DroppableDimension = callbacks.getDimension();

        expect(result).toEqual(dimensionWithScrollParent);
      });

      it('should ignore any parents if they are not scroll containers', () => {
        const marshal: DimensionMarshal = getMarshalStub();
        const wrapper = mount(
          <App
            parentIsScrollable={false}
          />,
          withDimensionMarshal(marshal),
        );
        const parentNode = wrapper.getDOMNode();
        const droppableNode = wrapper.state().ref;
        jest.spyOn(parentNode, 'getBoundingClientRect').mockImplementation(() => frame);
        jest.spyOn(droppableNode, 'getBoundingClientRect').mockImplementation(() => client);

        // pull the get dimension function out
        const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
        // execute it to get the dimension
        const result: DroppableDimension = callbacks.getDimension();

        expect(result).toEqual(dimensionWithoutScrollParent);
      });

      it('should use itself as the frame if the droppable is scrollable', () => {
        const marshal: DimensionMarshal = getMarshalStub();
        // both the droppable and the parent are scrollable
        const wrapper = mount(
          <App
            droppableIsScrollable
            parentIsScrollable
          />,
          withDimensionMarshal(marshal),
        );
        const parentNode = wrapper.getDOMNode();
        const droppableNode = wrapper.state().ref;
        jest.spyOn(parentNode, 'getBoundingClientRect').mockImplementation(() => frame);
        jest.spyOn(droppableNode, 'getBoundingClientRect').mockImplementation(() => client);

        // pull the get dimension function out
        const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
        // execute it to get the dimension
        const result: DroppableDimension = callbacks.getDimension();

        expect(result).toEqual(dimensionWithoutScrollParent);
      });

      it('should return ignore the parent frame when ignoreContainerClipping is set', () => {
        const marshal: DimensionMarshal = getMarshalStub();
        const wrapper = mount(
          <App
            parentIsScrollable
            ignoreContainerClipping
          />,
          withDimensionMarshal(marshal),
        );
        const parentNode = wrapper.getDOMNode();
        const droppableNode = wrapper.state().ref;
        jest.spyOn(parentNode, 'getBoundingClientRect').mockImplementation(() => frame);
        jest.spyOn(droppableNode, 'getBoundingClientRect').mockImplementation(() => client);

        // pull the get dimension function out
        const callbacks: DroppableCallbacks = marshal.registerDroppable.mock.calls[0][1];
        // execute it to get the dimension
        const result: DroppableDimension = callbacks.getDimension();

        expect(result).toEqual(dimensionWithoutScrollParent);
      });
    });
  });

  describe('scroll watching', () => {
    const scroll = (el: HTMLElement, target: Position) => {
      el.scrollTop = target.y;
      el.scrollLeft = target.x;
      el.dispatchEvent(new Event('scroll'));
    };

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
      callbacks.watchScroll();

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
      callbacks.watchScroll();

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
      callbacks.watchScroll();

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
      callbacks.watchScroll();

      // first event
      scroll(container, { x: 500, y: 1000 });
      // release the frame
      requestAnimationFrame.step();
      expect(marshal.updateDroppableScroll).toHaveBeenCalledTimes(1);
      marshal.updateDroppableScroll.mockReset();

      callbacks.unwatchScroll();

      // scroll event after no longer watching
      scroll(container, { x: 190, y: 400 });
      // let any frames go that want to
      requestAnimationFrame.flush();
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
      callbacks.watchScroll();

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
      callbacks.watchScroll();

      wrapper.unmount();

      // second event - will not fire any updates
      scroll(container, { x: 100, y: 300 });
      requestAnimationFrame.step();
      expect(marshal.updateDroppableScroll).not.toHaveBeenCalled();
      // also logs a warning
      expect(console.warn).toHaveBeenCalled();

      // cleanup
      console.warn.mockRestore();
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
