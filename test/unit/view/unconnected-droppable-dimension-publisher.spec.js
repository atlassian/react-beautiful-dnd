// @flow
/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import { mount } from 'enzyme';
import DroppableDimensionPublisher from '../../../src/view/droppable-dimension-publisher/droppable-dimension-publisher';
import { getDroppableDimension } from '../../../src/state/dimension';
import getClientRect from '../../../src/state/get-client-rect';
import setWindowScroll from '../../utils/set-window-scroll';
import type {
  ClientRect,
  Spacing,
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
const origin: Position = { x: 0, y: 0 };

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

class ScrollableItem extends Component {
  /* eslint-disable react/sort-comp */
  props: {
    // dispatch props
    publish: (dimension: DroppableDimension) => void,
    updateScroll: (id: DroppableId, offset: Position) => void,
    updateIsEnabled: (id: DroppableId, isEnabled: boolean) => void,
    // map props (default: false)
    shouldPublish?: boolean,
    // scrollable item prop (default: false)
    isDropDisabled?: boolean,
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
      <DroppableDimensionPublisher
        droppableId={droppableId}
        direction="vertical"
        isDropDisabled={this.props.isDropDisabled === true}
        type="TYPE"
        targetRef={this.state.ref}
        publish={this.props.publish}
        updateIsEnabled={this.props.updateIsEnabled}
        shouldPublish={Boolean(this.props.shouldPublish)}
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
  let publish;
  let updateScroll;
  let updateIsEnabled;
  let dispatchProps;
  let wrapper;

  beforeEach(() => {
    publish = jest.fn();
    updateScroll = jest.fn();
    updateIsEnabled = jest.fn();
    dispatchProps = {
      publish, updateScroll, updateIsEnabled,
    };
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

    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('dimension publishing', () => {
    it('should not publish if not asked to', () => {
      wrapper = mount(
        <ScrollableItem {...dispatchProps} />,
      );

      wrapper.setProps({
        shouldPublish: false,
      });

      expect(publish).not.toHaveBeenCalled();
      expect(updateScroll).not.toHaveBeenCalled();
      expect(updateIsEnabled).not.toHaveBeenCalled();
    });

    it('should publish the dimensions of the target', () => {
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        top: droppable.page.withoutMargin.top,
        bottom: droppable.page.withoutMargin.bottom,
        left: droppable.page.withoutMargin.left,
        right: droppable.page.withoutMargin.right,
        height: droppable.page.withoutMargin.height,
        width: droppable.page.withoutMargin.width,
      }));
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => noSpacing);

      wrapper = mount(
        <ScrollableItem {...dispatchProps} />,
      );
      wrapper.setProps({
        shouldPublish: true,
      });

      expect(publish).toBeCalledWith(droppable);
      expect(publish).toHaveBeenCalledTimes(1);
    });

    it('should consider any margins when calculating dimensions', () => {
      const margin: Spacing = {
        top: 10,
        right: 30,
        bottom: 40,
        left: 50,
      };
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
        ...noPadding,
      }));

      wrapper = mount(
        <ScrollableItem {...dispatchProps} />,
      );
      wrapper.setProps({
        shouldPublish: true,
      });

      expect(publish).toBeCalledWith(expected);
    });

    it('should consider the window scroll when calculating dimensions', () => {
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
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => noSpacing);
      wrapper = mount(
        <ScrollableItem {...dispatchProps} />,
      );

      wrapper.setProps({
        shouldPublish: true,
      });

      expect(publish).toHaveBeenCalledWith(expected);
    });

    it('should consider the closest scrollable when calculating dimensions', () => {
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
        ...noSpacing,
      }));
      wrapper = mount(
        <ScrollableItem {...dispatchProps} />,
      );
      // setting initial scroll
      const container: HTMLElement = wrapper.getDOMNode();
      container.scrollTop = closestScroll.y;
      container.scrollLeft = closestScroll.x;

      wrapper.setProps({
        shouldPublish: true,
      });

      expect(publish).toHaveBeenCalledWith(expected);
    });

    it('should not publish unless it is freshly required to do so', () => {
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        top: droppable.page.withMargin.top,
        bottom: droppable.page.withMargin.bottom,
        left: droppable.page.withMargin.left,
        right: droppable.page.withMargin.right,
        height: droppable.page.withMargin.height,
        width: droppable.page.withMargin.width,
      }));

      // initial publish
      wrapper = mount(
        <ScrollableItem {...dispatchProps} />,
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
    });

    describe('dimension clipping', () => {
      type ItemProps = {
        publish: (dimension: DroppableDimension) => void,
        updateScroll: (id: DroppableId, offset: Position) => void,
        updateIsEnabled: (id: DroppableId, isEnabled: boolean) => void,
        shouldPublish?: boolean,
      };

      class ScrollParent extends Component {
        props: {
          children: ?ReactElement
        }

        render() {
          return (
            <div className="scroll-parent" >
              {this.props.children}
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
              <DroppableDimensionPublisher
                droppableId={droppableId}
                direction="vertical"
                isDropDisabled={false}
                type="TYPE"
                targetRef={this.state.ref}
                shouldPublish={Boolean(this.props.shouldPublish)}
                publish={this.props.publish}
                updateScroll={this.props.updateScroll}
                updateIsEnabled={this.props.updateIsEnabled}
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
                updateIsEnabled={this.props.updateIsEnabled}
              />
            </ScrollParent>
          );
        }
      }

      type ExecuteArgs = {|
        droppableRect: ClientRect,
        scrollParentRect: ClientRect,
        scrollParentScroll?: Position,
      |}

      const execute = ({
        droppableRect,
        scrollParentRect,
        scrollParentScroll = origin,
      }: ExecuteArgs) => {
        wrapper = mount(
          <App
            publish={publish}
            updateScroll={updateScroll}
            updateIsEnabled={updateIsEnabled}
          />
        );

        const scrollParentNode: HTMLElement = wrapper.getDOMNode();

        if (!scrollParentNode.classList.contains('scroll-parent')) {
          throw new Error('scroll parent node not obtained correctly');
        }

        const droppableNode: HTMLElement = scrollParentNode.querySelector('.item');

        scrollParentNode.scrollLeft = scrollParentScroll.x;
        scrollParentNode.scrollTop = scrollParentScroll.y;

        jest.spyOn(scrollParentNode, 'getBoundingClientRect').mockImplementationOnce(() => scrollParentRect);
        jest.spyOn(droppableNode, 'getBoundingClientRect').mockImplementationOnce(() => droppableRect);

        jest.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
          if (el === droppableNode) {
            return noSpacing;
          }

          if (el === scrollParentNode) {
            return {
              ...noSpacing,
              overflow: 'auto',
            };
          }

          throw new Error('unknown el');
        });

        wrapper.setProps({
          shouldPublish: true,
        });
      };

      it('should clip the dimension by the size of the scroll parent', () => {
        const droppableRect: ClientRect = getClientRect({
          top: 0,
          bottom: 100,
          left: 0,
          right: 100,
        });
        // smaller by 10px in every direction
        const scrollParentRect: ClientRect = getClientRect({
          top: 10,
          bottom: 90,
          left: 10,
          right: 90,
        });
        const expected = getDroppableDimension({
          id: droppableId,
          // because it is smaller in every direction
          // the result will be the scroll parent rect
          clientRect: scrollParentRect,
        });

        execute({ droppableRect, scrollParentRect });

        // the trimmed rect
        expect(publish).toBeCalledWith(expected);
        expect(publish).toHaveBeenCalledTimes(1);
      });

      describe('dimension clipping by edge', () => {
        const base = {
          top: 0,
          bottom: 100,
          left: 0,
          right: 100,
        };
        const droppableRect: ClientRect = getClientRect(base);

        describe('cut off by scroll container', () => {
          it('should choose the biggest top value', () => {
            const scrollParentRect: ClientRect = getClientRect({
              ...base,
              top: 10,
            });
            const expected = getDroppableDimension({
              id: droppableId,
              clientRect: getClientRect({
                ...base,
                top: 10,
              }),
            });

            execute({ droppableRect, scrollParentRect });

            // the trimmed rect
            expect(publish).toBeCalledWith(expected);
            expect(publish).toHaveBeenCalledTimes(1);
          });

          it('should choose the biggest left value', () => {
            const scrollParentRect: ClientRect = getClientRect({
              ...base,
              left: 10,
            });
            const expected = getDroppableDimension({
              id: droppableId,
              clientRect: getClientRect({
                ...base,
                left: 10,
              }),
            });

            execute({ droppableRect, scrollParentRect });

            // the trimmed rect
            expect(publish).toBeCalledWith(expected);
            expect(publish).toHaveBeenCalledTimes(1);
          });

          it('should choose the smallest right value', () => {
            const scrollParentRect: ClientRect = getClientRect({
              ...base,
              right: 90,
            });
            const expected = getDroppableDimension({
              id: droppableId,
              clientRect: getClientRect({
                ...base,
                right: 90,
              }),
            });

            execute({ droppableRect, scrollParentRect });

            // the trimmed rect
            expect(publish).toBeCalledWith(expected);
            expect(publish).toHaveBeenCalledTimes(1);
          });

          it('should choose the smallest bottom value', () => {
            const scrollParentRect: ClientRect = getClientRect({
              ...base,
              bottom: 90,
            });
            const expected = getDroppableDimension({
              id: droppableId,
              clientRect: getClientRect({
                ...base,
                bottom: 90,
              }),
            });

            execute({ droppableRect, scrollParentRect });

            // the trimmed rect
            expect(publish).toBeCalledWith(expected);
            expect(publish).toHaveBeenCalledTimes(1);
          });
        });

        describe('cut off by droppable rect', () => {
          it('should choose the biggest top value', () => {
            const scrollParentRect: ClientRect = getClientRect({
              ...base,
              top: -10,
            });
            const expected = getDroppableDimension({
              id: droppableId,
              clientRect: getClientRect(base),
            });

            execute({ droppableRect, scrollParentRect });

            // the trimmed rect
            expect(publish).toBeCalledWith(expected);
            expect(publish).toHaveBeenCalledTimes(1);
          });

          it('should choose the biggest left value', () => {
            const scrollParentRect: ClientRect = getClientRect({
              ...base,
              left: -10,
            });
            const expected = getDroppableDimension({
              id: droppableId,
              clientRect: getClientRect(base),
            });

            execute({ droppableRect, scrollParentRect });

            // the trimmed rect
            expect(publish).toBeCalledWith(expected);
            expect(publish).toHaveBeenCalledTimes(1);
          });

          it('should choose the smallest right value', () => {
            const scrollParentRect: ClientRect = getClientRect({
              ...base,
              right: 110,
            });
            const expected = getDroppableDimension({
              id: droppableId,
              clientRect: getClientRect(base),
            });

            execute({ droppableRect, scrollParentRect });

            // the trimmed rect
            expect(publish).toBeCalledWith(expected);
            expect(publish).toHaveBeenCalledTimes(1);
          });

          it('should choose the smallest bottom value', () => {
            const scrollParentRect: ClientRect = getClientRect({
              ...base,
              bottom: 110,
            });
            const expected = getDroppableDimension({
              id: droppableId,
              clientRect: getClientRect(base),
            });

            execute({ droppableRect, scrollParentRect });

            // the trimmed rect
            expect(publish).toBeCalledWith(expected);
            expect(publish).toHaveBeenCalledTimes(1);
          });
        });
      });

      it('should take into account the parents scroll when clipping', () => {
        const base = {
          top: 0,
          bottom: 100,
          left: 0,
          right: 100,
        };
        const scrollParentScroll: Position = {
          x: 100,
          y: 100,
        };
        // rect will have the scroll subtracted when measurements are taken
        const droppableRect: ClientRect = getClientRect({
          top: base.top - scrollParentScroll.y,
          bottom: base.bottom - scrollParentScroll.y,
          left: base.left - scrollParentScroll.x,
          right: base.right - scrollParentScroll.x,
        });
        const scrollParentRect: ClientRect = getClientRect(base);
        const expected: DroppableDimension = getDroppableDimension({
          id: droppableId,
          scroll: scrollParentScroll,
          clientRect: getClientRect(base),
        });

        execute({ droppableRect, scrollParentRect, scrollParentScroll });

        expect(publish).toBeCalledWith(expected);
        expect(publish).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('scroll watching', () => {
    it('should not publish any scroll changes unless told it can publish', () => {
      wrapper = mount(
        <ScrollableItem {...dispatchProps} />,
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
    });

    it('should publish the closest scrollable scroll offset', () => {
      wrapper = mount(
        <ScrollableItem {...dispatchProps} />,
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
    });

    it('should throttle multiple scrolls into a animation frame', () => {
      wrapper = mount(
        <ScrollableItem {...dispatchProps} />,
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
    });

    it('should not fire a scroll if the value has not changed since the previous frame', () => {
      // this can happen if you scroll backward and forward super quick
      wrapper = mount(
        <ScrollableItem {...dispatchProps} />,
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
    });

    it('should stop watching scroll when no longer required to publish', () => {
      // this can happen if you scroll backward and forward super quick
      wrapper = mount(
        <ScrollableItem {...dispatchProps} />,
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
    });

    it('should not publish a scroll update after requested not to update while an animation frame is occurring', () => {
      wrapper = mount(
        <ScrollableItem {...dispatchProps} />,
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
    });

    it('should stop watching for scroll events when the component is unmounted', () => {
      wrapper = mount(
        <ScrollableItem {...dispatchProps} />,
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

      // second event - will not fire any updates
      container.scrollTop = 1001;
      container.scrollLeft = 501;
      container.dispatchEvent(new Event('scroll'));
      requestAnimationFrame.step();
      expect(updateScroll).toHaveBeenCalledTimes(1);
    });
  });

  describe('is enabled flag publishing', () => {
    beforeEach(() => {
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        top: droppable.page.withoutMargin.top,
        bottom: droppable.page.withoutMargin.bottom,
        left: droppable.page.withoutMargin.left,
        right: droppable.page.withoutMargin.right,
        height: droppable.page.withoutMargin.height,
        width: droppable.page.withoutMargin.width,
      }));
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => noSpacing);
    });

    it('should publish whether the droppable is enabled when requested to publish', () => {
      describe('enabled on mount', () => {
        it('should publish that the dimension is enabled', () => {
          wrapper = mount(
            <ScrollableItem
              {...dispatchProps}
              isDropDisabled={false}
            />,
          );
          wrapper.setProps({
            shouldPublish: true,
          });

          expect(publish).toBeCalledWith(droppable);
          expect(publish).toHaveBeenCalledTimes(1);
        });
      });

      describe('disabled on mount', () => {
        it('should publish that the dimension is disabled', () => {
          const expected = {
            ...droppable,
            isEnabled: false,
          };

          wrapper = mount(
            <ScrollableItem
              {...dispatchProps}
              isDropDisabled
            />,
          );
          wrapper.setProps({
            shouldPublish: true,
          });

          expect(publish).toBeCalledWith(expected);
          expect(publish).toHaveBeenCalledTimes(1);
        });
      });
    });

    it('should publish changes to the enabled state of the droppable during a drag', () => {
      wrapper = mount(
        <ScrollableItem {...dispatchProps} />,
      );

      // initial publish
      wrapper.setProps({
        shouldPublish: true,
      });
      expect(publish.mock.calls[0][0].isEnabled).toBe(true);

      // disable
      wrapper.setProps({
        isDropDisabled: true,
      });
      expect(updateIsEnabled).toHaveBeenCalledTimes(1);
      expect(updateIsEnabled.mock.calls[0]).toEqual([droppable.id, false]);

      // enable
      wrapper.setProps({
        isDropDisabled: false,
      });
      expect(updateIsEnabled).toHaveBeenCalledTimes(2);
      expect(updateIsEnabled.mock.calls[1]).toEqual([droppable.id, true]);
    });

    it('should not publish changes to the enabled state of the droppable when a drag is not occuring', () => {
      wrapper = mount(
        <ScrollableItem {...dispatchProps} />,
      );
      const change = () => {
        // disabling
        wrapper.setProps({
          isDropDisabled: true,
        });
        // enabling
        wrapper.setProps({
          isDropDisabled: false,
        });
      };
      // not publishing yet
      change();
      expect(updateIsEnabled).not.toHaveBeenCalled();

      // now publishing
      wrapper.setProps({
        shouldPublish: true,
      });

      // this change will now trigger an update x 2
      change();
      expect(updateIsEnabled).toHaveBeenCalledTimes(2);
      // disabling
      expect(updateIsEnabled.mock.calls[0]).toEqual([droppable.id, false]);
      // enabling
      expect(updateIsEnabled.mock.calls[1]).toEqual([droppable.id, true]);

      // no longer publishing
      wrapper.setProps({
        shouldPublish: false,
      });

      // should not do anything
      change();
      expect(updateIsEnabled).toHaveBeenCalledTimes(2);
    });
  });
});
