// @flow
import { Component } from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
import getWindowFromRef from '../get-window-from-ref';
import getDragHandleRef from './util/get-drag-handle-ref';
import type { Props, DragHandleProps } from './drag-handle-types';
import type {
  MouseSensor,
  KeyboardSensor,
  TouchSensor,
  PointerSensor,
  CreateSensorArgs,
} from './sensor/sensor-types';
import type { DraggableId } from '../../types';
import { styleContextKey, canLiftContextKey } from '../context-keys';
import focusRetainer from './util/focus-retainer';
import shouldAllowDraggingFromTarget from './util/should-allow-dragging-from-target';
import createMouseSensor from './sensor/create-mouse-sensor';
import createKeyboardSensor from './sensor/create-keyboard-sensor';
import createTouchSensor from './sensor/create-touch-sensor';
import createPointerSensor from './sensor/create-pointer-sensor';
import { warning } from '../../dev-warning';

const preventHtml5Dnd = (event: DragEvent) => {
  event.preventDefault();
};

type Sensor = MouseSensor | KeyboardSensor | TouchSensor | PointerSensor;

let IS_TOUCH_COMPATIBLE: boolean = false;
let TOUCH_CHECK_WAS_ATTEMPTED: boolean = false;

export default class DragHandle extends Component<Props> {
  /* eslint-disable react/sort-comp */
  mouseSensor: MouseSensor;
  keyboardSensor: KeyboardSensor;
  touchSensor: TouchSensor;
  pointerSensor: PointerSensor;
  sensors: Sensor[];
  styleContext: string;
  canLift: (id: DraggableId) => boolean;
  isFocused: boolean = false;
  lastDraggableRef: ?HTMLElement;

  // Need to declare contextTypes without flow
  // https://github.com/brigand/babel-plugin-flow-react-proptypes/issues/22
  static contextTypes = {
    [styleContextKey]: PropTypes.string.isRequired,
    [canLiftContextKey]: PropTypes.func.isRequired,
  };

  constructor(props: Props, context: Object) {
    super(props, context);

    const getWindow = (): HTMLElement =>
      getWindowFromRef(this.props.getDraggableRef());

    const args: CreateSensorArgs = {
      callbacks: this.props.callbacks,
      getDraggableRef: this.props.getDraggableRef,
      getWindow,
      canStartCapturing: this.canStartCapturing,
    };

    this.mouseSensor = createMouseSensor(args);
    this.keyboardSensor = createKeyboardSensor(args);
    this.touchSensor = createTouchSensor(args);
    this.pointerSensor = createPointerSensor(args);
    this.sensors = [this.mouseSensor, this.keyboardSensor, this.touchSensor, this.pointerSensor];
    this.styleContext = context[styleContextKey];

    // The canLift function is read directly off the context
    // and will communicate with the store. This is done to avoid
    // needing to query a property from the store and re-render this component
    // with that value. By putting it as a function on the context we are able
    // to avoid re-rendering to pass this information while still allowing
    // drag-handles to obtain this state if they need it.
    this.canLift = context[canLiftContextKey];
  }

  componentDidMount() {
    const draggableRef: ?HTMLElement = this.props.getDraggableRef();

    // storing a reference for later
    this.lastDraggableRef = draggableRef;

    invariant(draggableRef, 'Cannot get draggable ref from drag handle');

    // drag handle ref will not be available when not enabled
    if (!this.props.isEnabled) {
      return;
    }

    const dragHandleRef: HTMLElement = getDragHandleRef(draggableRef);

    focusRetainer.tryRestoreFocus(this.props.draggableId, dragHandleRef);
  }

  componentDidUpdate(prevProps: Props) {
    const ref: ?HTMLElement = this.props.getDraggableRef();

    // 1. focus on element if required
    if (ref !== this.lastDraggableRef) {
      this.lastDraggableRef = ref;

      // After a ref change we might need to manually force focus onto the ref.
      // When moving something into or out of a portal the element loses focus
      // https://github.com/facebook/react/issues/12454

      if (ref && this.isFocused && this.props.isEnabled) {
        getDragHandleRef(ref).focus();
      }
    }

    // 2. should we kill the any capturing?

    const isCapturing: boolean = this.isAnySensorCapturing();

    // not capturing was happening - so we dont need to do anything
    if (!isCapturing) {
      return;
    }

    const isBeingDisabled: boolean =
      prevProps.isEnabled && !this.props.isEnabled;

    if (isBeingDisabled) {
      this.sensors.forEach((sensor: Sensor) => {
        if (!sensor.isCapturing()) {
          return;
        }
        const wasDragging: boolean = sensor.isDragging();
        sensor.kill();

        // It is fine for a draggable to be disabled while a drag is pending
        if (wasDragging) {
          warning(
            'You have disabled dragging on a Draggable while it was dragging. The drag has been cancelled',
          );
          this.props.callbacks.onCancel();
        }
      });
    }

    // Drag has stopped due to somewhere else in the system
    const isDragAborted: boolean =
      prevProps.isDragging && !this.props.isDragging;
    if (isDragAborted) {
      // We need to unbind the handlers
      this.sensors.forEach((sensor: Sensor) => {
        if (sensor.isCapturing()) {
          sensor.kill();
          // not firing any cancel event as the drag is already over
        }
      });
    }
  }

  componentWillUnmount() {
    this.sensors.forEach((sensor: Sensor) => {
      // kill the current drag and fire a cancel event if
      const wasDragging: boolean = sensor.isDragging();

      sensor.unmount();
      // cancel if drag was occurring
      if (wasDragging) {
        this.props.callbacks.onCancel();
      }
    });

    const shouldRetainFocus: boolean = (() => {
      if (!this.props.isEnabled) {
        return false;
      }

      // not already focused
      if (!this.isFocused) {
        return false;
      }

      // a drag is finishing
      return this.props.isDragging || this.props.isDropAnimating;
    })();

    if (shouldRetainFocus) {
      focusRetainer.retain(this.props.draggableId);
    }
  }

  onFocus = () => {
    this.isFocused = true;
  };

  onBlur = () => {
    this.isFocused = false;
  };

  onKeyDown = (event: KeyboardEvent) => {
    // let the other sensors deal with it
    if (this.mouseSensor.isCapturing() || this.touchSensor.isCapturing() || this.pointerSensor.isCapturing()) {
      return;
    }

    this.keyboardSensor.onKeyDown(event);
  };

  onMouseDown = (event: MouseEvent) => {
    // let the other sensors deal with it
    if (this.keyboardSensor.isCapturing() || this.touchSensor.isCapturing() || this.pointerSensor.isCapturing()) {
      return;
    }

    this.mouseSensor.onMouseDown(event);
  };

  onTouchStart = (event: TouchEvent) => {
    // let the other sensors deal with it
    if (this.keyboardSensor.isCapturing() || this.mouseSensor.isCapturing() || this.pointerSensor.isCapturing()) {
      return;
    }
    
    this.touchSensor.onTouchStart(event);
  };

  onPointerDown = (event: PointerEvent) => {
    if (!IS_TOUCH_COMPATIBLE && !TOUCH_CHECK_WAS_ATTEMPTED) {
      window.addEventListener('touchstart', function onFirstTouch() {
        IS_TOUCH_COMPATIBLE = true;
        window.removeEventListener('touchstart', onFirstTouch);
      });
      TOUCH_CHECK_WAS_ATTEMPTED = true;
    }

    // opt for the touch sensor if it's what the browser supports
    if (event.pointerType == 'touch' && IS_TOUCH_COMPATIBLE) {
      return;
    }

    // if the type is mouse, return so that the mouse sensor can get used
    if (event.pointerType == 'mouse') {
      return;
    }

    // let the other sensors deal with it
    if (this.keyboardSensor.isCapturing() || this.mouseSensor.isCapturing() || this.touchSensor.isCapturing()) {
      return;
    }

    this.pointerSensor.onPointerDown(event);
  };

  canStartCapturing = (event: Event) => {
    // this might be before a drag has started - isolated to this element
    if (this.isAnySensorCapturing()) {
      return false;
    }

    // this will check if anything else in the system is dragging
    if (!this.canLift(this.props.draggableId)) {
      return false;
    }

    // check if we are dragging an interactive element
    return shouldAllowDraggingFromTarget(event, this.props);
  };

  isAnySensorCapturing = (): boolean =>
    this.sensors.some((sensor: Sensor) => sensor.isCapturing());

  getProvided = memoizeOne(
    (isEnabled: boolean): ?DragHandleProps => {
      if (!isEnabled) {
        return null;
      }

      const provided: DragHandleProps = {
        onMouseDown: this.onMouseDown,
        onKeyDown: this.onKeyDown,
        onTouchStart: this.onTouchStart,
        onPointerDown: this.onPointerDown,
        onFocus: this.onFocus,
        onBlur: this.onBlur,
        tabIndex: 0,
        'data-react-beautiful-dnd-drag-handle': this.styleContext,
        // English default. Consumers are welcome to add their own start instruction
        'aria-roledescription': 'Draggable item. Press space bar to lift',
        draggable: false,
        onDragStart: preventHtml5Dnd,
      };

      return provided;
    },
  );

  render() {
    const { children, isEnabled } = this.props;

    return children(this.getProvided(isEnabled));
  }
}
