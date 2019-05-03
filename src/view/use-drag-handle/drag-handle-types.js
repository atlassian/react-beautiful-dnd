// @flow
import { type Position } from 'css-box-model';
import type { MovementMode, DraggableId } from '../../types';

export type Callbacks = {|
  onLift: ({
    clientSelection: Position,
    movementMode: MovementMode,
  }) => mixed,
  onMove: (point: Position) => mixed,
  onWindowScroll: () => mixed,
  onMoveUp: () => mixed,
  onMoveDown: () => mixed,
  onMoveRight: () => mixed,
  onMoveLeft: () => mixed,
  onDrop: () => mixed,
  onCancel: () => mixed,
|};

export type DragHandleProps = {|
  // If a consumer is using a portal then the item will lose focus
  // when moving to the portal. This breaks keyboard dragging.
  // To get around this we manually apply focus if needed when mounting
  onFocus: () => void,
  onBlur: () => void,

  // Used to initiate dragging
  onMouseDown: (event: MouseEvent) => void,
  onKeyDown: (event: KeyboardEvent) => void,
  onTouchStart: (event: TouchEvent) => void,

  // What DragDropContext the drag handle is in
  'data-rbd-drag-handle-context-id': string,

  // Aria role (nicer screen reader text)
  'aria-roledescription': string,

  // Allow tabbing to this element
  tabIndex: number,

  // Stop html5 drag and drop
  draggable: boolean,
  onDragStart: (event: DragEvent) => void,
|};

export type Args = {|
  draggableId: DraggableId,
  // callbacks provided by the draggable
  callbacks: Callbacks,
  isEnabled: boolean,
  // whether the application thinks a drag is occurring
  isDragging: boolean,
  // whether the application thinks a drop is occurring
  isDropAnimating: boolean,
  // get the ref of the draggable
  getDraggableRef: () => ?HTMLElement,
  // whether interactive elements should be permitted to start a drag
  canDragInteractiveElements: boolean,
  // whether force press interactions should be respected
  getShouldRespectForcePress: () => boolean,
|};
