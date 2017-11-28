// @flow
/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import { mount } from 'enzyme';
// eslint-disable-next-line no-duplicate-imports
import type { ReactWrapper } from 'enzyme';
import Draggable, { zIndexOptions } from '../../../src/view/draggable/draggable';
import DragHandle from '../../../src/view/drag-handle/drag-handle';
import { sloppyClickThreshold } from '../../../src/view/drag-handle/util/is-sloppy-click-threshold-exceeded';
import Moveable from '../../../src/view/moveable/';
import Placeholder from '../../../src/view/placeholder';
import { css } from '../../../src/view/animation';
import { add, subtract } from '../../../src/state/position';
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
  DraggableId,
  DroppableId,
  TypeId,
  InitialDragLocation,
} from '../../../src/types';
import { getDraggableDimension } from '../../../src/state/dimension';
import getClientRect from '../../../src/state/get-client-rect';
import { combine, withStore, withDroppableId } from '../../utils/get-context-options';
import { dispatchWindowMouseEvent, mouseEvent } from '../../utils/user-input-util';
import setWindowScroll from '../../utils/set-window-scroll';
import getWindowScrollPosition from '../../../src/view/get-window-scroll-position';

class Item extends Component<{ provided: Provided }> {
  render() {
    const provided: Provided = this.props.provided;

    return (
      <div
        className="item"
        ref={ref => provided.innerRef(ref)}
        style={provided.draggableStyle}
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

const dimension: DraggableDimension = getDraggableDimension({
  id: draggableId,
  droppableId,
  clientRect: getClientRect({
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
  isDropAnimating: false,
  isDragging: false,
  canLift: true,
  canAnimate: true,
  offset: origin,
  dimension: null,
  direction: null,
};

const somethingElseDraggingMapProps: MapProps = {
  isDropAnimating: false,
  isDragging: false,
  canLift: false,
  canAnimate: true,
  offset: origin,
  dimension: null,
  direction: null,
};

const draggingMapProps: MapProps = {
  isDropAnimating: false,
  isDragging: true,
  canLift: false,
  canAnimate: false,
  dimension,
  offset: { x: 75, y: 75 },
  // this may or may not be set during a drag
  direction: null,
};

const dropAnimatingMapProps: MapProps = {
  isDragging: false,
  isDropAnimating: true,
  canAnimate: true,
  // cannot lift while dropping
  canLift: false,
  dimension,
  offset: { x: 75, y: 75 },
  direction: null,
};

const dropCompleteMapProps: MapProps = {
  offset: origin,
  canLift: true,
  isDropAnimating: false,
  isDragging: false,
  canAnimate: false,
  dimension: null,
  direction: null,
};

type MountConnected = {|
  ownProps?: OwnProps,
  mapProps?: MapProps,
  dispatchProps?: DispatchProps,
  WrappedComponent?: any,
|};

const mountDraggable = ({
  ownProps = defaultOwnProps,
  mapProps = defaultMapProps,
  dispatchProps = getDispatchPropsStub(),
  WrappedComponent = Item,
}: MountConnected = {}): ReactWrapper => mount(
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
  , combine(withStore(), withDroppableId(droppableId)));

const mouseDown = mouseEvent.bind(null, 'mousedown');
const windowMouseMove = dispatchWindowMouseEvent.bind(null, 'mousemove');

const originalWindowScroll: Position = getWindowScrollPosition();

type StartDrag = {|
  selection?: Position,
  center ?: Position,
  windowScroll?: Position,
  isScrollAllowed?: boolean,
|}

const stubClientRect = (center?: Position = origin): void =>
  // $ExpectError
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => getClientRect({
    left: 0,
    top: 0,
    right: center.x * 2,
    bottom: center.y * 2,
  }));

const executeOnLift = (wrapper: ReactWrapper) => ({
  selection = origin,
  center = origin,
  windowScroll = origin,
  isScrollAllowed = false,
}: StartDrag = {}) => {
  setWindowScroll(windowScroll);
  stubClientRect(center);

  wrapper.find(DragHandle).props().callbacks.onLift({ client: selection, isScrollAllowed });
};

const getFromLift = (dispatchProps: DispatchProps) => {
  const [
    draggableIdArg,
    typeArg,
    clientArg,
    windowScrollArg,
    isScrollAllowedArg,
    // $ExpectError - mock property
  ] = dispatchProps.lift.mock.calls[0];

  return {
    draggableId: draggableIdArg,
    type: typeArg,
    client: clientArg,
    windowScroll: windowScrollArg,
    isScrollAllowed: isScrollAllowedArg,
  };
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

describe('Draggable - unconnected', () => {
  beforeAll(() => {
    requestAnimationFrame.reset();
  });

  afterEach(() => {
    if (Element.prototype.getBoundingClientRect.mockRestore) {
      Element.prototype.getBoundingClientRect.mockRestore();
    }
    requestAnimationFrame.reset();
    setWindowScroll(originalWindowScroll, { shouldPublish: false });
  });

  afterAll(() => {
    requestAnimationFrame.reset();
  });

  it('should not create any wrapping elements', () => {
    const wrapper: ReactWrapper = mountDraggable();

    const node = wrapper.getDOMNode();

    expect(node.className).toBe('item');
  });

  describe('drag handle', () => {
    const startDragWithHandle = (wrapper: ReactWrapper) => ({
      selection = origin,
      center = origin,
    }: StartDrag = {}) => {
      // fake some position to get the center we want
      stubClientRect(center);

      mouseDown(wrapper, subtract(selection, { x: 0, y: sloppyClickThreshold }));
      windowMouseMove(selection);
    };

    it('should allow you to attach a drag handle', () => {
      const dispatchProps: DispatchProps = getDispatchPropsStub();
      const wrapper = mountDraggable({
        dispatchProps,
        WrappedComponent: Item,
      });

      startDragWithHandle(wrapper.find(Item))();

      expect(dispatchProps.lift).toHaveBeenCalled();
    });

    describe('non standard drag handle', () => {
      class WithNestedHandle extends Component<{ provided: Provided }> {
        render() {
          const provided: Provided = this.props.provided;
          return (
            <div
              ref={ref => provided.innerRef(ref)}
              style={provided.draggableStyle}
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
        const wrapper = mountDraggable({
          dispatchProps,
          WrappedComponent: WithNestedHandle,
        });

        startDragWithHandle(wrapper.find(WithNestedHandle).find('.can-drag'))();

        expect(dispatchProps.lift).toHaveBeenCalled();
      });

      it('should not drag by the draggable element', () => {
        const dispatchProps: DispatchProps = getDispatchPropsStub();
        const wrapper = mountDraggable({
          dispatchProps,
          WrappedComponent: WithNestedHandle,
        });

        startDragWithHandle(wrapper.find(WithNestedHandle))();

        expect(dispatchProps.lift).not.toHaveBeenCalled();
      });

      it('should not drag by other elements', () => {
        const dispatchProps: DispatchProps = getDispatchPropsStub();
        const wrapper = mountDraggable({
          dispatchProps,
          WrappedComponent: WithNestedHandle,
        });

        startDragWithHandle(wrapper.find(WithNestedHandle).find('.cannot-drag'))();

        expect(dispatchProps.lift).not.toHaveBeenCalled();
      });
    });

    describe('handling events', () => {
      describe('onLift', () => {
        let dispatchProps;
        let wrapper;

        beforeEach(() => {
          dispatchProps = getDispatchPropsStub();
          wrapper = mountDraggable({
            dispatchProps,
          });
        });

        afterEach(() => {
          wrapper.unmount();
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

        it('should lift with the draggable id', () => {
          executeOnLift(wrapper)();

          expect(getFromLift(dispatchProps).draggableId).toBe(draggableId);
        });

        it('should lift with the draggable type', () => {
          executeOnLift(wrapper)();

          expect(getFromLift(dispatchProps).type).toBe(type);
        });

        it('should lift with the client location', () => {
          const selection: Position = {
            x: 100,
            y: 200,
          };
          // made up
          const center: Position = {
            x: 50,
            y: 60,
          };
          const client: InitialDragLocation = {
            selection,
            center,
          };

          executeOnLift(wrapper)({ selection, center });

          expect(getFromLift(dispatchProps).client).toEqual(client);
        });

        it('should lift with the window scroll', () => {
          const windowScroll = {
            x: 20,
            y: 30,
          };

          executeOnLift(wrapper)({ windowScroll });

          expect(getFromLift(dispatchProps).windowScroll).toEqual(windowScroll);
        });

        it('should publish that container scrolling is allowed', () => {
          const dispatchProps1: DispatchProps = getDispatchPropsStub();
          const wrapper1: ReactWrapper = mountDraggable({
            dispatchProps: dispatchProps1,
          });
          const dispatchProps2: DispatchProps = getDispatchPropsStub();
          const wrapper2: ReactWrapper = mountDraggable({
            dispatchProps: dispatchProps2,
          });

          executeOnLift(wrapper1)({ isScrollAllowed: true });
          executeOnLift(wrapper2)({ isScrollAllowed: false });

          expect(getFromLift(dispatchProps1).isScrollAllowed).toEqual(true);
          expect(getFromLift(dispatchProps2).isScrollAllowed).toEqual(false);
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

        it('should publish the window scroll', () => {
          const windowScroll: Position = {
            x: 10,
            y: 20,
          };
          setWindowScroll(windowScroll);

          const dispatchProps = getDispatchPropsStub();
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
            dispatchProps,
          });

          wrapper.find(DragHandle).props().callbacks.onMove(origin);
          const [, , windowScrollResult] = getLastCall(dispatchProps.move);

          expect(windowScrollResult).toEqual(windowScroll);
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
          const windowScroll: Position = {
            x: 250,
            y: 321,
          };
          setWindowScroll(windowScroll);
          const dispatchProps = getDispatchPropsStub();
          const wrapper = mountDraggable({
            mapProps: draggingMapProps,
            dispatchProps,
          });

          wrapper.find(DragHandle).props().callbacks.onWindowScroll();

          expect(dispatchProps.moveByWindowScroll).toBeCalledWith(
            draggableId, windowScroll,
          );
        });
      });
    });
  });

  describe('is dragging', () => {
    it('should render a placeholder', () => {
      const myMock = jest.fn();

      mountDraggable({
        mapProps: draggingMapProps,
        WrappedComponent: getStubber(myMock),
      });

      const provided: Provided = getLastCall(myMock)[0].provided;
      // $ExpectError - because we do not have the correct React type for placeholder
      expect(provided.placeholder.type).toBe(Placeholder);
    });

    it('should give a placeholder the same dimension of the element being moved', () => {
      const myMock = jest.fn();
      const Stubber = getStubber(myMock);

      mountDraggable({
        mapProps: draggingMapProps,
        WrappedComponent: Stubber,
      });
      // finish moving to the initial position
      requestAnimationFrame.flush();

      const provided: Provided = getLastCall(myMock)[0].provided;
      // $ExpectError - because we do not have the correct React type for placeholder
      expect(provided.placeholder.props.placeholder).toBe(dimension.placeholder);
    });

    it('should be above Draggables that are not dragging', () => {
      // dragging item
      const draggingMock = jest.fn();
      mountDraggable({
        mapProps: draggingMapProps,
        WrappedComponent: getStubber(draggingMock),
      });
      const draggingProvided: Provided = getLastCall(draggingMock)[0].provided;
      const draggingStyle: DraggingStyle = (draggingProvided.draggableStyle : any);

      // not dragging item
      const notDraggingMock = jest.fn();
      mountDraggable({
        mapProps: somethingElseDraggingMapProps,
        WrappedComponent: getStubber(notDraggingMock),
      });
      const notDraggingProvided: Provided = getLastCall(notDraggingMock)[0].provided;
      const notDraggingStyle: NotDraggingStyle = (notDraggingProvided.draggableStyle : any);
      const notDraggingExpected: NotDraggingStyle = {
        transform: null,
        transition: css.outOfTheWay,
        pointerEvents: 'none',
        // BaseStyle
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'rgba(0,0,0,0)',
        touchAction: 'manipulation',
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

      // $ExpectError - not type checking draggableStyle
      expect(draggingProvided.draggableStyle.zIndex)
      // $ExpectError - not type checking draggableStyle
        .toBeGreaterThan(returningHomeProvided.draggableStyle.zIndex);
    });

    it('should be positioned in the same spot as before the drag', () => {
      const myMock = jest.fn();
      mountDraggable({
        mapProps: draggingMapProps,
        WrappedComponent: getStubber(myMock),
      });
      const expected: DraggingStyle = {
        position: 'fixed',
        zIndex: zIndexOptions.dragging,
        boxSizing: 'border-box',
        width: dimension.page.withMargin.width,
        height: dimension.page.withMargin.height,
        top: dimension.page.withMargin.top,
        left: dimension.page.withMargin.left,
        margin: 0,
        transform: null,
        pointerEvents: 'none',
        // BaseStyle
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'rgba(0,0,0,0)',
        touchAction: 'manipulation',
      };

      const provided: Provided = getLastCall(myMock)[0].provided;
      expect(provided.draggableStyle).toEqual(expected);
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
        width: dimension.page.withMargin.width,
        height: dimension.page.withMargin.height,
        top: dimension.page.withMargin.top,
        left: dimension.page.withMargin.left,
        margin: 0,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        pointerEvents: 'none',
        // BaseStyle
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'rgba(0,0,0,0)',
        touchAction: 'manipulation',
      };

      const provided: Provided = getLastCall(myMock)[0].provided;
      expect(provided.draggableStyle).toEqual(expected);
    });

    it('should move quickly if it can animate', () => {
      // $ExpectError - spread operator on exact type
      const mapProps: MapProps = {
        ...draggingMapProps,
        canAnimate: true,
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
        position: 'fixed',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: zIndexOptions.dragging,
        width: dimension.page.withMargin.width,
        height: dimension.page.withMargin.height,
        top: dimension.page.withMargin.top,
        left: dimension.page.withMargin.left,
        margin: 0,
        // BaseStyle
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'rgba(0,0,0,0)',
        touchAction: 'manipulation',
      };

      mountDraggable({
        mapProps: draggingMapProps,
        WrappedComponent: getStubber(myMock),
      });
      // finish moving to the initial position
      requestAnimationFrame.flush();

      // first call is for the setRef
      const provided: Provided = getLastCall(myMock)[0].provided;
      const style: DraggingStyle = (provided.draggableStyle: any);

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
        const style: DraggingStyle = (provided.draggableStyle: any);
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
  });

  describe('drop animating', () => {
    it('should render a placeholder', () => {
      const myMock = jest.fn();

      mountDraggable({
        mapProps: dropAnimatingMapProps,
        WrappedComponent: getStubber(myMock),
      });

      const provided: Provided = getLastCall(myMock)[0].provided;

      // $ExpectError - because we do not have the correct React type for placeholder
      expect(provided.placeholder.type).toBe(Placeholder);
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
      const notDraggingStyle: NotDraggingStyle = (notDraggingProvided.draggableStyle : any);
      // returning home
      const dropAnimatingMock = jest.fn();
      mountDraggable({
        mapProps: dropAnimatingMapProps,
        WrappedComponent: getStubber(dropAnimatingMock),
      });
      const droppingProvided: Provided = getLastCall(dropAnimatingMock)[0].provided;
      const droppingStyle: DraggingStyle = (droppingProvided.draggableStyle : any);
      const expectedNotDraggingStyle: NotDraggingStyle = {
        transition: css.outOfTheWay,
        transform: null,
        pointerEvents: 'none',
        // BaseStyle
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'rgba(0,0,0,0)',
        touchAction: 'manipulation',
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
        zIndex: zIndexOptions.dropAnimating,
        width: dimension.page.withMargin.width,
        height: dimension.page.withMargin.height,
        top: dimension.page.withMargin.top,
        left: dimension.page.withMargin.left,
        margin: 0,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        pointerEvents: 'none',
        // BaseStyle
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'rgba(0,0,0,0)',
        touchAction: 'manipulation',
      };

      mountDraggable({
        mapProps: dropAnimatingMapProps,
        WrappedComponent: getStubber(myMock),
      });
      // finish the animation
      requestAnimationFrame.flush();

      const provided: Provided = getLastCall(myMock)[0].provided;
      expect(provided.draggableStyle).toEqual(expected);
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
    mountDraggable({
      mapProps: dropCompleteMapProps,
      WrappedComponent: getStubber(myMock),
    });
    const provided: Provided = getLastCall(myMock)[0].provided;
    const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;

    it('should not render a placeholder', () => {
      expect(provided.placeholder).toBe(null);
    });

    it('should not be moved from its original position', () => {
      const style: NotDraggingStyle = {
        transform: null,
        transition: null,
        pointerEvents: 'auto',
        // BaseStyle
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'rgba(0,0,0,0)',
        touchAction: 'manipulation',
      };

      expect(provided.draggableStyle).toEqual(style);
    });

    it('should let consumers know that the item is not dragging', () => {
      expect(snapshot.isDragging).toBe(false);
    });
  });

  describe('is not dragging', () => {
    describe('nothing else is dragging', () => {
      let provided: Provided;
      let snapshot: StateSnapshot;

      beforeEach(() => {
        const myMock = jest.fn();
        mountDraggable({
          mapProps: defaultMapProps,
          WrappedComponent: getStubber(myMock),
        });
        provided = getLastCall(myMock)[0].provided;
        snapshot = getLastCall(myMock)[0].snapshot;
      });

      it('should not render a placeholder', () => {
        expect(provided.placeholder).toBe(null);
      });

      it('should have base inline styles', () => {
        const expected: NotDraggingStyle = {
          transform: null,
          transition: css.outOfTheWay,
          pointerEvents: 'auto',
          // BaseStyle
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'rgba(0,0,0,0)',
          touchAction: 'manipulation',
        };

        expect(provided.draggableStyle).toEqual(expected);
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
          expect(provided.placeholder).toBe(null);
        });

        it('should return animate out of the way with css', () => {
          const expected: NotDraggingStyle = {
            transition: css.outOfTheWay,
            pointerEvents: 'none',
            transform: null,
            // BaseStyle
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'rgba(0,0,0,0)',
            touchAction: 'manipulation',
          };
          expect(provided.draggableStyle).toEqual(expected);
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
            canAnimate: false,
          };
          const expected: NotDraggingStyle = {
            transition: null,
            transform: null,
            pointerEvents: 'none',
            // BaseStyle
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'rgba(0,0,0,0)',
            touchAction: 'manipulation',
          };

          const customWrapper = mountDraggable({
            ownProps: disabledOwnProps,
            mapProps,
            WrappedComponent: CustomStubber,
          });

          const customProvided: Provided = getLastCall(myMock)[0].provided;
          expect(customWrapper.find(Moveable).props().speed).toBe('INSTANT');
          expect(customProvided.draggableStyle).toEqual(expected);
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
          expect(provided.placeholder).toBe(null);
        });

        it('should animate out of the way with css', () => {
          const expected: NotDraggingStyle = {
            pointerEvents: 'none',
            transition: css.outOfTheWay,
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            // BaseStyle
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'rgba(0,0,0,0)',
            touchAction: 'manipulation',
          };

          expect(provided.draggableStyle).toEqual(expected);
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
            pointerEvents: 'none',
            transition: null,
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            // BaseStyle
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'rgba(0,0,0,0)',
            touchAction: 'manipulation',
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
          expect(customProvided.draggableStyle).toEqual(expected);
        });

        it('should let consumers know that the item is not dragging', () => {
          expect(snapshot.isDragging).toBe(false);
        });
      });
    });
  });
});
