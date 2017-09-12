// @flow
/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import { mount } from 'enzyme';
import DroppableDimensionPublisher from '../../../src/view/droppable-dimension-publisher/droppable-dimension-publisher';
import { getDroppableDimension } from '../../../src/state/dimension';
// eslint-disable-next-line no-duplicate-imports
import type { Margin, ClientRect } from '../../../src/state/dimension';
import getClientRect from '../../utils/get-client-rect';
import setWindowScroll from '../../utils/set-window-scroll';
import type {
  DroppableId,
  DroppableDimension,
  HTMLElement,
  Position,
  ReactElement,
} from '../../../src/types';

const droppableId: DroppableId = 'drop-1';
const droppable: DroppableDimension = getDroppableDimension({
  id: droppableId,
  clientRect: getClientRect({
    top: 0,
    right: 100,
    bottom: 100,
    left: 0,
  }),
});

class ScrollableItem extends Component {
  /* eslint-disable react/sort-comp */
  props: {
    publish: (dimension: DroppableDimension) => void,
    updateScroll: (id: DroppableId, offset: Position) => void,
    shouldPublish?: boolean,
  }

  state: {|
    ref: ?HTMLElement
  |}

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
    // $ExpectError - for an unknown reason flow is having a hard time with this
      <DroppableDimensionPublisher
        droppableId={droppableId}
        type="TYPE"
        targetRef={this.state.ref}
        shouldPublish={Boolean(this.props.shouldPublish)}
        publish={this.props.publish}
        updateScroll={this.props.updateScroll}
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

  describe('dimension publishing', () => {
    it('should not publish if not asked to', () => {
      const publish = jest.fn();
      const updateScroll = jest.fn();

      const wrapper = mount(
        <ScrollableItem
          publish={publish}
          updateScroll={updateScroll}
        />,
      );

      wrapper.setProps({
        shouldPublish: false,
      });

      expect(publish).not.toHaveBeenCalled();
      expect(updateScroll).not.toHaveBeenCalled();

      wrapper.unmount();
    });

    it('should publish the dimensions of the target', () => {
      const publish = jest.fn();
      const updateScroll = jest.fn();
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        top: droppable.page.withoutMargin.top,
        bottom: droppable.page.withoutMargin.bottom,
        left: droppable.page.withoutMargin.left,
        right: droppable.page.withoutMargin.right,
        height: droppable.page.withoutMargin.height,
        width: droppable.page.withoutMargin.width,
      }));
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
        marginTop: '0',
        marginRight: '0',
        marginBottom: '0',
        marginLeft: '0',
      }));

      const wrapper = mount(
        <ScrollableItem
          publish={publish}
          updateScroll={updateScroll}
        />,
      );
      wrapper.setProps({
        shouldPublish: true,
      });

      expect(publish).toBeCalledWith(droppable);
      expect(publish).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });

    it('should consider any margins when calculating dimensions', () => {
      const margin: Margin = {
        top: 10,
        right: 30,
        bottom: 40,
        left: 50,
      };
      const publish = jest.fn();
      const updateScroll = jest.fn();
      const expected: DroppableDimension = getDroppableDimension({
        id: droppableId,
        clientRect: getClientRect({
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        }),
        margin,
      });
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        top: droppable.page.withoutMargin.top,
        bottom: droppable.page.withoutMargin.bottom,
        left: droppable.page.withoutMargin.left,
        right: droppable.page.withoutMargin.right,
        height: droppable.page.withoutMargin.height,
        width: droppable.page.withoutMargin.width,
      }));
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
        marginTop: `${margin.top}`,
        marginRight: `${margin.right}`,
        marginBottom: `${margin.bottom}`,
        marginLeft: `${margin.left}`,
      }));

      const wrapper = mount(
        <ScrollableItem
          publish={publish}
          updateScroll={updateScroll}
        />,
      );
      wrapper.setProps({
        shouldPublish: true,
      });

      expect(publish).toBeCalledWith(expected);

      wrapper.unmount();
    });

    it('should consider the window scroll when calculating dimensions', () => {
      const publish = jest.fn();
      const updateScroll = jest.fn();
      const windowScroll: Position = {
        x: 500,
        y: 1000,
      };
      setWindowScroll(windowScroll, { shouldPublish: false });
      const clientRect: ClientRect = getClientRect({
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
      });
      const expected: DroppableDimension = getDroppableDimension({
        id: droppableId,
        clientRect,
        windowScroll,
      });
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => clientRect);
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
        marginTop: '0',
        marginRight: '0',
        marginBottom: '0',
        marginLeft: '0',
      }));
      const wrapper = mount(
        <ScrollableItem
          publish={publish}
          updateScroll={updateScroll}
        />,
      );

      wrapper.setProps({
        shouldPublish: true,
      });

      expect(publish).toHaveBeenCalledWith(expected);

      wrapper.unmount();
    });

    it('should consider the closest scrollable when calculating dimensions', () => {
      const publish = jest.fn();
      const updateScroll = jest.fn();
      const closestScroll: Position = {
        x: 500,
        y: 1000,
      };
      const expected: DroppableDimension = getDroppableDimension({
        id: droppableId,
        clientRect: getClientRect({
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        }),
        scroll: closestScroll,
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
        overflowY: 'scroll',
        marginTop: '0',
        marginRight: '0',
        marginBottom: '0',
        marginLeft: '0',
      }));
      const wrapper = mount(
        <ScrollableItem
          publish={publish}
          updateScroll={updateScroll}
        />,
      );
      // setting initial scroll
      const container: HTMLElement = wrapper.getDOMNode();
      container.scrollTop = closestScroll.y;
      container.scrollLeft = closestScroll.x;

      wrapper.setProps({
        shouldPublish: true,
      });

      expect(publish).toHaveBeenCalledWith(expected);

      wrapper.unmount();
    });

    it('should not publish unless it is freshly required to do so', () => {
      const publish = jest.fn();
      const updateScroll = jest.fn();
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        top: droppable.page.withMargin.top,
        bottom: droppable.page.withMargin.bottom,
        left: droppable.page.withMargin.left,
        right: droppable.page.withMargin.right,
        height: droppable.page.withMargin.height,
        width: droppable.page.withMargin.width,
      }));

      // initial publish
      const wrapper = mount(
        <ScrollableItem
          publish={publish}
          updateScroll={updateScroll}
        />,
      );
      wrapper.setProps({
        shouldPublish: true,
      });
      expect(publish).toHaveBeenCalledTimes(1);

      // should not publish if the props have not changed
      wrapper.update();
      expect(publish).toHaveBeenCalledTimes(1);

      // should publish when freshly required to do so
      wrapper.setProps({
        shouldPublish: false,
        publish,
      });
      wrapper.setProps({
        shouldPublish: true,
        publish,
      });
      expect(publish).toHaveBeenCalledTimes(2);

      // just being extra safe:
      expect(updateScroll).not.toHaveBeenCalled();

      wrapper.unmount();
    });

    describe('dimension clipping', () => {
      type ItemProps = {
        publish: (dimension: DroppableDimension) => void,
        updateScroll: (id: DroppableId, offset: Position) => void,
        shouldPublish?: boolean,
      };

      class ScrollParent extends Component {
        props: {
          children: ?ReactElement
        }

        render() {
          return (
            <div className="scroll-parent" >
              { this.props.children }
            </div>
          );
        }
      }

      class Item extends Component {
        /* eslint-disable react/sort-comp */
        props: ItemProps

        state: {|
        ref: ?HTMLElement
        |}

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
            <div
              ref={this.setRef}
              className="item"
            >
              {/* $ExpectError */ }
              <DroppableDimensionPublisher
                droppableId={droppableId}
                type="TYPE"
                targetRef={this.state.ref}
                shouldPublish={Boolean(this.props.shouldPublish)}
                publish={this.props.publish}
                updateScroll={this.props.updateScroll}
              >
                <div>hello world</div>
              </DroppableDimensionPublisher>
            </div>
          );
        }
      }

      class App extends Component {
        props: ItemProps

        render() {
          return (
            <ScrollParent>
              <Item
                publish={this.props.publish}
                updateScroll={this.props.updateScroll}
                shouldPublish={this.props.shouldPublish}
              />
            </ScrollParent>
          );
        }
      }

      it('should clip a dimension by the size of its scroll parent', () => {
        const publish = jest.fn();
        const updateScroll = jest.fn();
        const scrollParentRect: ClientRect = getClientRect({
          top: 0,
          bottom: 100,
          left: 0,
          right: 100,
        });
        const expected = getDroppableDimension({
          id: droppableId,
          clientRect: scrollParentRect,
        });
        (() => {
          let count = 0;
          jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => {
            // first call is item
            if (count === 0) {
              count++;
              // 10px bigger in every direction from the scroll parent
              return getClientRect({
                top: -10,
                bottom: 110,
                left: -10,
                right: 110,
              });
            }

            // second call is to the scroll parent
            return scrollParentRect;
          });
        })();

        jest.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
          const noMargin = {
            marginTop: '0',
            marginRight: '0',
            marginBottom: '0',
            marginLeft: '0',
          };

          if (el.className === 'item') {
            return noMargin;
          }

          if (el.className === 'scroll-parent') {
            return {
              ...noMargin,
              overflow: 'auto',
            };
          }

          throw new Error('unknown el');
        });

        const wrapper = mount(
          <App
            publish={publish}
            updateScroll={updateScroll}
          />
        );
        wrapper.setProps({
          shouldPublish: true,
        });

        expect(publish).toBeCalledWith(expected);
        expect(publish).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('scroll watching', () => {
    it('should not publish any scroll changes unless told it can publish', () => {
      const publish = jest.fn();
      const updateScroll = jest.fn();
      const wrapper = mount(
        <ScrollableItem
          publish={publish}
          updateScroll={updateScroll}
        />,
      );

      const container: HTMLElement = wrapper.getDOMNode();

      if (!container.classList.contains('scroll-container')) {
        throw new Error('incorrect dom node collected');
      }

      // a few scroll events
      container.scrollTop = 1000;
      container.dispatchEvent(new Event('scroll'));
      container.dispatchEvent(new Event('scroll'));
      container.dispatchEvent(new Event('scroll'));
      // flush any pending frames
      requestAnimationFrame.flush();

      expect(updateScroll).not.toHaveBeenCalled();

      wrapper.unmount();
    });

    it('should publish the closest scrollable scroll offset', () => {
      const publish = jest.fn();
      const updateScroll = jest.fn();
      const wrapper = mount(
        <ScrollableItem
          publish={publish}
          updateScroll={updateScroll}
        />,
      );
      wrapper.setProps({
        shouldPublish: true,
      });
      const container: HTMLElement = wrapper.getDOMNode();

      if (!container.classList.contains('scroll-container')) {
        throw new Error('incorrect dom node collected');
      }

      container.scrollTop = 1000;
      container.scrollLeft = 500;
      container.dispatchEvent(new Event('scroll'));
      // release the update animation frame
      requestAnimationFrame.step();

      expect(updateScroll.mock.calls[0]).toEqual([
        droppableId, { x: 500, y: 1000 },
      ]);

      wrapper.unmount();
    });

    it('should throttle multiple scrolls into a animation frame', () => {
      const publish = jest.fn();
      const updateScroll = jest.fn();
      const wrapper = mount(
        <ScrollableItem
          publish={publish}
          updateScroll={updateScroll}
        />,
      );
      wrapper.setProps({
        shouldPublish: true,
      });
      const container: HTMLElement = wrapper.getDOMNode();

      // first event
      container.scrollTop = 1000;
      container.scrollLeft = 500;
      container.dispatchEvent(new Event('scroll'));

      // second event in same frame
      container.scrollTop = 800;
      container.scrollLeft = 200;
      container.dispatchEvent(new Event('scroll'));

      // release the update animation frame
      requestAnimationFrame.step();

      expect(updateScroll).toHaveBeenCalledTimes(1);
      expect(updateScroll.mock.calls[0]).toEqual([
        droppableId, { x: 200, y: 800 },
      ]);

      // also checking that no loose frames are stored up
      requestAnimationFrame.flush();
      expect(updateScroll).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });

    it('should not fire a scroll if the value has not changed since the previous frame', () => {
      // this can happen if you scroll backward and forward super quick
      const publish = jest.fn();
      const updateScroll = jest.fn();
      const wrapper = mount(
        <ScrollableItem
          publish={publish}
          updateScroll={updateScroll}
        />,
      );
      wrapper.setProps({
        shouldPublish: true,
      });
      const container: HTMLElement = wrapper.getDOMNode();

      // first event
      container.scrollTop = 1000;
      container.scrollLeft = 500;
      container.dispatchEvent(new Event('scroll'));
      requestAnimationFrame.step();
      expect(updateScroll).toHaveBeenCalledTimes(1);
      expect(updateScroll.mock.calls[0]).toEqual([
        droppableId, { x: 500, y: 1000 },
      ]);

      // second event
      container.scrollTop = 1001;
      container.scrollLeft = 501;
      container.dispatchEvent(new Event('scroll'));
      // no frame to release change yet

      // third event - back to original value
      container.scrollTop = 1000;
      container.scrollLeft = 500;
      container.dispatchEvent(new Event('scroll'));

      requestAnimationFrame.step();
      expect(updateScroll).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });

    it('should stop watching scroll when no longer required to publish', () => {
      // this can happen if you scroll backward and forward super quick
      const publish = jest.fn();
      const updateScroll = jest.fn();
      const wrapper = mount(
        <ScrollableItem
          publish={publish}
          updateScroll={updateScroll}
        />,
      );
      wrapper.setProps({
        shouldPublish: true,
      });
      const container: HTMLElement = wrapper.getDOMNode();

      // first event
      container.scrollTop = 1000;
      container.scrollLeft = 500;
      container.dispatchEvent(new Event('scroll'));
      requestAnimationFrame.step();
      expect(updateScroll).toHaveBeenCalledTimes(1);

      wrapper.setProps({
        shouldPublish: false,
      });

      container.scrollTop = 1001;
      container.scrollLeft = 501;
      container.dispatchEvent(new Event('scroll'));

      // let any frames go that want to
      requestAnimationFrame.flush();
      expect(updateScroll).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });

    it('should not publish a scroll update after requested not to update while an animation frame is occurring', () => {
      const publish = jest.fn();
      const updateScroll = jest.fn();
      const wrapper = mount(
        <ScrollableItem
          publish={publish}
          updateScroll={updateScroll}
        />,
      );
      wrapper.setProps({
        shouldPublish: true,
      });
      const container: HTMLElement = wrapper.getDOMNode();

      // first event
      container.scrollTop = 1000;
      container.scrollLeft = 500;
      container.dispatchEvent(new Event('scroll'));
      requestAnimationFrame.step();
      expect(updateScroll).toHaveBeenCalledTimes(1);

      // second event
      container.scrollTop = 1001;
      container.scrollLeft = 501;
      container.dispatchEvent(new Event('scroll'));

      // no animation frame to release event fired yet

      wrapper.setProps({
        shouldPublish: false,
      });

      requestAnimationFrame.flush();
      expect(updateScroll).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });

    it('should stop watching for scroll events when the component is unmounted', () => {
      const publish = jest.fn();
      const updateScroll = jest.fn();
      const wrapper = mount(
        <ScrollableItem
          publish={publish}
          updateScroll={updateScroll}
        />,
      );
      wrapper.setProps({
        shouldPublish: true,
      });
      const container: HTMLElement = wrapper.getDOMNode();

      // first event
      container.scrollTop = 1000;
      container.scrollLeft = 500;
      container.dispatchEvent(new Event('scroll'));
      requestAnimationFrame.step();
      expect(updateScroll).toHaveBeenCalledTimes(1);

      wrapper.unmount();

      // second event
      container.scrollTop = 1001;
      container.scrollLeft = 501;
      container.dispatchEvent(new Event('scroll'));
      requestAnimationFrame.step();
      expect(updateScroll).toHaveBeenCalledTimes(1);
    });
  });
});
