# Responders

> `<DragDropContext /> > Responders`

Responders are top level application events that you can use to perform your own state updates, style updates, as well as to make screen reader announcements.

> For more information about controlling the screen reader see our [screen reader guide](/docs/guides/screen-reader.md)

## Life cycle ♻️

1. `onBeforeCapture`: a drag is about to start and dimensions have **not been collected** from the DOM
2. `onBeforeDragStart`: a drag is about to start and dimensions **have been captured** from the DOM
3. `onDragStart`: A drag has started
4. `onDragUpdate`: Something has changed during a drag
5. `onDragEnd` **(required)**: A drag has ended. It is the responsibility of this responder to synchronously apply changes that has resulted from the drag

We try hard to ensure that an entire lifecycle is completed before a new one starts. If you find that not to be the case - it is a bug: please raise it!

## Timing

### Phase 1: capture

- User initiates a drag
- `onBeforeCapture` is called. You can add or remove `<Draggable />` and `<Droppable />` components or modify dimensions at this point.
- dimensions for `<Draggable />` and `<Droppable />` components are captured from the DOM

### Phase 2: start

- `onBeforeDragStart` is called
- `<Draggable />` and `<Droppable />` components are updated with initial `snapshot` values
- `onDragStart` is called in the next event loop (via `setTimeout`)

### Phase 3: updates

- User moves a dragging item
- `<Draggable />` and `<Droppable />` components are updated with latest `snapshot` values
- `onDragUpdate` is called in the next event loop (via `setTimeout`)

### Phase 4: drop

- User drops a dragging item
- There is an optional drop animation
- When the drop animation finishes (or if there is ):
  -- Any pending `onDragStart` and `onDragUpdate` calls are flushed
  -- `<Draggable />` and `<Droppable />` components are updated with resting `snapshot` values.
  -- You perform your reorder operation in `onDragEnd` which can result in a `setState` to update the order. The `<Draggable />` and `<Droppable />` snapshot updates and any `setState` caused by `onDragEnd` are batched together into the render cycle by `react ⚛️` 🤘

## API

### `onBeforeCapture`

This responder is called after we know a drag will start, but before any dimensions have been collected from the DOM. It is an opportunity to:

- add or remove `<Draggable />` and `<Droppable />` components
- modify element sizes

> ⚠️ Misuse of this responder can lead to some terrible user interactions. You should not change the visible position of the dragging item to change as a result of your changes here.

```js
// We cannot give more information than this because things might change
type BeforeCapture = {|
  draggableId: DraggableId,
  mode: MovementMode,
|};
// No second 'provided' argument
export type OnBeforeCaptureResponder = (before: BeforeCapture) => mixed;

// Otherwise the same type information as OnDragStartResponder
```

### `onBeforeDragStart`

> The use cases for this responder is fairly limited

Once we have all of the information we need to start a drag we call the `onBeforeDragStart` function. This is called just before we update the `snapshot` values for the `<Draggable />` and `<Droppable />` components. At this point the application is not in a dragging state and so changing of props such as `isDropDisabled` will fail. The `onBeforeDragStart` responder is a good opportunity to do any dimension locking required for [table reordering](/docs/patterns/tables.md).

- ✅ Can apply modifications to existing components to lock their sizes
- ❌ Cannot remove or add any `<Draggable />` or `<Droppable />`
- ❌ Cannot modify the sizes of any `<Draggable />` or `<Droppable />`

```js
// No second 'provided' argument
type OnBeforeDragStartResponder = (start: DragStart) => mixed;

// Otherwise the same type information as OnDragStartResponder
```

### `provided: ResponderProvided`

`onDragStart`, `onDragUpdate` and `onDragEnd` are given a `provided: ResponderProvided` object. This object has one property: `announce`. This function is used to synchronously announce a message to screen readers. If you do not use this function we will announce a default english message. We have created a [guide for screen reader usage](/docs/guides/screen-reader.md) which we recommend using if you are interested in controlling the screen reader messages for yourself and to support internationalisation. If you are using `announce` it must be called synchronously.

```js
type ResponderProvided = {|
  announce: Announce,
|};

type Announce = (message: string) => void;
```

### `onDragStart`

`onDragStart` will get notified when a drag starts. This responder is _optional_ and therefore does not need to be provided. It is **highly recommended** that you use this function to block updates to all `<Draggable />` and `<Droppable />` components during a drag. (See **Block updates during a drag** below)

```js
// While the return type is `mixed`, the return value is not used.
type OnDragStartResponder = (
  start: DragStart,
  provided: ResponderProvided,
) => mixed;

// supporting types
type DraggableRubric = {|
  draggableId: DraggableId,
  type: TypeId,
  source: DraggableLocation,
|};

type DragStart = {|
  ...DraggableRubric,
  mode: MovementMode,
|};

type DraggableLocation = {|
  droppableId: DroppableId,
  // the position of the draggable within a droppable
  index: number,
|};
type Id = string;
type DraggableId = Id;
type DroppableId = Id;
type TypeId = Id;

type MovementMode = 'FLUID' | 'SNAP';
```

- `start.draggableId`: the id of the `<Draggable />` that is now dragging
- `start.type`: the `type` of the `<Draggable />` that is now dragging
- `start.source`: the location (`droppableId` and `index`) of where the dragging item has started within a `<Droppable />`.
- `start.mode`: either `'SNAP'` or `'FLUID'`. This is a little bit of information about the type of movement that will be performed during this drag. `'SNAP'` mode is where items jump around between positions (such as with keyboard dragging) and `'FLUID'` mode is where the item moves underneath a pointer (such as mouse dragging).

### `onDragUpdate`

`onDragUpdate` is called whenever something changes during a drag. The possible changes are:

- The position of the `<Draggable />` has changed
- The `<Draggable />` is now over a different `<Droppable />`
- The `<Draggable />` is now over no `<Droppable />`

It is important that you not do too much work as a result of this function as it will slow down the drag.

```js
// The return value of `mixed` is not used
type OnDragUpdateResponder = (
  update: DragUpdate,
  provided: ResponderProvided,
) => mixed;

type DragUpdate = {|
  // See above
  ...DragStart,
  // may not have any destination (drag to nowhere)
  destination: ?DraggableLocation,
  // populated when a draggable is dragging over another in combine mode
  combine: ?Combine,
|};

type Combine = {|
  draggableId: DraggableId,
  droppableId: DroppableId,
|};
```

- `...DragStart`: _see above_
- `update.destination`: the location (`droppableId` and `index`) of where the dragging item is now. This can be null if the user is currently not dragging over any `<Droppable />`.
- `update.combine`: details of a `<Draggable />` that is currently being combine with. For more information see our [combining guide](/docs/guides/combining.md)

### `onDragEnd` (required)

> `react-beautiful-dnd` will throw an error if a `onDragEnd` prop is not provided

This function is _extremely_ important and has an critical role to play in the application lifecycle. **This function must result in the _synchronous_ reordering of a list of `Draggables`**

```js
type OnDragEndResponder = (
  result: DropResult,
  provided: ResponderProvided,
) => mixed;

type DropResult = {|
  ...DragUpdate,
  reason: DropReason,
|};

type DropReason = 'DROP' | 'CANCEL';
```

- `...DragUpdate`: _see above_
- `result.reason`: the reason a drop occurred. This information can be helpful in crafting more useful messaging in the `ResponderProvided` > `announce` function.

In the event of a cancelled drag, any `destination` or `combine` is set to `null`.

## Persisting a reorder

If you need to persist a reorder to a remote data store - update the list synchronously (optimistically) on the client (such as through `setState()`) and fire off a request in the background to persist the change. If the remote save fails it is up to you how to communicate that to the user and update, or not update, the list.

## No dimension changes during a drag

`react-beautiful-dnd` does not support the changing of the size of any `<Draggable />` or `<Droppable />` after a drag has started. We build a virtual model of every `<Draggable />` and `<Droppable />` when a drag starts. We do not recollect these during a drag. So if you change the size of something: the user will see the updated size, but our virtual model will remain unchanged. If you want to modify dimensions before a drag starts you can use `onBeforeCapture`

## Block updates during a drag

It is **highly** recommended that while a user is dragging that you block any state updates that might impact the amount of `<Draggable />`s and `<Droppable />`s, or their dimensions. Please listen to `onDragStart` and block updates to the `<Draggable />`s and `<Droppable />`s until you receive at `onDragEnd`.

### How do you block updates?

Update blocking will look different depending on how you manage your data. It is probably best to explain by example:

Let's say you are using `React` component state to manage the state of your application. Your application state is tied to a REST endpoint that you poll every thirty seconds for data updates. During a drag you _should not_ apply any server updates that could effect what is visible.

This could mean:

- stop your server poll during a drag
- ignore any results from server calls during a drag (do not call `setState` in your component with the new data)

### No update blocking will probably lead to bad times

Here are a few poor user experiences that can occur if you change things _during a drag_:

- If you increase the amount of nodes, then the library will not know about them and they will not be moved when the user would expect them to be.
- If you decrease the amount of nodes, then there might be gaps and unexpected movements in your lists.
- If you change the dimensions of any node, then it can cause the changed node as well as others to move at incorrect times.
- If you remove the node that the user is dragging, then the drag will instantly end
- If you change the dimension of the dragging node, then other things will not move out of the way at the correct time.

[← Back to documentation](/README.md#documentation-)
