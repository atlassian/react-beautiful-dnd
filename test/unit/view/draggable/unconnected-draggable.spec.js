// @flow
import React, { Component, type Node } from 'react';
import ReactDOM from 'react-dom';
import { mount, type ReactWrapper } from 'enzyme';
import { getRect, type Position } from 'css-box-model';
import Draggable, {
  zIndexOptions,
} from '../../../../src/view/draggable/draggable';
import DragHandle from '../../../../src/view/drag-handle/drag-handle';
import { sloppyClickThreshold } from '../../../../src/view/drag-handle/util/is-sloppy-click-threshold-exceeded';
import Placeholder from '../../../../src/view/placeholder';
import type { PlaceholderStyle } from '../../../../src/view/placeholder/placeholder-types';
import { subtract } from '../../../../src/state/position';
import createStyleMarshal from '../../../../src/view/style-marshal/style-marshal';
import type { StyleMarshal } from '../../../../src/view/style-marshal/style-marshal-types';
import type {
  OwnProps,
  MapProps,
  DraggingStyle,
  NotDraggingStyle,
  DispatchProps,
  Provided,
  StateSnapshot,
} from '../../../../src/view/draggable/draggable-types';
import type {
  DraggableDimension,
  DraggableId,
  DroppableId,
  ClientPositions,
  TypeId,
  Viewport,
} from '../../../../src/types';
import { getPreset } from '../../../utils/dimension';
import {
  combine,
  withStore,
  withDroppableId,
  withStyleContext,
  withDimensionMarshal,
  withCanLift,
  withDroppableType,
} from '../../../utils/get-context-options';
import {
  dispatchWindowMouseEvent,
  mouseEvent,
} from '../../../utils/user-input-util';
import { setViewport, resetViewport } from '../../../utils/viewport';
import * as attributes from '../../../../src/view/data-attributes';

class Item extends Component<{ provided: Provided }> {
  render() {
    const provided: Provided = this.props.provided;

    return (
      <div
        className="item"
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        Hello there!
      </div>
    );
  }
}

const preset = getPreset();
const dimension: DraggableDimension = preset.inHome1;
const draggableId: DraggableId = dimension.descriptor.id;
const droppableId: DroppableId = dimension.descriptor.droppableId;
const type: TypeId = dimension.descriptor.type;
const origin: Position = { x: 0, y: 0 };

const getDispatchPropsStub = (): DispatchProps => ({
  lift: jest.fn(),
  move: jest.fn(),
  moveByWindowScroll: jest.fn(),
  moveUp: jest.fn(),
  moveDown: jest.fn(),
  moveRight: jest.fn(),
  moveLeft: jest.fn(),
  drop: jest.fn(),
  dropAnimationFinished: jest.fn(),
});

const defaultOwnProps: OwnProps = {
  draggableId,
  payload: null,
  index: 0,
  isDragDisabled: false,
  disableInteractiveElementBlocking: false,
  children: () => null,
};

const disabledOwnProps: OwnProps = {
  ...defaultOwnProps,
  isDragDisabled: true,
};

const defaultMapProps: MapProps = {
  isDragging: false,
  isDropAnimating: false,
  dropDuration: 0,
  shouldAnimateDragMovement: false,
  shouldAnimateDisplacement: true,
  offset: origin,
  dimension: null,
  draggingOver: null,
  groupingWith: null,
  groupedOverBy: null,
};

const somethingElseDraggingMapProps: MapProps = defaultMapProps;

const draggingMapProps: MapProps = {
  isDragging: true,
  isDropAnimating: false,
  dropDuration: 0,
  shouldAnimateDragMovement: false,
  shouldAnimateDisplacement: false,
  offset: { x: 75, y: 75 },
  // this may or may not be set during a drag
  dimension,
  draggingOver: null,
  groupingWith: null,
  groupedOverBy: null,
};

const dropAnimatingMapProps: MapProps = {
  isDragging: false,
  isDropAnimating: true,
  dropDuration: 0.5,
  offset: { x: 75, y: 75 },
  shouldAnimateDisplacement: false,
  shouldAnimateDragMovement: false,
  dimension,
  draggingOver: null,
  groupingWith: null,
  groupedOverBy: null,
};

const dropCompleteMapProps: MapProps = defaultMapProps;

type MountConnected = {|
  ownProps?: OwnProps,
  mapProps?: MapProps,
  dispatchProps?: DispatchProps,
  WrappedComponent?: any,
  styleMarshal?: StyleMarshal,
|};

const mountDraggable = ({
  ownProps = defaultOwnProps,
  mapProps = defaultMapProps,
  dispatchProps = getDispatchPropsStub(),
  WrappedComponent = Item,
  styleMarshal,
}: MountConnected = {}): ReactWrapper => {
  const wrapper: ReactWrapper = mount(
    <Draggable {...ownProps} {...mapProps} {...dispatchProps}>
      {(provided: Provided, snapshot: StateSnapshot) => (
        <WrappedComponent provided={provided} snapshot={snapshot} />
      )}
    </Draggable>,
    combine(
      withStore(),
      withDroppableId(droppableId),
      withDroppableType(type),
      withStyleContext(styleMarshal),
      withDimensionMarshal(),
      withCanLift(),
    ),
  );

  return wrapper;
};

const mouseDown = mouseEvent.bind(null, 'mousedown');
const windowMouseMove = dispatchWindowMouseEvent.bind(null, 'mousemove');

type StartDrag = {|
  selection?: Position,
  borderBoxCenter?: Position,
  viewport?: Viewport,
  isScrollAllowed?: boolean,
|};

const stubArea = (borderBoxCenter?: Position = origin): void =>
  // $ExpectError
  jest
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(() =>
      getRect({
        left: 0,
        top: 0,
        right: borderBoxCenter.x * 2,
        bottom: borderBoxCenter.y * 2,
      }),
    );

const executeOnLift = (wrapper: ReactWrapper) => ({
  selection = origin,
  borderBoxCenter = origin,
  viewport = preset.viewport,
}: StartDrag = {}) => {
  stubArea(borderBoxCenter);
  setViewport(viewport);

  wrapper
    .find(DragHandle)
    .props()
    .callbacks.onLift({
      clientSelection: selection,
      movementMode: 'FLUID',
    });

  resetViewport();
};

// $ExpectError - not checking type of mock
const getLastCall = myMock => myMock.mock.calls[myMock.mock.calls.length - 1];

const getStubber = stub =>
  class Stubber extends Component<{
    provided: Provided,
    snapshot: StateSnapshot,
  }> {
    render() {
      const provided: Provided = this.props.provided;
      const snapshot: StateSnapshot = this.props.snapshot;
      stub({ provided, snapshot });
      return (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          Drag me!
        </div>
      );
    }
  };

const loseFocus = (wrapper: ReactWrapper) => {
  const el: HTMLElement = wrapper.getDOMNode();
  // raw event
  el.blur();
  // let the wrapper know about it
  wrapper.simulate('blur');
};

class WithNestedHandle extends Component<{ provided: Provided }> {
  render() {
    const provided: Provided = this.props.provided;
    return (
      <div ref={provided.innerRef} {...provided.draggableProps}>
        <div className="cannot-drag">Cannot drag by me</div>
        <div className="can-drag" {...provided.dragHandleProps}>
          Can drag by me
        </div>
      </div>
    );
  }
}

describe('Draggable - unconnected', () => {
  beforeEach(() => {
    setViewport(preset.viewport);
    requestAnimationFrame.reset();
  });

  afterEach(() => {
    if (Element.prototype.getBoundingClientRect.mockRestore) {
      Element.prototype.getBoundingClientRect.mockRestore();
    }
    requestAnimationFrame.reset();
    resetViewport();
  });

  afterAll(() => {
    requestAnimationFrame.reset();
  });

  it('should not create any wrapping elements', () => {
    const wrapper: ReactWrapper = mountDraggable();

    const node = wrapper.getDOMNode();

    expect(node.className).toBe('item');
  });

  it('should provided a data attribute for global styling', () => {
    const myMock = jest.fn();
    const Stubber = getStubber(myMock);
    const styleMarshal: StyleMarshal = createStyleMarshal();

    mountDraggable({
      mapProps: defaultMapProps,
      WrappedComponent: Stubber,
      styleMarshal,
    });
    const provided: Provided = getLastCall(myMock)[0].provided;

    expect(provided.draggableProps[attributes.draggable]).toEqual(
      styleMarshal.styleContext,
    );
  });

  describe('drag handle', () => {
    // we need to unmount after each test to avoid
    // cross EventMarshal contamination
    let managedWrapper: ?ReactWrapper = null;

    const startDragWithHandle = (wrapper: ReactWrapper) => ({
      selection = origin,
      borderBoxCenter = origin,
    }: StartDrag = {}) => {
      // fake some position to get the center we want
      stubArea(borderBoxCenter);

      mouseDown(
        wrapper,
        subtract(selection, { x: 0, y: sloppyClickThreshold }),
      );
      windowMouseMove(selection);
    };

    afterEach(() => {
      if (managedWrapper) {
        managedWrapper.unmount();
        managedWrapper = null;
      }
    });

    it('should allow you to attach a drag handle', () => {
      const dispatchProps: DispatchProps = getDispatchPropsStub();
      managedWrapper = mountDraggable({
        dispatchProps,
        WrappedComponent: Item,
      });

      startDragWithHandle(managedWrapper.find(Item))();

      expect(dispatchProps.lift).toHaveBeenCalled();
    });

    describe('non standard drag handle', () => {
      it('should allow the ability to have the drag handle to be a child of the draggable', () => {
        const dispatchProps: DispatchProps = getDispatchPropsStub();
        managedWrapper = mountDraggable({
          dispatchProps,
          WrappedComponent: WithNestedHandle,
        });

        startDragWithHandle(
          managedWrapper.find(WithNestedHandle).find('.can-drag'),
        )();

        expect(dispatchProps.lift).toHaveBeenCalled();
      });

      it('should not drag by the draggable element', () => {
        const dispatchProps: DispatchProps = getDispatchPropsStub();
        managedWrapper = mountDraggable({
          dispatchProps,
          WrappedComponent: WithNestedHandle,
        });

        startDragWithHandle(managedWrapper.find(WithNestedHandle))();

        expect(dispatchProps.lift).not.toHaveBeenCalled();
      });

      it('should not drag by other elements', () => {
        const dispatchProps: DispatchProps = getDispatchPropsStub();
        managedWrapper = mountDraggable({
          dispatchProps,
          WrappedComponent: WithNestedHandle,
        });

        startDragWithHandle(
          managedWrapper.find(WithNestedHandle).find('.cannot-drag'),
        )();

        expect(dispatchProps.lift).not.toHaveBeenCalled();
      });
    });

    describe('handling events', () => {
      describe('onLift', () => {
        it('should throw if lifted when dragging is not enabled', () => {
          const customWrapper = mountDraggable({
            ownProps: disabledOwnProps,
            mapProps: defaultMapProps,
          });

          expect(() => executeOnLift(customWrapper)()).toThrow();
        });

        it('should throw if lifted when not attached to the dom', () => {
          const customWrapper = mountDraggable();
          customWrapper.unmount();

          expect(() => executeOnLift(customWrapper)()).toThrow();
        });

        it('should lift if permitted', () => {
          const dispatchProps = getDispatchPropsStub();
          const wrapper = mountDraggable({
            dispatchProps,
          });

          // made up values
          const selection: Position = {
            x: 100,
            y: 200,
          };
          const borderBoxCenter: Position = {
            x: 50,
            y: 60,
          };
          const client: ClientPositions = {
            selection,
            borderBoxCenter,
            offset: origin,
          };

          executeOnLift(wrapper)({
            selection,
            borderBoxCenter,
            viewport: preset.viewport,
          });

          // $ExpectError - mock property on lift function
          expect(dispatchProps.lift).toHaveBeenCalledWith({
            id: draggableId,
            client,
            viewport: preset.viewport,
            movementMode: 'FLUID',
          });
        });

        describe('onMove', () => {
          it('should consider any mouse movement for the client coordinates', () => {
            const selection: Position = {
              x: 10,
              y: 50,
            };

            const dispatchProps = getDispatchPropsStub();
            const wrapper = mountDraggable({
              mapProps: draggingMapProps,
              dispatchProps,
            });

            wrapper
              .find(DragHandle)
              .props()
              .callbacks.onMove(selection);

            expect(dispatchProps.move).toHaveBeenCalledWith({
              client: selection,
              shouldAnimate: false,
            });
          });
        });

        describe('onDrop', () => {
          it('should trigger drop', () => {
            const dispatchProps = getDispatchPropsStub();
            const wrapper = mountDraggable({
              dispatchProps,
            });

            wrapper
              .find(DragHandle)
              .props()
              .callbacks.onDrop();

            expect(dispatchProps.drop).toBeCalled();
          });
        });

        describe('onMoveUp', () => {
          it('should call the move up action', () => {
            const dispatchProps = getDispatchPropsStub();
            const wrapper = mountDraggable({
              mapProps: draggingMapProps,
              dispatchProps,
            });

            wrapper
              .find(DragHandle)
              .props()
              .callbacks.onMoveUp();

            expect(dispatchProps.moveUp).toHaveBeenCalled();
          });
        });

        describe('onMoveDown', () => {
          it('should call the move down action', () => {
            const dispatchProps = getDispatchPropsStub();
            const wrapper = mountDraggable({
              mapProps: draggingMapProps,
              dispatchProps,
            });

            wrapper
              .find(DragHandle)
              .props()
              .callbacks.onMoveDown();

            expect(dispatchProps.moveDown).toHaveBeenCalled();
          });
        });

        describe('onMoveLeft', () => {
          it('should call the cross axis move forward action', () => {
            const dispatchProps = getDispatchPropsStub();
            const wrapper = mountDraggable({
              mapProps: draggingMapProps,
              dispatchProps,
            });

            wrapper
              .find(DragHandle)
              .props()
              .callbacks.onMoveLeft();

            expect(dispatchProps.moveLeft).toHaveBeenCalled();
          });
        });

        describe('onMoveRight', () => {
          it('should call the move cross axis backwards action', () => {
            const dispatchProps = getDispatchPropsStub();
            const wrapper = mountDraggable({
              mapProps: draggingMapProps,
              dispatchProps,
            });

            wrapper
              .find(DragHandle)
              .props()
              .callbacks.onMoveRight();

            expect(dispatchProps.moveRight).toHaveBeenCalled();
          });
        });

        describe('onCancel', () => {
          it('should call the drop dispatch prop', () => {
            const dispatchProps = getDispatchPropsStub();
            const wrapper = mountDraggable({
              mapProps: draggingMapProps,
              dispatchProps,
            });

            wrapper
              .find(DragHandle)
              .props()
              .callbacks.onCancel();

            expect(dispatchProps.drop).toHaveBeenCalledWith({
              reason: 'CANCEL',
            });
          });

          it('should allow the action even if dragging is disabled', () => {
            const dispatchProps = getDispatchPropsStub();
            const wrapper = mountDraggable({
              ownProps: disabledOwnProps,
              mapProps: draggingMapProps,
              dispatchProps,
            });

            wrapper
              .find(DragHandle)
              .props()
              .callbacks.onCancel();

            expect(dispatchProps.drop).toBeCalled();
          });
        });

        describe('onWindowScroll', () => {
          it('should call the moveByWindowScroll action', () => {
            const dispatchProps = getDispatchPropsStub();
            const wrapper = mountDraggable({
              mapProps: draggingMapProps,
              dispatchProps,
            });

            wrapper
              .find(DragHandle)
              .props()
              .callbacks.onWindowScroll();

            expect(dispatchProps.moveByWindowScroll).toBeCalledWith({
              scroll: preset.viewport.scroll.current,
            });
          });
        });
      });
    });

    describe('is dragging', () => {
      it('should render a placeholder', () => {
        const myMock = jest.fn();

        const wrapper: ReactWrapper = mountDraggable({
          mapProps: draggingMapProps,
          WrappedComponent: getStubber(myMock),
        });

        expect(wrapper.find(Placeholder).exists()).toBe(true);
      });

      it('should give a placeholder the same details as the element being moved', () => {
        const myMock = jest.fn();
        const Stubber = getStubber(myMock);

        const wrapper: ReactWrapper = mountDraggable({
          mapProps: draggingMapProps,
          WrappedComponent: Stubber,
        });
        // finish moving to the initial position
        requestAnimationFrame.flush();

        const placeholder: ?ReactWrapper = wrapper.find(Placeholder).first();

        if (!placeholder) {
          throw new Error('Unable to find placeholder');
        }

        expect(placeholder.props().placeholder).toBe(dimension.placeholder);

        const child: ?ReactWrapper = placeholder.children();

        if (!child) {
          throw new Error('Unable to find placeholder element');
        }

        const props: Object = child.props();

        const expected: PlaceholderStyle = {
          width: dimension.placeholder.client.borderBox.width,
          height: dimension.placeholder.client.borderBox.height,
          marginTop: dimension.placeholder.client.margin.top,
          marginBottom: dimension.placeholder.client.margin.bottom,
          marginLeft: dimension.placeholder.client.margin.left,
          marginRight: dimension.placeholder.client.margin.right,
          display: dimension.placeholder.display,
          flexShrink: '0',
          flexGrow: '0',
          boxSizing: 'border-box',
          pointerEvents: 'none',
        };
        expect(props.style).toEqual(expected);
        expect(child.type()).toBe(dimension.placeholder.tagName);
      });

      it('should be above Draggables that are not dragging', () => {
        // dragging item
        const draggingMock = jest.fn();
        mountDraggable({
          mapProps: draggingMapProps,
          WrappedComponent: getStubber(draggingMock),
        });
        const draggingProvided: Provided = getLastCall(draggingMock)[0]
          .provided;
        const draggingStyle: DraggingStyle = (draggingProvided.draggableProps
          .style: any);

        // not dragging item
        const notDraggingMock = jest.fn();
        mountDraggable({
          mapProps: somethingElseDraggingMapProps,
          WrappedComponent: getStubber(notDraggingMock),
        });
        const notDraggingProvided: Provided = getLastCall(notDraggingMock)[0]
          .provided;
        const notDraggingStyle: NotDraggingStyle = (notDraggingProvided
          .draggableProps.style: any);
        const notDraggingExpected: NotDraggingStyle = {
          transform: null,
          transition: null,
        };

        expect(draggingStyle.zIndex).toBe(zIndexOptions.dragging);
        expect(notDraggingStyle).toEqual(notDraggingExpected);
      });

      it('should be above Draggables that are drop animating', () => {
        const draggingMock = jest.fn();
        mountDraggable({
          mapProps: draggingMapProps,
          WrappedComponent: getStubber(draggingMock),
        });
        const draggingProvided: Provided = getLastCall(draggingMock)[0]
          .provided;
        const returningHomeMock = jest.fn();
        mountDraggable({
          mapProps: dropAnimatingMapProps,
          WrappedComponent: getStubber(returningHomeMock),
        });
        const returningHomeProvided: Provided = getLastCall(
          returningHomeMock,
        )[0].provided;

        // $ExpectError - not type checking draggableProps.style
        expect(draggingProvided.draggableProps.style.zIndex)
          // $ExpectError - not type checking draggableProps.style
          .toBeGreaterThan(returningHomeProvided.draggableProps.style.zIndex);
      });

      it('should be positioned in the same spot as before the drag', () => {
        const myMock = jest.fn();
        mountDraggable({
          mapProps: draggingMapProps,
          WrappedComponent: getStubber(myMock),
        });
        const expected: DraggingStyle = {
          position: 'fixed',
          width: dimension.client.borderBox.width,
          height: dimension.client.borderBox.height,
          boxSizing: 'border-box',
          top: dimension.client.marginBox.top,
          left: dimension.client.marginBox.left,
          pointerEvents: 'none',
          transition: 'none',
          transform: `translate(${draggingMapProps.offset.x}px, ${
            draggingMapProps.offset.y
          }px)`,
          zIndex: zIndexOptions.dragging,
        };

        const provided: Provided = getLastCall(myMock)[0].provided;
        expect(provided.draggableProps.style).toEqual(expected);
      });

      it('should be positioned in the correct offset while dragging', () => {
        const myMock = jest.fn();
        const offset: Position = { x: 10, y: 20 };
        const mapProps: MapProps = {
          ...draggingMapProps,
          offset,
        };
        mountDraggable({
          mapProps,
          WrappedComponent: getStubber(myMock),
        });
        // release frame for animation
        requestAnimationFrame.step();
        requestAnimationFrame.step();

        const expected: DraggingStyle = {
          position: 'fixed',
          zIndex: zIndexOptions.dragging,
          boxSizing: 'border-box',
          width: dimension.client.borderBox.width,
          height: dimension.client.borderBox.height,
          top: dimension.client.marginBox.top,
          left: dimension.client.marginBox.left,
          pointerEvents: 'none',
          // moving instantly
          transition: 'none',
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        };

        const provided: Provided = getLastCall(myMock)[0].provided;
        expect(provided.draggableProps.style).toEqual(expected);
      });

      it('should move by the provided offset on mount', () => {
        const myMock = jest.fn();
        const expected: DraggingStyle = {
          // property under test:
          transform: `translate(${draggingMapProps.offset.x}px, ${
            draggingMapProps.offset.y
          }px)`,
          // other properties
          transition: 'none',
          position: 'fixed',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          zIndex: zIndexOptions.dragging,
          width: dimension.client.borderBox.width,
          height: dimension.client.borderBox.height,
          top: dimension.client.marginBox.top,
          left: dimension.client.marginBox.left,
        };

        mountDraggable({
          mapProps: draggingMapProps,
          WrappedComponent: getStubber(myMock),
        });
        // finish moving to the initial position
        requestAnimationFrame.flush();

        // first call is for the setRef
        const provided: Provided = getLastCall(myMock)[0].provided;
        const style: DraggingStyle = (provided.draggableProps.style: any);

        expect(style).toEqual(expected);
      });

      it('should move by the provided offset on update', () => {
        const myMock = jest.fn();
        const Stubber = getStubber(myMock);
        const offsets: Position[] = [
          { x: 12, y: 3 },
          { x: 20, y: 100 },
          { x: -100, y: 20 },
        ];

        // initial render
        const wrapper = mountDraggable({
          mapProps: draggingMapProps,
          WrappedComponent: Stubber,
        });
        // flush initial movement
        requestAnimationFrame.flush();

        offsets.forEach((offset: Position) => {
          const expected = `translate(${offset.x}px, ${offset.y}px)`;
          // $ExpectError - flow does not like spread
          const mapProps: MapProps = {
            ...draggingMapProps,
            offset,
          };

          // movement will be instant
          wrapper.setProps({
            ...mapProps,
          });
          // flush any movement required
          requestAnimationFrame.flush();

          const provided: Provided =
            myMock.mock.calls[myMock.mock.calls.length - 1][0].provided;
          const style: DraggingStyle = (provided.draggableProps.style: any);
          expect(style.transform).toBe(expected);
        });
      });

      it('should let consumers know that the item is dragging', () => {
        const myMock = jest.fn();

        mountDraggable({
          mapProps: draggingMapProps,
          WrappedComponent: getStubber(myMock),
        });

        const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
        expect(snapshot.isDragging).toBe(true);
      });

      it('should let consumers know if draggging and over a droppable', () => {
        const mapProps: MapProps = {
          ...draggingMapProps,
          draggingOver: 'foobar',
        };

        const myMock = jest.fn();

        mountDraggable({
          mapProps,
          WrappedComponent: getStubber(myMock),
        });

        const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
        expect(snapshot.draggingOver).toBe('foobar');
      });

      it('should let consumers know if dragging and not over a droppable', () => {
        const mapProps: MapProps = {
          ...draggingMapProps,
          draggingOver: null,
        };

        const myMock = jest.fn();

        mountDraggable({
          mapProps,
          WrappedComponent: getStubber(myMock),
        });

        const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
        expect(snapshot.draggingOver).toBe(null);
      });

      it('should let consumers know if drop animation is in progress', () => {
        const mapProps: MapProps = {
          ...draggingMapProps,
          isDropAnimating: true,
        };

        const myMock = jest.fn();

        mountDraggable({
          mapProps,
          WrappedComponent: getStubber(myMock),
        });

        const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
        expect(snapshot.isDropAnimating).toBe(true);
      });
    });

    describe('drop animating', () => {
      it('should render a placeholder', () => {
        const wrapper = mountDraggable({
          mapProps: dropAnimatingMapProps,
        });

        expect(wrapper.find(Placeholder).exists()).toBe(true);
      });

      it('should move back to home with standard speed', () => {
        const wrapper = mountDraggable({
          mapProps: dropAnimatingMapProps,
        });

        expect(wrapper.find(Moveable).props().speed).toBe('STANDARD');
      });

      it('should be on top of draggables that are not being dragged', () => {
        // not dragging
        const notDraggingMock = jest.fn();
        mountDraggable({
          mapProps: somethingElseDraggingMapProps,
          WrappedComponent: getStubber(notDraggingMock),
        });
        const notDraggingProvided: Provided = getLastCall(notDraggingMock)[0]
          .provided;
        const notDraggingStyle: NotDraggingStyle = (notDraggingProvided
          .draggableProps.style: any);
        // returning home
        const dropAnimatingMock = jest.fn();
        mountDraggable({
          mapProps: dropAnimatingMapProps,
          WrappedComponent: getStubber(dropAnimatingMock),
        });
        const droppingProvided: Provided = getLastCall(dropAnimatingMock)[0]
          .provided;
        const droppingStyle: DraggingStyle = (droppingProvided.draggableProps
          .style: any);
        const expectedNotDraggingStyle: NotDraggingStyle = {
          transition: null,
          transform: null,
        };

        expect(droppingStyle.zIndex).toBe(zIndexOptions.dropAnimating);
        expect(notDraggingStyle).toEqual(expectedNotDraggingStyle);
      });

      it('should be positioned in the same spot as before', () => {
        const myMock = jest.fn();
        const offset = dropAnimatingMapProps.offset;
        const expected: DraggingStyle = {
          position: 'fixed',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          zIndex: zIndexOptions.dropAnimating,
          width: dimension.client.borderBox.width,
          height: dimension.client.borderBox.height,
          top: dimension.client.marginBox.top,
          left: dimension.client.marginBox.left,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: 'none',
        };

        mountDraggable({
          mapProps: dropAnimatingMapProps,
          WrappedComponent: getStubber(myMock),
        });
        // finish the animation
        requestAnimationFrame.flush();

        const provided: Provided = getLastCall(myMock)[0].provided;
        expect(provided.draggableProps.style).toEqual(expected);
      });

      it('should let consumers know that the item is still dragging', () => {
        const myMock = jest.fn();

        mountDraggable({
          mapProps: dropAnimatingMapProps,
          WrappedComponent: getStubber(myMock),
        });

        const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
        expect(snapshot.isDragging).toBe(true);
      });
    });

    describe('drop complete', () => {
      const myMock = jest.fn();
      const wrapper = mountDraggable({
        mapProps: dropCompleteMapProps,
        WrappedComponent: getStubber(myMock),
      });
      const provided: Provided = getLastCall(myMock)[0].provided;
      const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;

      it('should not render a placeholder', () => {
        expect(wrapper.find(Placeholder).exists()).toBe(false);
      });

      it('should not be moved from its original position', () => {
        const style: NotDraggingStyle = {
          transform: null,
          transition: null,
        };

        expect(provided.draggableProps.style).toEqual(style);
      });

      it('should let consumers know that the item is not dragging', () => {
        expect(snapshot.isDragging).toBe(false);
      });
    });

    describe('is not dragging', () => {
      describe('nothing else is dragging', () => {
        let provided: Provided;
        let snapshot: StateSnapshot;
        let wrapper: ReactWrapper;

        beforeEach(() => {
          const myMock = jest.fn();
          wrapper = mountDraggable({
            mapProps: defaultMapProps,
            WrappedComponent: getStubber(myMock),
          });
          provided = getLastCall(myMock)[0].provided;
          snapshot = getLastCall(myMock)[0].snapshot;
        });

        it('should not render a placeholder', () => {
          expect(wrapper.find(Placeholder).exists()).toBe(false);
        });

        it('should have base inline styles', () => {
          const expected: NotDraggingStyle = {
            transform: null,
            transition: null,
          };

          expect(provided.draggableProps.style).toEqual(expected);
        });

        it('should be informed that it is not dragging', () => {
          expect(snapshot.isDragging).toBe(false);
        });
      });

      describe('something else is dragging', () => {
        describe('not moving out of the way', () => {
          let wrapper: ReactWrapper;
          let provided: Provided;
          let snapshot: StateSnapshot;

          beforeEach(() => {
            const myMock = jest.fn();
            wrapper = mountDraggable({
              mapProps: somethingElseDraggingMapProps,
              WrappedComponent: getStubber(myMock),
            });
            provided = getLastCall(myMock)[0].provided;
            snapshot = getLastCall(myMock)[0].snapshot;
          });

          it('should not render a placeholder', () => {
            expect(wrapper.find(Placeholder).exists()).toBe(false);
          });

          it('should return animate out of the way with css', () => {
            const expected: NotDraggingStyle = {
              // relying on the style marshal
              transition: null,
              transform: null,
            };
            expect(provided.draggableProps.style).toEqual(expected);
          });

          it('should move out of the way without physics', () => {
            expect(wrapper.find(Moveable).props().speed).toBe('INSTANT');
          });

          it('should instantly move out of the way without css if animation is disabled', () => {
            const myMock = jest.fn();
            const CustomStubber = getStubber(myMock);
            const mapProps: MapProps = {
              ...somethingElseDraggingMapProps,
              shouldAnimateDisplacement: false,
            };
            const expected: NotDraggingStyle = {
              transition: 'none',
              transform: null,
            };

            const customWrapper = mountDraggable({
              ownProps: disabledOwnProps,
              mapProps,
              WrappedComponent: CustomStubber,
            });

            const customProvided: Provided = getLastCall(myMock)[0].provided;
            expect(customWrapper.find(Moveable).props().speed).toBe('INSTANT');
            expect(customProvided.draggableProps.style).toEqual(expected);
          });

          it('should let consumers know that the item is not dragging', () => {
            expect(snapshot.isDragging).toBe(false);
          });
        });

        describe('moving out of the way of a dragging item', () => {
          let wrapper: ReactWrapper;
          let provided: Provided;
          let snapshot: StateSnapshot;

          const offset: Position = { x: 0, y: 200 };

          const mapProps: MapProps = {
            ...somethingElseDraggingMapProps,
            offset,
          };

          beforeEach(() => {
            const myMock = jest.fn();
            wrapper = mountDraggable({
              mapProps,
              WrappedComponent: getStubber(myMock),
            });
            // let react-motion tick over
            requestAnimationFrame.step();
            requestAnimationFrame.step();

            provided = getLastCall(myMock)[0].provided;
            snapshot = getLastCall(myMock)[0].snapshot;
          });

          it('should not render a placeholder', () => {
            expect(wrapper.find(Placeholder).exists()).toBe(false);
          });

          it('should animate out of the way with css', () => {
            const expected: NotDraggingStyle = {
              // use the style marshal global style
              transition: null,
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            };

            expect(provided.draggableProps.style).toEqual(expected);
          });

          it('should move out of the way without physics', () => {
            expect(wrapper.find(Moveable).props().speed).toBe('INSTANT');
          });

          it('should instantly move out of the way without css if displacement animation is disabled', () => {
            const myMock = jest.fn();
            const CustomStubber = getStubber(myMock);
            const customProps: MapProps = {
              ...mapProps,
              shouldAnimateDisplacement: false,
            };
            const expected: NotDraggingStyle = {
              transition: 'none',
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            };

            const customWrapper = mountDraggable({
              ownProps: disabledOwnProps,
              mapProps: customProps,
              WrappedComponent: CustomStubber,
            });
            // flush react motion
            requestAnimationFrame.flush();

            const customProvided = getLastCall(myMock)[0].provided;
            expect(customWrapper.find(Moveable).props().speed).toBe('INSTANT');
            expect(customProvided.draggableProps.style).toEqual(expected);
          });

          it('should let consumers know that the item is not dragging', () => {
            expect(snapshot.isDragging).toBe(false);
          });
        });
      });
    });

    // This is covered in focus-management.spec
    // But I have included in here also to ensure that the entire
    // consumer experience is tested (this is how a consumer would use it)
    describe('Portal usage (Draggable consumer)', () => {
      const body: ?HTMLElement = document.body;
      if (!body) {
        throw new Error('Portal test requires document.body to be present');
      }

      class WithPortal extends Component<{
        provided: Provided,
        snapshot: StateSnapshot,
      }> {
        // eslint-disable-next-line react/sort-comp
        portal: ?HTMLElement;

        componentDidMount() {
          this.portal = document.createElement('div');
          body.appendChild(this.portal);
        }
        componentWillUnmount() {
          if (!this.portal) {
            return;
          }
          body.removeChild(this.portal);
          this.portal = null;
        }
        render() {
          const provided: Provided = this.props.provided;
          const snapshot: StateSnapshot = this.props.snapshot;

          const child: Node = (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            >
              Drag me!
            </div>
          );

          if (!snapshot.isDragging) {
            return child;
          }

          // if dragging - put the item in a portal
          if (!this.portal) {
            throw new Error('could not find portal');
          }

          return ReactDOM.createPortal(child, this.portal);
        }
      }

      it('should keep focus if moving to a portal', () => {
        const wrapper = mountDraggable({
          WrappedComponent: WithPortal,
        });
        const original: HTMLElement = wrapper.getDOMNode();
        // originally does not have focus
        expect(original).not.toBe(document.activeElement);

        // giving focus to draggable
        original.focus();
        // ensuring that the focus event handler is called
        wrapper.simulate('focus');
        // new focused element!
        expect(original).toBe(document.activeElement);

        // starting a drag
        wrapper.setProps({
          ...draggingMapProps,
        });

        // now moved to portal
        const inPortal: HTMLElement = wrapper.getDOMNode();
        expect(inPortal).not.toBe(original);
        expect(inPortal.parentElement).toBe(
          wrapper.find(WithPortal).instance().portal,
        );

        // assert that focus was transferred to new element
        expect(inPortal).toBe(document.activeElement);
        expect(original).not.toBe(document.activeElement);

        // finishing a drag
        wrapper.setProps({
          ...defaultMapProps,
        });

        // non portaled element should now have focus passed back to it
        const latest: HTMLElement = wrapper.getDOMNode();
        expect(latest).toBe(document.activeElement);
        // latest will not be the same as the original
        // ref as it is remounted after leaving the portal
        expect(latest).not.toBe(original);
        // no longer in a portal
        expect(latest).not.toBe(wrapper.find(WithPortal).instance().portal);

        // cleanup
        loseFocus(wrapper);
      });

      it('should not take focus if moving to a portal and did not previously have focus', () => {
        const wrapper = mountDraggable({
          WrappedComponent: WithPortal,
        });
        const original: HTMLElement = wrapper.getDOMNode();

        // originally does not have focus
        expect(original).not.toBe(document.activeElement);

        // starting a drag
        wrapper.setProps({
          ...draggingMapProps,
        });

        // now moved to portal
        const inPortal: HTMLElement = wrapper.getDOMNode();
        expect(inPortal).not.toBe(original);
        expect(inPortal.parentElement).toBe(
          wrapper.find(WithPortal).instance().portal,
        );

        // assert that focus was not transferred to new element
        expect(inPortal).not.toBe(document.activeElement);
        expect(original).not.toBe(document.activeElement);

        // finishing a drag
        wrapper.setProps({
          ...defaultMapProps,
        });

        // non portaled element should not take focus
        const latest: HTMLElement = wrapper.getDOMNode();
        expect(latest).not.toBe(document.activeElement);
        // latest will not be the same as the original ref as
        // it is remounted after leaving the portal
        expect(latest).not.toBe(original);
        // no longer in a portal
        expect(latest).not.toBe(wrapper.find(WithPortal).instance().portal);
      });
    });
  });
});
