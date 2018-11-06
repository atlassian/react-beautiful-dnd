# Types

`react-beautiful-dnd` is typed using [`flowtype`](https://flow.org). This greatly improves internal consistency within the codebase. We also expose a number of public types which will allow you to type your javascript if you would like to. If you are not using `flowtype` this will not inhibit you from using the library. It is just extra safety for those who want it.

## Public flow types

### Ids

```js
type Id = string;
type TypeId = Id;
type DroppableId = Id;
type DraggableId = Id;
```

### Hooks

```js
type Hooks = {|
  // optional
  onDragBeforeStart?: OnDragBeforeStartHook,
  onDragStart?: OnDragStartHook,
  onDragUpdate?: OnDragUpdateHook,
  // required
  onDragEnd: OnDragEndHook,
|};

type OnBeforeDragStartHook = (start: DragStart) => mixed;
type OnDragStartHook = (start: DragStart, provided: HookProvided) => mixed;
type OnDragUpdateHook = (update: DragUpdate, provided: HookProvided) => mixed;
type OnDragEndHook = (result: DropResult, provided: HookProvided) => mixed;

type DragStart = {|
  draggableId: DraggableId,
  type: TypeId,
  source: DraggableLocation,
  mode: MovementMode,
|};

type DragUpdate = {|
  ...DragStart,
  // may not have any destination (drag to nowhere)
  destination: ?DraggableLocation,
|};

type DropResult = {|
  ...DragUpdate,
  reason: DropReason,
|};

type DropReason = 'DROP' | 'CANCEL';

type DraggableLocation = {|
  droppableId: DroppableId,
  // the position of the droppable within a droppable
  index: number,
|};

// There are two modes that a drag can be in
// FLUID: everything is done in response to highly granular input (eg mouse)
// SNAP: items snap between positions (eg keyboard);
export type MovementMode = 'FLUID' | 'SNAP';
```

### Droppable

```js
type DroppableProvided = {|
  innerRef: (?HTMLElement) => void,
  placeholder: ?ReactElement,
|};

type DroppableStateSnapshot = {|
  isDraggingOver: boolean,
  draggingOverWith: ?DraggableId,
|};
```

### Draggable

```js
type DraggableProvided = {|
  innerRef: (?HTMLElement) => void,
  draggableProps: DraggableProps,
  dragHandleProps: ?DragHandleProps,
|};

type DraggableStateSnapshot = {|
  isDragging: boolean,
  isDropAnimating: boolean,
  draggingOver: ?DroppableId,
|};

export type DraggableProps = {|
  style: ?DraggableStyle,
  'data-react-beautiful-dnd-draggable': string,
|};
type DraggableStyle = DraggingStyle | NotDraggingStyle;
type DraggingStyle = {|
  position: 'fixed',
  top: number,
  left: number,
  boxSizing: 'border-box',
  width: number,
  height: number,
  transition: string,
  transform: ?string,
  zIndex: number,
  opacity: ?number,
  pointerEvents: 'none',
|};
type NotDraggingStyle = {|
  transition: ?string,
  transition: null | 'none',
|};

type DragHandleProps = {|
  onFocus: () => void,
  onBlur: () => void,
  onMouseDown: (event: MouseEvent) => void,
  onKeyDown: (event: KeyboardEvent) => void,
  onTouchStart: (event: TouchEvent) => void,
  'data-react-beautiful-dnd-drag-handle': string,
  'aria-roledescription': string,
  tabIndex: number,
  draggable: boolean,
  onDragStart: (event: DragEvent) => void,
|};
```

## Using the flow types

The types are exported as part of the module so using them is as simple as:

```js
import type { DroppableProvided } from 'react-beautiful-dnd';
```

## Typescript

If you are using [TypeScript](https://www.typescriptlang.org/) you can use the community maintained [DefinitelyTyped type definitions](https://www.npmjs.com/package/@types/react-beautiful-dnd). [Installation instructions](http://definitelytyped.org/).

Here is an [example written in typescript](https://github.com/abeaudoin2013/react-beautiful-dnd-multi-list-typescript-example).

## Sample application with flow types

We have created a [sample application](https://github.com/alexreardon/react-beautiful-dnd-flow-example) which exercises the flowtypes. It is a super simple `React` project based on [`react-create-app`](https://github.com/facebookincubator/create-react-app). You can use this as a reference to see how to set things up correctly.
