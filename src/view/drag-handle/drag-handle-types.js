import type { Position } from '../../types';

export type DragTypes = 'KEYBOARD' | 'MOUSE';

export type Callbacks = {|
  onLift: (point: Position) => void,
  onKeyLift: () => void,
  onMove: (point: Position) => void,
  onWindowScroll: (diff: Position) => void,
  onMoveForward: () => void,
  onMoveBackward: () => void,
  onDrop: () => void,
  onCancel: () => void,
|}

export type Provided = {|
  onMouseDown: (event: MouseEvent) => void,
  onKeyDown: (event: KeyboardEvent) => void,

  // Conditionally block clicks
  onClick: (event: MouseEvent) => void,

  // Allow tabbing to this element
  tabIndex: number,

  // Aria
  'aria-grabbed': boolean,

  // Stop html5 drag and drop
  draggable: boolean,
  onDragStart: () => void,
  onDrop: () => void
|}

export type Props = {|
  isEnabled: boolean,
  // whether the application thinks a drag is occurring
  isDragging: boolean,

  // dragging is otherwise enabled - but cannot lift at this time
  canLift: boolean,
  callbacks: Callbacks,
  children: (?Provided) => void,
|}
