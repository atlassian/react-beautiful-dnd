// @flow
import type { Node } from 'react';
import type { Position, Direction } from '../../types';

export type Callbacks = {|
  onLift: ({ client: Position, isScrollAllowed: boolean }) => void,
  onMove: (point: Position) => void,
  onWindowScroll: (diff: Position) => void,
  onMoveForward: () => void,
  onMoveBackward: () => void,
  onCrossAxisMoveForward: () => void,
  onCrossAxisMoveBackward: () => void,
  onDrop: () => void,
  onCancel: () => void,
|}

export type DragHandleProps = {|
  onMouseDown: (event: MouseEvent) => void,
  onKeyDown: (event: KeyboardEvent) => void,
  onTouchStart: (event: TouchEvent) => void,
  onTouchMove: (event: TouchEvent) => void,

  // Conditionally block clicks
  onClick: (event: MouseEvent) => void,

  // Control styling from style marshal
  'data-react-beautiful-dnd-drag-handle': string,

  // Allow tabbing to this element
  tabIndex: number,

  // Aria
  'aria-grabbed': boolean,

  // Stop html5 drag and drop
  draggable: boolean,
  onDragStart: () => boolean,
  onDrop: () => boolean
|}

export type Props = {|
  // callbacks provided by the draggable
  callbacks: Callbacks,
  isEnabled: boolean,
  // whether the application thinks a drag is occurring
  isDragging: boolean,
  // the direction of the current droppable
  direction: ?Direction,
  // get the ref of the draggable
  getDraggableRef: () => ?HTMLElement,
  // whether interactive elements should be permitted to start a drag
  canDragInteractiveElements: boolean,
  children: (?DragHandleProps) => Node,
|}
