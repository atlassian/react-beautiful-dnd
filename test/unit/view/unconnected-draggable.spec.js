// @flow
/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import type { Node } from 'react';
import ReactDOM from 'react-dom';
import { mount } from 'enzyme';
// eslint-disable-next-line no-duplicate-imports
import type { ReactWrapper } from 'enzyme';
import Draggable, { zIndexOptions } from '../../../src/view/draggable/draggable';
import DragHandle from '../../../src/view/drag-handle/drag-handle';
import { sloppyClickThreshold } from '../../../src/view/drag-handle/util/is-sloppy-click-threshold-exceeded';
import Moveable from '../../../src/view/moveable/';
import Placeholder from '../../../src/view/placeholder';
import { add, subtract } from '../../../src/state/position';
import createStyleMarshal from '../../../src/view/style-marshal/style-marshal';
import type { StyleMarshal } from '../../../src/view/style-marshal/style-marshal-types';
import createDimensionMarshal from '../../../src/state/dimension-marshal/dimension-marshal';
import type { DimensionMarshal } from '../../../src/state/dimension-marshal/dimension-marshal-types';
import type {
  OwnProps,
  MapProps,
  DraggingStyle,
  NotDraggingStyle,
  DispatchProps,
  Provided,
  StateSnapshot,
} from '../../../src/view/draggable/draggable-types';
import type {
  Position,
  DraggableDimension,
  DroppableDimension,
  DraggableId,
  DroppableId,
  TypeId,
  InitialDragPositions,
  Viewport,
} from '../../../src/types';
import { getDraggableDimension, getDroppableDimension } from '../../../src/state/dimension';
import getArea from '../../../src/state/get-area';
import { combine, withStore, withDroppableId, withStyleContext, withDimensionMarshal, withCanLift } from '../../utils/get-context-options';
import { dispatchWindowMouseEvent, mouseEvent } from '../../utils/user-input-util';
import getViewport from '../../../src/view/window/get-viewport';
import { setViewport, resetViewport } from '../../utils/viewport';

class Item extends Component<{ provided: Provided }> {
  render() {
    const provided: Provided = this.props.provided;

    return (
      <div
        className="item"
        ref={ref => provided.innerRef(ref)}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        Hello there!
      </div>
    );
  }
}

const draggableId: DraggableId = 'draggable1';
const droppableId: DroppableId = 'droppable1';
const type: TypeId = 'ITEM';
const origin: Position = { x: 0, y: 0 };

const droppable: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: droppableId,
    type,
  },
  paddingBox: getArea({
    top: 0,
    right: 100,
    bottom: 200,
    left: 0,
  }),
});

const dimension: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: draggableId,
    droppableId,
    index: 0,
  },
  paddingBox: getArea({
    top: 0,
    right: 100,
    bottom: 100,
    left: 0,
  }),
});

const getDispatchPropsStub = (): DispatchProps => ({
  lift: jest.fn(),
  move: jest.fn(),
  moveByWindowScroll: jest.fn(),
  moveForward: jest.fn(),
  moveBackward: jest.fn(),
  crossAxisMoveForward: jest.fn(),
  crossAxisMoveBackward: jest.fn(),
  drop: jest.fn(),
  cancel: jest.fn(),
  dropAnimationFinished: jest.fn(),
});

// $ExpectError - not setting children function
const defaultOwnProps: OwnProps = {
  draggableId,
  isDragDisabled: false,
  type,
};

// $ExpectError - not setting children function
const disabledOwnProps: OwnProps = {
  draggableId,
  isDragDisabled: true,
  type,
};

const defaultMapProps: MapProps = {
  isDragging: false,
  isDropAnimating: false,
  shouldAnimateDragMovement: false,
  shouldAnimateDisplacement: true,
  offset: origin,
  dimension: null,
  direction: null,
  draggingOver: null,
};

const somethingElseDraggingMapProps: MapProps = defaultMapProps;

const draggingMapProps: MapProps = {
  isDragging: true,
  isDropAnimating: false,
  shouldAnimateDragMovement: false,
  shouldAnimateDisplacement: false,
  offset: { x: 75, y: 75 },
  // this may or may not be set during a drag
  dimension,
  direction: null,
  draggingOver: null,
};

const dropAnimatingMapProps: MapProps = {
  isDragging: false,
  isDropAnimating: true,
  offset: { x: 75, y: 75 },
  shouldAnimateDisplacement: false,
  shouldAnimateDragMovement: false,
  dimension,
  direction: null,
  draggingOver: null,
};

const dropCompleteMapProps: MapProps = defaultMapProps;

type MountConnected = {|
  ownProps?: OwnProps,
  mapProps?: MapProps,
  dispatchProps?: DispatchProps,
  WrappedComponent ?: any,
  styleMarshal?: StyleMarshal,
|};

const mountDraggable = ({
  ownProps = defaultOwnProps,
  mapProps = defaultMapProps,
  dispatchProps = getDispatchPropsStub(),
  WrappedComponent = Item,
  styleMarshal,
}: MountConnected = {}): ReactWrapper => {
  // registering the droppable so that publishing the dimension will work correctly
  const dimensionMarshal: DimensionMarshal = createDimensionMarshal({
    cancel: () => { },
    publishDraggable: () => { },
    publishDroppable: () => { },
    updateDroppableScroll: () => { },
    updateDroppableIsEnabled: () => { },
    bulkPublish: () => { },
  });

  dimensionMarshal.registerDroppable(droppable.descriptor, {
    getDimension: () => droppable,
    watchScroll: () => { },
    unwatchScroll: () => { },
    scroll: () => {},
  });

  const wrapper: ReactWrapper = mount(
    // $ExpectError - using spread for props
    <Draggable
      {...ownProps}
      {...mapProps}
      {...dispatchProps}
    >
      {(provided: Provided, snapshot: StateSnapshot) => (
        <WrappedComponent provided={provided} snapshot={snapshot} />
      )}
    </Draggable>
    , combine(
      withStore(),
      withDroppableId(droppableId),
      withStyleContext(styleMarshal),
      withDimensionMarshal(dimensionMarshal),
      withCanLift(),
    ));

  return wrapper;
};

const mouseDown = mouseEvent.bind(null, 'mousedown');
const windowMouseMove = dispatchWindowMouseEvent.bind(null, 'mousemove');

type StartDrag = {|
  selection?: Position,
  center ?: Position,
  viewport?: Viewport,
  isScrollAllowed?: boolean,
|}

const stubArea = (center?: Position = origin): void =>
  // $ExpectError
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => getArea({
    left: 0,
    top: 0,
    right: center.x * 2,
    bottom: center.y * 2,
  }));

const executeOnLift = (wrapper: ReactWrapper) => ({
  selection = origin,
  center = origin,
  viewport = getViewport(),
}: StartDrag = {}) => {
  stubArea(center);
  setViewport(viewport);

  wrapper.find(DragHandle).props().callbacks.onLift({
    client: selection,
    autoScrollMode: 'FLUID',
  });

  resetViewport();
};

// $ExpectError - not checking type of mock
const getLastCall = myMock => myMock.mock.calls[myMock.mock.calls.length - 1];

const getStubber = stub =>
  class Stubber extends Component<{provided: Provided, snapshot: StateSnapshot}> {
    render() {
      const provided: Provided = this.props.provided;
      const snapshot: StateSnapshot = this.props.snapshot;
      stub({ provided, snapshot });
      return (
        <div ref={provided.innerRef} />
      );
    }
  };

const customViewport: Viewport = {
  scroll: { x: 100, y: 200 },
  maxScroll: { x: 600, y: 600 },
  subject: getArea({ top: 200, left: 100, right: 300, bottom: 300 }),
};

describe('Draggable - unconnected', () => {
  beforeAll(() => {
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

    expect(provided.draggableProps['data-react-beautiful-dnd-draggable']).toEqual(styleMarshal.styleContext);
  });

  describe('drag handle', () => {
    // we need to unmount after each test to avoid
    // cross EventMarshal contamination
    let managedWrapper: ReactWrapper;

    const startDragWithHandle = (wrapper: ReactWrapper) => ({
      selection = origin,
      center = origin,
    }: StartDrag = {}) => {
      // fake some position to get the center we want
      stubArea(center);

      mouseDown(wrapper, subtract(selection, { x: 0, y: sloppyClickThreshold }));
      windowMouseMove(selection);
    };

    afterEach(() => {
      if (managedWrapper) {
        managedWrapper.unmount();
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
      class WithNestedHandle extends Component<{ provided: Provided }> {
        render() {
          const provided: Provided = this.props.provided;
          return (
            <div
              ref={ref => provided.innerRef(ref)}
              {...provided.draggableProps}
            >
              <div className="cannot-drag">
                Cannot drag by me
              </div>
              <div className="can-drag" {...provided.dragHandleProps}>
                Can drag by me
              </div>
            </div>
          );
        }
      }

      it('should allow the ability to have the drag handle to be a child of the draggable', () => {
        const dispatchProps: DispatchProps = getDispatchPropsStub();
        managedWrapper = mountDraggable({
          dispatchProps,
          WrappedComponent: WithNestedHandle,
        });

        startDragWithHandle(managedWrapper.find(WithNestedHandle).find('.can-drag'))();

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

        startDragWithHandle(managedWrapper.find(WithNestedHandle).find('.cannot-drag'))();

        expect(dispatchProps.lift).not.toHaveBeenCalled();
      });
    });

    describe('handling events', () => {
      describe('onLift', () => {
        let dispatchProps;

        beforeEach(() => {
          dispatchProps = getDispatchPropsStub();
          managedWrapper = mountDraggable({
            dispatchProps,
          });
        });

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
          // made up values
          const selection: Position = {
            x: 100,
            y: 200,
          };
          const center: Position = {
            x: 50,
            y: 60,
          };
          const initial: InitialDragPositions = {
            selection,
            center,
          };

          executeOnLift(managedWrapper)({ selection, center, viewport: customViewport });

          // $ExpectError - mock property on lift function
          expect(dispatchProps.lift.mock.calls[0]).toEqual([
            draggableId, initial, customViewport, 'FLUID',
          ]);
        });
      });

      describe('onMove', () => {
        it('should throw if dragging is not enabled', () => {
          const wrapper = mountDraggable({
            ownProps: disabledOwnProps,
            mapProps: draggingMapProps,
          });

          const move = () =>
            wrapper.find(DragHandle).props().callbacks.onMove({ x: 100, y: 200 });

          expect(move).toThrow();
        });

        it('should throw if not attached to the DOM', () => {
          const wrapper = mountDraggable();
          const move = () => {
            // Calling the prop directly as this is not able to be done otherwise
            wrapper.find(DragHandle).props().callbacks.onMove({ x: 100, y: 200 });
          };

          wrapper.unmount();

          expect(move).toThrow();
        });

        it('should not do anything if the dimensions have not all been published yet', () => {
          const dispatchProps = getDispatchPropsStub();
          const wrapper = mountDraggable({
            dispatchProps,
          });

          // should not do anything yet as mapProps has not yet updated
          wrapper.find(DragHandle).props().callbacks.onMove({ x: 100, y: 200 });

          expect(dispatchProps.move).not.toHaveBeenCalled();
        });

        it('should consider any mouse movement for the client coordinates', () => {
          const original: Position = {
            x: 10, y: 20,
          };
          const mouse: Position = {
            x: 10,
            y: 50,
          };
          const mouseDiff: Position = subtract(mouse, original);
          const expected: Position = add(original, mouseDiff);

          const dispatchProps = getDispatchPropsStub();
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
            dispatchProps,
          });

          wrapper.find(DragHandle).props().callbacks.onMove(mouse);
          const [, client] = getLastCall(dispatchProps.move);

          expect(client).toEqual(expected);
        });

        it('should publish the viewport', () => {
          const dispatchProps = getDispatchPropsStub();
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
            dispatchProps,
          });

          wrapper.find(DragHandle).props().callbacks.onMove(origin);
          const [, , windowScrollResult] = getLastCall(dispatchProps.move);

          expect(windowScrollResult).toEqual(getViewport());
        });
      });

      describe('onDrop', () => {
        it('should throw if dragging is disabled', () => {
          const wrapper = mountDraggable({
            ownProps: disabledOwnProps,
            mapProps: draggingMapProps,
          });

          const drop = () => wrapper.find(DragHandle).props().callbacks.onDrop();

          expect(drop).toThrow();
        });

        it('should throw if not attached to the DOM', () => {
          const wrapper = mountDraggable();
          const drop = () => {
            wrapper.find(DragHandle).props().callbacks.onDrop();
          };

          wrapper.unmount();

          expect(drop).toThrow();
        });

        it('should trigger drop', () => {
          const dispatchProps = getDispatchPropsStub();
          const wrapper = mountDraggable({
            dispatchProps,
          });

          wrapper.find(DragHandle).props().callbacks.onDrop();

          expect(dispatchProps.drop).toBeCalled();
        });
      });

      describe('onMoveBackward', () => {
        it('should throw if dragging is disabled', () => {
          const wrapper = mountDraggable({
            ownProps: disabledOwnProps,
          });

          const tryMove = () =>
            wrapper.find(DragHandle).props().callbacks.onMoveBackward(draggableId);

          expect(tryMove).toThrow();
        });

        it('should throw if not attached to the DOM', () => {
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
          });
          const tryMove = () =>
            wrapper.find(DragHandle).props().callbacks.onMoveBackward(draggableId);

          wrapper.unmount();

          expect(tryMove).toThrow();
        });

        it('should call the move backward action', () => {
          const dispatchProps = getDispatchPropsStub();
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
            dispatchProps,
          });

          wrapper.find(DragHandle).props().callbacks.onMoveBackward(draggableId);

          expect(dispatchProps.moveBackward).toBeCalledWith(draggableId);
        });
      });

      describe('onMoveForward', () => {
        it('should throw if dragging is disabled', () => {
          const wrapper = mountDraggable({
            ownProps: disabledOwnProps,
            mapProps: draggingMapProps,
          });

          const tryMove = () =>
            wrapper.find(DragHandle).props().callbacks.onMoveForward(draggableId);

          expect(tryMove).toThrow();
        });

        it('should throw if not attached to the DOM', () => {
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
          });

          wrapper.unmount();

          const tryMove = () =>
            wrapper.find(DragHandle).props().callbacks.onMoveForward(draggableId);

          expect(tryMove).toThrow();
        });

        it('should call the move forward action', () => {
          const dispatchProps = getDispatchPropsStub();
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
            dispatchProps,
          });

          wrapper.find(DragHandle).props().callbacks.onMoveForward(draggableId);

          expect(dispatchProps.moveForward).toBeCalledWith(draggableId);
        });
      });

      describe('onCrossAxisMoveForward', () => {
        it('should throw if dragging is disabled', () => {
          const wrapper = mountDraggable({
            ownProps: disabledOwnProps,
            mapProps: draggingMapProps,
          });

          const tryMove = () =>
            wrapper.find(DragHandle).props().callbacks.onCrossAxisMoveForward(draggableId);

          expect(tryMove).toThrow();
        });

        it('should throw if not attached to the DOM', () => {
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
          });

          wrapper.unmount();

          const tryMove = () =>
            wrapper.find(DragHandle).props().callbacks.onCrossAxisMoveForward(draggableId);

          expect(tryMove).toThrow();
        });

        it('should call the cross axis move forward action', () => {
          const dispatchProps = getDispatchPropsStub();
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
            dispatchProps,
          });

          wrapper.find(DragHandle).props().callbacks.onCrossAxisMoveForward(draggableId);

          expect(dispatchProps.crossAxisMoveForward).toBeCalledWith(draggableId);
        });
      });

      describe('onCrossAxisMoveBackward', () => {
        it('should throw if dragging is disabled', () => {
          const wrapper = mountDraggable({
            ownProps: disabledOwnProps,
            mapProps: draggingMapProps,
          });

          const tryMove = () =>
            wrapper.find(DragHandle).props().callbacks.onCrossAxisMoveBackward(draggableId);

          expect(tryMove).toThrow();
        });

        it('should throw if not attached to the DOM', () => {
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
          });

          wrapper.unmount();

          const tryMove = () =>
            wrapper.find(DragHandle).props().callbacks.onCrossAxisMoveBackward(draggableId);

          expect(tryMove).toThrow();
        });

        it('should call the move cross axis backwards action', () => {
          const dispatchProps = getDispatchPropsStub();
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
            dispatchProps,
          });

          wrapper.find(DragHandle).props().callbacks.onCrossAxisMoveBackward(draggableId);

          expect(dispatchProps.crossAxisMoveBackward).toBeCalledWith(draggableId);
        });
      });

      describe('onCancel', () => {
        it('should call the cancel dispatch prop', () => {
          const dispatchProps = getDispatchPropsStub();
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
            dispatchProps,
          });

          wrapper.find(DragHandle).props().callbacks.onCancel();

          expect(dispatchProps.cancel).toBeCalled();
        });

        it('should allow the action even if dragging is disabled', () => {
          const dispatchProps = getDispatchPropsStub();
          const wrapper = mountDraggable({
            ownProps: disabledOwnProps,
            mapProps: draggingMapProps,
            dispatchProps,
          });

          wrapper.find(DragHandle).props().callbacks.onCancel();

          expect(dispatchProps.cancel).toBeCalled();
        });

        it('should allow the action even when not attached to the dom', () => {
          const dispatchProps = getDispatchPropsStub();
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
            dispatchProps,
          });

          wrapper.find(DragHandle).props().callbacks.onCancel();

          expect(dispatchProps.cancel).toBeCalled();
        });
      });

      describe('onWindowScroll', () => {
        it('should throw if dragging is disabled', () => {
          const wrapper = mountDraggable({
            ownProps: disabledOwnProps,
            mapProps: draggingMapProps,
          });

          const tryUpdateWindowScroll = () =>
            wrapper.find(DragHandle).props().callbacks.onWindowScroll();

          expect(tryUpdateWindowScroll).toThrow();
        });

        it('should throw if not attached to the DOM', () => {
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
          });

          wrapper.unmount();

          const tryUpdateWindowScroll = () =>
            wrapper.find(DragHandle).props().callbacks.onWindowScroll();

          expect(tryUpdateWindowScroll).toThrow();
        });

        it('should call the move forward action', () => {
          setViewport(customViewport);
          const dispatchProps = getDispatchPropsStub();
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
            dispatchProps,
          });

          wrapper.find(DragHandle).props().callbacks.onWindowScroll();

          expect(dispatchProps.moveByWindowScroll).toBeCalledWith(
            draggableId, getViewport(),
          );
          resetViewport();
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

      expect(props.style).toEqual({
        width: dimension.placeholder.paddingBox.width,
        height: dimension.placeholder.paddingBox.height,
        marginTop: dimension.placeholder.margin.top,
        marginBottom: dimension.placeholder.margin.bottom,
        marginLeft: dimension.placeholder.margin.left,
        marginRight: dimension.placeholder.margin.right,
        display: dimension.placeholder.display,
        boxSizing: 'border-box',
        pointerEvents: 'none',
      });
      expect(child.type()).toBe(dimension.placeholder.tagName);
    });

    it('should be above Draggables that are not dragging', () => {
      // dragging item
      const draggingMock = jest.fn();
      mountDraggable({
        mapProps: draggingMapProps,
        WrappedComponent: getStubber(draggingMock),
      });
      const draggingProvided: Provided = getLastCall(draggingMock)[0].provided;
      const draggingStyle: DraggingStyle = (draggingProvided.draggableProps.style : any);

      // not dragging item
      const notDraggingMock = jest.fn();
      mountDraggable({
        mapProps: somethingElseDraggingMapProps,
        WrappedComponent: getStubber(notDraggingMock),
      });
      const notDraggingProvided: Provided = getLastCall(notDraggingMock)[0].provided;
      const notDraggingStyle: NotDraggingStyle = (notDraggingProvided.draggableProps.style : any);
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
      const draggingProvided: Provided = getLastCall(draggingMock)[0].provided;
      const returningHomeMock = jest.fn();
      mountDraggable({
        mapProps: dropAnimatingMapProps,
        WrappedComponent: getStubber(returningHomeMock),
      });
      const returningHomeProvided: Provided = getLastCall(returningHomeMock)[0].provided;

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
        width: dimension.page.marginBox.width,
        height: dimension.page.marginBox.height,
        boxSizing: 'border-box',
        top: dimension.page.marginBox.top,
        left: dimension.page.marginBox.left,
        margin: 0,
        pointerEvents: 'none',
        transition: 'none',
        transform: null,
        zIndex: zIndexOptions.dragging,
      };

      const provided: Provided = getLastCall(myMock)[0].provided;
      expect(provided.draggableProps.style).toEqual(expected);
    });

    it('should be positioned in the correct offset while dragging', () => {
      const myMock = jest.fn();
      const offset: Position = { x: 10, y: 20 };
      // $ExpectError - using spread
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
        width: dimension.page.marginBox.width,
        height: dimension.page.marginBox.height,
        top: dimension.page.marginBox.top,
        left: dimension.page.marginBox.left,
        margin: 0,
        pointerEvents: 'none',
        transition: 'none',
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      };

      const provided: Provided = getLastCall(myMock)[0].provided;
      expect(provided.draggableProps.style).toEqual(expected);
    });

    it('should not move instantly if drag animation is enabled', () => {
      // $ExpectError - spread operator on exact type
      const mapProps: MapProps = {
        ...draggingMapProps,
        shouldAnimateDragMovement: true,
      };

      const wrapper = mountDraggable({
        mapProps,
      });

      expect(wrapper.find(Moveable).props().speed).toBe('FAST');
    });

    it('should move by the provided offset on mount', () => {
      const myMock = jest.fn();
      const expected: DraggingStyle = {
        // property under test:
        transform: `translate(${draggingMapProps.offset.x}px, ${draggingMapProps.offset.y}px)`,
        // other properties
        transition: 'none',
        position: 'fixed',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: zIndexOptions.dragging,
        width: dimension.page.marginBox.width,
        height: dimension.page.marginBox.height,
        top: dimension.page.marginBox.top,
        left: dimension.page.marginBox.left,
        margin: 0,
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

        const provided: Provided = myMock.mock.calls[myMock.mock.calls.length - 1][0].provided;
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
      // $ExpectError - using spread
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
      // $ExpectError - using spread
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
      const notDraggingProvided: Provided = getLastCall(notDraggingMock)[0].provided;
      const notDraggingStyle: NotDraggingStyle = (notDraggingProvided.draggableProps.style : any);
      // returning home
      const dropAnimatingMock = jest.fn();
      mountDraggable({
        mapProps: dropAnimatingMapProps,
        WrappedComponent: getStubber(dropAnimatingMock),
      });
      const droppingProvided: Provided = getLastCall(dropAnimatingMock)[0].provided;
      const droppingStyle: DraggingStyle = (droppingProvided.draggableProps.style : any);
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
        width: dimension.page.marginBox.width,
        height: dimension.page.marginBox.height,
        top: dimension.page.marginBox.top,
        left: dimension.page.marginBox.left,
        margin: 0,
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
          // $ExpectError - using spread
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

        // $ExpectError - spread
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

        it('should instantly move out of the way without css if animation is disabled', () => {
          const myMock = jest.fn();
          const CustomStubber = getStubber(myMock);
          // $ExpectError - using spread
          const customProps: MapProps = {
            ...mapProps,
            canAnimate: false,
          };
          const expected: NotDraggingStyle = {
            transition: null,
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

  describe.only('Portal usage', () => {
    const body: ?HTMLElement = document.body;
    if (!body) {
      throw new Error('Portal test requires document.body to be present');
    }

    class WithPortal extends Component<{ provided: Provided, snapshot: StateSnapshot }> {
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
      expect(inPortal.parentElement).toBe(wrapper.find(WithPortal).instance().portal);

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
      // latest will not be the same as the original ref as it is remounted after leaving the portal
      expect(latest).not.toBe(original);
      // no longer in a portal
      expect(latest).not.toBe(wrapper.find(WithPortal).instance().portal);
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
      expect(inPortal.parentElement).toBe(wrapper.find(WithPortal).instance().portal);

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
      // latest will not be the same as the original ref as it is remounted after leaving the portal
      expect(latest).not.toBe(original);
      // no longer in a portal
      expect(latest).not.toBe(wrapper.find(WithPortal).instance().portal);
    });
  });
});
