// @flow
import { Component } from 'react';
import invariant from 'invariant';
import memoizeOne from 'memoize-one';
import rafSchedule from 'raf-schd';
// Using keyCode's for consistent event pattern matching between
// React synthetic events as well as raw browser events.
import * as keyCodes from '../key-codes';
import getWindowFromRef from '../get-window-from-ref';
import type { Position, HTMLElement } from '../../types';
import type {
  Props,
  DragTypes,
  Provided,
  MouseForceChangedEvent,
} from './drag-handle-types';

const noop = (): void => { };
const getFalse: () => boolean = () => false;

// If we are making an action based on an event often we want to
// prevent the default browser action and stop any other elements
// from receiving the event.
const stop = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
};

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const primaryButton = 0;

// The amount of pixels that need to move before we consider the movement
// a drag rather than a click.
export const sloppyClickThreshold: number = 5;

type State = {
  draggingWith: ?DragTypes,
  pending: ?Position,
};

type ExecuteBasedOnDirection = {|
  vertical: () => void,
  horizontal: () => void,
|}

const isSloppyClickThresholdExceeded = (original: Position, current: Position): boolean =>
  Math.abs(current.x - original.x) >= sloppyClickThreshold ||
  Math.abs(current.y - original.y) >= sloppyClickThreshold;

export default class DragHandle extends Component {
  /* eslint-disable react/sort-comp */

  props: Props
  state: State

  state: State = {
    draggingWith: null,
    pending: null,
  };

  preventClick: boolean
  touchDragStartTimerId: ?number = null;

  ifDragging = (fn: Function) => {
    if (this.state.draggingWith) {
      fn();
    }
  }

  // There is a case where if this is fired between
  // two different drags with the same x,y then the second
  // drag will not fire a move. This will only effect the
  // first frame. It was decided that this is better than
  // needing to clear the memoization cache between drags
  // given that it is a huge edge case.
  memoizedMove = memoizeOne((x: number, y: number) => {
    const point: Position = { x, y };
    this.props.callbacks.onMove(point);
  });

  // scheduled functions
  scheduleMove = rafSchedule((point: Position) => {
    this.ifDragging(() => this.memoizedMove(point.x, point.y));
  });

  scheduleMoveForward = rafSchedule(() => {
    this.ifDragging(this.props.callbacks.onMoveForward);
  })

  scheduleMoveBackward = rafSchedule(() => {
    this.ifDragging(this.props.callbacks.onMoveBackward);
  });

  scheduleCrossAxisMoveForward = rafSchedule(() => {
    this.ifDragging(this.props.callbacks.onCrossAxisMoveForward);
  })

  scheduleCrossAxisMoveBackward = rafSchedule(() => {
    this.ifDragging(this.props.callbacks.onCrossAxisMoveBackward);
  });

  scheduleWindowScrollMove = rafSchedule(() => {
    this.ifDragging(this.props.callbacks.onWindowScroll);
  });
  /* eslint-enable react/sort-comp */

  componentWillUnmount() {
    if (!this.state.draggingWith) {
      return;
    }
    this.preventClick = false;
    this.unbindWindowEvents();
    this.props.callbacks.onCancel();
  }

  // TODO: there is a scenario where events will not be unbound:
  // - listeners are bound
  // - drag is cancelled during the COLLECTING_DIMENSION phase
  // FIX: need to know when a drag is cancelled / cleaned during the
  // COLLECTING_DIMENSIONS phase.
  componentWillReceiveProps(nextProps: Props) {
    // if the application cancels a drag we need to unbind the handlers
    const isDragStopping: boolean = (this.props.isDragging && !nextProps.isDragging);
    if (isDragStopping && this.state.draggingWith) {
      this.stopDragging();
      return;
    }

    if (nextProps.isEnabled) {
      return;
    }

    // dragging is *not* enabled

    // if a drag is pending - clear it
    if (this.state.pending) {
      this.stopPendingDrag();
      return;
    }

    // need to cancel a current drag
    if (this.state.draggingWith) {
      this.stopDragging(() => this.props.callbacks.onCancel());
    }
  }

  onWindowResize = () => {
    if (this.state.pending) {
      this.stopPendingDrag();
      return;
    }

    if (!this.state.draggingWith) {
      return;
    }

    this.stopDragging(() => this.props.callbacks.onCancel());
  }

  onWindowScroll = () => {
    const { pending, draggingWith } = this.state;

    if (!draggingWith) {
      return;
    }

    if (pending) {
      // TODO: need to do different things if mouse orgit st
      this.stopPendingTouchDrag();
      return;
    }

    if (draggingWith === 'MOUSE') {
      this.scheduleWindowScrollMove();
      return;
    }

    if (draggingWith === 'KEYBOARD') {
      // currently not supporting window scrolling with a keyboard
      this.stopDragging(() => this.props.callbacks.onCancel());
    }
  }

  onWindowMouseMove = (event: MouseEvent) => {
    console.log('on window mouse move');
    const { draggingWith, pending } = this.state;
    if (draggingWith === 'KEYBOARD') {
      return;
    }

    // Mouse dragging

    const { button, clientX, clientY } = event;
    if (button !== primaryButton) {
      return;
    }

    const point: Position = {
      x: clientX,
      y: clientY,
    };

    if (!pending) {
      this.scheduleMove(point);
      return;
    }

    // not yet dragging
    const shouldStartDrag: boolean = isSloppyClickThresholdExceeded(pending, point);

    if (shouldStartDrag) {
      console.log('starting mouse drag???');
      this.startDragging('MOUSE', () => this.props.callbacks.onLift(point));
    }
  };

  onWindowMouseUp = () => {
    // Did not move far enough for it to actually be a drag
    if (this.state.pending) {
      // not blocking the default event - letting it pass through
      this.stopPendingDrag();
      return;
    }

    if (!this.state.draggingWith) {
      console.error('should not be listening to mouse up events when nothing is dragging');
      return;
    }

    if (this.state.draggingWith !== 'MOUSE') {
      return;
    }

    // Allowing any event.button type to drop. Otherwise you
    // might not get a corresponding mouseup with a mousedown.
    // We could do a`cancel` if the button is not the primary.
    this.stopDragging(() => this.props.callbacks.onDrop());
  };

  onWindowMouseDown = () => {
    console.log('on window mouse down');
    // this can happen during a drag when the user clicks a button
    // other than the primary mouse button
    this.stopDragging(() => this.props.callbacks.onCancel());
  }

  onMouseDown = (event: MouseEvent) => {
    console.warn('on mouse down fired');
    if (this.state.draggingWith === 'KEYBOARD') {
      // allowing any type of mouse down to cancel
      this.stopDragging(() => this.props.callbacks.onCancel());
      return;
    }

    if (!this.props.canLift) {
      return;
    }

    const { button, clientX, clientY } = event;

    if (button !== primaryButton) {
      return;
    }

    stop(event);

    const point: Position = {
      x: clientX,
      y: clientY,
    };

    this.startPendingDrag(point, 'MOUSE');
  };

  executeBasedOnDirection = (fns: ExecuteBasedOnDirection) => {
    if (!this.props.direction) {
      console.error('cannot move based on direction when none is provided');
      this.stopDragging(() => this.props.callbacks.onCancel());
      return;
    }

    // eslint-disable-next-line no-unused-expressions
    this.props.direction === 'vertical' ? fns.vertical() : fns.horizontal();
  }

  // window keyboard events are bound during a keyboard drag
  // or after the user presses the mouse down
  onWindowKeyDown = (event: KeyboardEvent): void => {
    const isMouseDragPending: boolean = Boolean(this.state.pending);

    if (isMouseDragPending) {
      if (event.keyCode === keyCodes.escape) {
        stop(event);
        this.stopPendingDrag();
      }
      return;
    }

    if (!this.state.draggingWith) {
      console.error('should not be listening to window mouse up if nothing is dragging');
      this.stopDragging(() => this.props.callbacks.onCancel());
      return;
    }

    // Dragging with either a keyboard or mouse

    // Blocking standard submission action
    if (event.keyCode === keyCodes.enter) {
      event.preventDefault();
      return;
    }

    // Preventing tabbing or submitting
    if (event.keyCode === keyCodes.tab) {
      event.preventDefault();
      return;
    }

    if (event.keyCode === keyCodes.escape) {
      event.preventDefault();
      this.stopDragging(() => this.props.callbacks.onCancel());
    }
  }

  // When dragging with a mouse - the element may not have focus
  // When dragging with a keyboard - the element will have focus
  onKeyDown = (event: KeyboardEvent): void => {
    if (!this.props.isEnabled) {
      return;
    }

    // Handled in the window key down function as it may not have focus
    if (this.state.pending || this.state.draggingWith === 'MOUSE') {
      return;
    }

    const canStartKeyboardDrag: boolean = this.props.canLift && !this.state.draggingWith;
    const isKeyboardDragging: boolean = this.state.draggingWith === 'KEYBOARD';

    if (!canStartKeyboardDrag && !isKeyboardDragging) {
      return;
    }

    if (canStartKeyboardDrag) {
      // Lifting with a keyboard
      if (event.keyCode === keyCodes.space) {
        stop(event);
        this.startDragging('KEYBOARD', () => this.props.callbacks.onKeyLift());
      }
      return;
    }

    if (!this.props.direction) {
      console.error('cannot handle keyboard event if direction is not provided');
      stop(event);
      this.stopDragging(() => this.props.callbacks.onCancel());
      return;
    }

    // Dropping

    if (event.keyCode === keyCodes.space) {
      // need to stop parent Draggable's thinking this is a lift
      stop(event);
      this.stopDragging(() => this.props.callbacks.onDrop());
    }

    // Movement

    if (event.keyCode === keyCodes.arrowDown) {
      stop(event);
      this.executeBasedOnDirection({
        vertical: this.scheduleMoveForward,
        horizontal: this.scheduleCrossAxisMoveForward,
      });
      return;
    }

    if (event.keyCode === keyCodes.arrowUp) {
      stop(event);
      this.executeBasedOnDirection({
        vertical: this.scheduleMoveBackward,
        horizontal: this.scheduleCrossAxisMoveBackward,
      });
      return;
    }

    if (event.keyCode === keyCodes.arrowRight) {
      stop(event);
      this.executeBasedOnDirection({
        vertical: this.scheduleCrossAxisMoveForward,
        horizontal: this.scheduleMoveForward,
      });
      return;
    }

    if (event.keyCode === keyCodes.arrowLeft) {
      stop(event);
      this.executeBasedOnDirection({
        vertical: this.scheduleCrossAxisMoveBackward,
        horizontal: this.scheduleMoveBackward,
      });
    }
  }

  onClick = (event: MouseEvent): void => {
    if (!this.preventClick) {
      return;
    }
    this.preventClick = false;
    event.preventDefault();
  }

  startPendingDrag = (point: Position, type: DragTypes) => {
    if (this.state.draggingWith) {
      console.error('cannot start a pending mouse drag when already dragging');
      return;
    }

    if (this.state.pending) {
      console.error('cannot start a pending mouse drag when there is already a pending position');
      return;
    }

    // need to bind the window events
    this.bindWindowEvents(type);

    const state: State = {
      draggingWith: null,
      pending: point,
    };

    this.setState(state);
  }

  startDragging = (type: DragTypes, done?: () => void = noop) => {
    console.info('staring drag:', type);
    if (this.state.draggingWith) {
      console.error('cannot start dragging when already dragging');
      return;
    }

    if (type === 'MOUSE' && !this.state.pending) {
      console.error('cannot start mouse drag when there is not a pending position');
      return;
    }

    if (type === 'TOUCH' && !this.state.pending) {
      console.error('cannot start touch drag when there is not a pending position');
      return;
    }

    // keyboard events already bound for mouse dragging
    if (type === 'KEYBOARD') {
      this.bindWindowEvents(type);
    }

    const state: State = {
      draggingWith: type,
      pending: null,
    };
    this.setState(state, done);
  }

  stopPendingDrag = (done?: () => void = noop) => {
    invariant(this.state.pending, 'cannot stop pending drag when there is none');

    // we need to allow the click event to get through
    this.preventClick = false;

    this.unbindWindowEvents();
    this.setState({
      draggingWith: null,
      pending: null,
    }, done);
  }

  stopDragging = (done?: () => void = noop) => {
    if (!this.state.draggingWith) {
      console.error('cannot stop dragging when not dragging');
      return;
    }

    this.unbindWindowEvents();

    if (this.state.draggingWith === 'MOUSE') {
    // Need to block any click actions
      this.preventClick = true;
    }

    const state: State = {
      draggingWith: null,
      pending: null,
    };
    this.setState(state, done);
  }

  // touch support
  startPendingTouchDrag = (point: Position) => {
    console.log('starting pending touch drag');
    console.log('setting timeout');
    this.touchDragStartTimerId = setTimeout(
      () => {
        console.log('STARTING TOUCH DRAG AFTER TIMEOUT');
        this.startDragging('TOUCH', () => this.props.callbacks.onLift(point));
      },
      200
    );
    this.startPendingDrag(point, 'TOUCH');
  }

  stopPendingTouchDrag = (done?: Function) => {
    console.log('stop pending touch drag');
    clearTimeout(this.touchDragStartTimerId);
    this.touchDragStartTimerId = null;
    this.stopPendingDrag(done);
  }

  onTouchStart = (event: TouchEvent) => {
    // TODO: only if one finger?
    console.log('on touch start', event);
    const { clientX, clientY } = event.touches[0];
    const point: Position = {
      x: clientX,
      y: clientY,
    };
    this.startPendingTouchDrag(point);
  }

  onWindowTouchMove = (event: TouchEvent) => {
    console.log('on window touch move');
    const { pending, draggingWith } = this.state;
    const { clientX, clientY } = event.touches[0];

    const point: Position = {
      x: clientX,
      y: clientY,
    };

    if (!pending && !draggingWith) {
      console.error('should not be listening to window touch move event');
      this.stopDragging(() => this.props.callbacks.onCancel());
      return;
    }

    // drag is currently pending and has not yet started
    if (pending) {
      if (isSloppyClickThresholdExceeded(pending, point)) {
        console.log('cancelling pending touch drag', { pending, point });
        this.stopPendingTouchDrag();
        return;
      }
      // still waiting to see if drag will start
      console.log('stopping window drag handle');
      stop(event);
      return;
    }

    if (draggingWith !== 'TOUCH') {
      console.error('window touch move intercepted when not dragging with touch', draggingWith);
      return;
    }

    console.log('scheduling move', point, event);

    this.scheduleMove(point);
    stop(event);
  }

  onWindowTouchEnd = () => {
    console.log('on window touch end');
    if (this.state.pending) {
      this.stopPendingTouchDrag();
      return;
    }

    if (this.state.draggingWith !== 'TOUCH') {
      console.error('window touch end intercepted when not dragging with touch');
      this.stopDragging(() => this.props.callbacks.onCancel());
      return;
    }

    this.stopDragging(() => this.props.callbacks.onDrop());
  }

  onWindowTouchCancel = () => {
    console.log('on window touch cancel');
    if (this.state.pending) {
      this.stopPendingTouchDrag();
      return;
    }

    if (this.state.draggingWith !== 'TOUCH') {
      console.error('window touch cancel intercepted when not dragging with touch');
    }

    this.stopDragging(() => this.props.callbacks.onCancel());
  }

  onWindowContextMenu = (event: Event) => {
    console.log('on window context menu');
    if (this.state.pending || this.state.draggingWith) {
      stop(event);
    }
  }

  // Need to opt out of dragging if the user is a force press
  // Only for safari which has decided to introduce its own custom way of doing things
  // https://developer.apple.com/library/content/documentation/AppleApplications/Conceptual/SafariJSProgTopics/RespondingtoForceTouchEventsfromJavaScript.html
  mouseForceChanged = (event: MouseForceChangedEvent) => {
    if (event.webkitForce == null || MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN == null) {
      console.error('handling a mouse force changed event when it is not supported');
      return;
    }

    const forcePressThreshold: number = (MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN : any);

    // not a force press
    if (event.webkitForce < forcePressThreshold) {
      return;
    }

    // is a force press
    // if we are dragging - kill the drag

    if (this.state.pending) {
      this.stopPendingDrag();
      return;
    }

    // This case should not happen as it looks like force press is not
    // possible while moving the mouse. However, this is being super defensive.
    if (this.state.draggingWith) {
      this.stopDragging(() => this.props.callbacks.onCancel());
    }
  }

  unbindWindowEvents = () => {
    const win: HTMLElement = getWindowFromRef(this.props.draggableRef);

    win.removeEventListener('mousemove', this.onWindowMouseMove);
    win.removeEventListener('mouseup', this.onWindowMouseUp);
    win.removeEventListener('mousedown', this.onWindowMouseDown);
    win.removeEventListener('keydown', this.onWindowKeyDown);
    win.removeEventListener('touchmove', this.onWindowTouchMove);
    win.removeEventListener('touchend', this.onWindowTouchEnd);
    win.removeEventListener('touchcancel', this.onWindowTouchCancel);
    win.removeEventListener('resize', this.onWindowResize);
    win.removeEventListener('scroll', this.onWindowScroll);
    win.removeEventListener('contextmenu', this.onWindowContextMenu);
    win.removeEventListener('webkitmouseforcechanged', this.mouseForceChanged);
  }

  bindWindowEvents = (type: DragTypes) => {
    const win: HTMLElement = getWindowFromRef(this.props.draggableRef);

    if (type === 'MOUSE' || type === 'KEYBOARD') {
      win.addEventListener('mousemove', this.onWindowMouseMove);
      win.addEventListener('mouseup', this.onWindowMouseUp);
      win.addEventListener('mousedown', this.onWindowMouseDown);
      win.addEventListener('keydown', this.onWindowKeyDown);
    }

    if (type === 'TOUCH') {
      // opting out of passive (default) so as to prevent scrolling while moving
      win.addEventListener('touchmove', this.onWindowTouchMove, { passive: false });
      win.addEventListener('touchend', this.onWindowTouchEnd);
      win.addEventListener('touchcancel', this.onWindowTouchCancel);
      win.addEventListener('contextmenu', this.onWindowContextMenu);
    }

    win.addEventListener('resize', this.onWindowResize);
    win.addEventListener('scroll', this.onWindowScroll, { passive: true });
    win.addEventListener('webkitmouseforcechanged', this.mouseForceChanged);
  }

  getProvided = memoizeOne((isEnabled: boolean, isDragging: boolean): ?Provided => {
    if (!isEnabled) {
      return null;
    }

    const provided: Provided = {
      onMouseDown: this.onMouseDown,
      onKeyDown: this.onKeyDown,
      onTouchStart: this.onTouchStart,
      onClick: this.onClick,
      tabIndex: 0,
      'aria-grabbed': isDragging,
      draggable: false,
      onDragStart: getFalse,
      onDrop: getFalse,
    };

    return provided;
  })

  render() {
    const { children, isEnabled } = this.props;
    const { draggingWith } = this.state;
    const isDragging: boolean = Boolean(draggingWith);

    return children(this.getProvided(isEnabled, isDragging));
  }
}
