# Hooks

> `DragDropContext > Hooks`

Hooks are top level application events that you can use to perform your own state updates, style updates, as well as to make screen reader announcements.

> For more information about controlling the screen reader see our [screen reader guide](docs/guides/screen-reader.md)

## What hooks are available?

### Primary

- `onDragStart`: A drag has started
- `onDragUpdate`: Something has changed during a drag
- `onDragEnd` **(required)**: A drag has ended. It is the responsibility of this hook to synchronously apply changes that has resulted from the drag

### Secondary

> Generally you will not need to use `onBeforeDragStart`, and it has a slightly different function signature to the rest of the hooks

- `onBeforeDragStart`\: Called just before `onDragStart` and can be useful to do dimension locking for [table reordering](docs/patterns/tables.md).

## The second argument to hooks: `provided: HookProvided`

```js
type HookProvided = {|
  announce: Announce,
|};

type Announce = (message: string) => void;
```

All hooks (except for `onBeforeDragStart`) are provided with a second argument: `HookProvided`. This object has one property: `announce`. This function is used to synchronously announce a message to screen readers. If you do not use this function we will announce a default english message. We have created a [guide for screen reader usage](docs/guides/screen-reader.md) which we recommend using if you are interested in controlling the screen reader messages for yourself and to support internationalisation. If you are using `announce` it must be called synchronously.

## `onDragStart` (optional)

```js
type OnDragStartHook = (start: DragStart, provided: HookProvided) => void;
```

`onDragStart` will get notified when a drag starts. This hook is _optional_ and therefore does not need to be provided. It is **highly recommended** that you use this function to block updates to all `Draggable` and `Droppable` components during a drag. (See **Block updates during a drag** below)

You are provided with the following details:

### `start: DragStart`

```js
type DragStart = {|
  draggableId: DraggableId,
  type: TypeId,
  source: DraggableLocation,
|};
```

- `start.draggableId`: the id of the `Draggable` that is now dragging
- `start.type`: the `type` of the `Draggable` that is now dragging
- `start.source`: the location (`droppableId` and `index`) of where the dragging item has started within a `Droppable`.

### `onDragStart` type information

```js
type OnDragStartHook = (start: DragStart, provided: HookProvided) => void;

// supporting types
type DragStart = {|
  draggableId: DraggableId,
  type: TypeId,
  source: DraggableLocation,
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
```

## `onDragUpdate` (optional)

```js
type OnDragUpdateHook = (update: DragUpdate, provided: HookProvided) => void;
```

This hook is called whenever something changes during a drag. The possible changes are:

- The position of the `Draggable` has changed
- The `Draggable` is now over a different `Droppable`
- The `Draggable` is now over no `Droppable`

It is important that you not do too much work as a result of this function as it will slow down the drag.

### `update: DragUpdate`

```js
type DragUpdate = {|
  ...DragStart,
  // may not have any destination (drag to nowhere)
  destination: ?DraggableLocation,
|};
```

- `update.draggableId`: the id of the `Draggable` that is now dragging
- `update.type`: the `type` of the `Draggable` that is now dragging
- `update.source`: the location (`droppableId` and `index`) of where the dragging item has started within a `Droppable`.
- `update.destination`: the location (`droppableId` and `index`) of where the dragging item is now. This can be null if the user is currently not dragging over any `Droppable`.

## `onDragEnd` (required)

This function is _extremely_ important and has an critical role to play in the application lifecycle. **This function must result in the _synchronous_ reordering of a list of `Draggables`**

It is provided with all the information about a drag:

### `result: DropResult`

```js
type DropResult = {|
  ...DragUpdate,
  reason: DropReason,
|};

type DropReason = 'DROP' | 'CANCEL';
```

- `result.draggableId`: the id of the `Draggable` that was dragging.
- `result.type`: the `type` of the `Draggable` that was dragging.
- `result.source`: the location where the `Draggable` started.
- `result.destination`: the location where the `Draggable` finished. The `destination` will be `null` if the user dropped while not over a `Droppable`.
- `result.reason`: the reason a drop occurred. This information can be helpful in crafting more useful messaging in the `HookProvided` > `announce` function.

## Secondary: `onBeforeDragStart`

> The use cases for this hook is super limited

Once we have all of the information we need to start a drag we call the `onBeforeDragStart` function. This is called just before we update the `snapshot` values for the `Draggable` and `Droppable` components. At this point the application is not in a dragging state and so changing of props such as `isDropDisabled` will fail. The `onBeforeDragStart` hook is a good opportunity to do any dimension locking required for [table reordering](docs/patterns/tables.md).

- ✅ Can apply modifications to existing components to lock their sizes
- ❌ Cannot remove or add any `Draggable` or `Droppable`
- ❌ Cannot modify the sizes of any `Draggable` or `Droppable`
- ❌ No screen reader announcement yet

### `OnBeforeDragStartHook` type information

```js
// No second 'provided' argument
type OnBeforeDragStartHook = (start: DragStart) => void;

// Otherwise the same type information as OnDragStartHook
```

## When are the hooks called?

### Phase 1: prepare (asynchronous steps)

- User initiates a drag
- We prepare and collect information required for the drag (async). If the drag ends before this phase is completed then no hooks will be fired.

### Phase 2: publish (synchronous steps)

- `onBeforeDragStart` is called
- `Draggable` and `Droppable` components are updated with initial `snapshot` values
- `onDragStart` is called

### Phase 3: updates

- User moves a dragging item
- `Draggable` and `Droppable` components are updated with latest `snapshot` values
- `onDragUpdate` is called

### Phase 4: drop

- User drops a dragging item
- Once drop animation is finished the `Draggable` and `Droppable` components are updated with resting `snapshot` values
- `onDragEnd` is called

## Synchronous reordering

Because this library does not control your state, it is up to you to _synchronously_ reorder your lists based on the `result: DropResult`.

### Here is what you need to do

- if the `destination` is `null`: all done!
- if `source.droppableId` equals `destination.droppableId` you need to remove the item from your list and insert it at the correct position.
- if `source.droppableId` does not equal `destination.droppableId`, then you need to remove the `Draggable` from the `source.droppableId` list and add it into the correct position of the `destination.droppableId` list.

### Persisting a reorder

If you need to persist a reorder to a remote data store - update the list synchronously on the client and fire off a request in the background to persist the change. If the remote save fails it is up to you how to communicate that to the user and update, or not update, the list.

## Block updates during a drag

It is **highly** recommended that while a user is dragging that you block any state updates that might impact the amount of `Draggable`s and `Droppable`s, or their dimensions. Please listen to `onDragStart` and block updates to the `Draggable`s and `Droppable`s until you receive at `onDragEnd`.

When the user starts dragging we take a snapshot of all of the dimensions of the applicable `Draggable` and `Droppable` nodes. If these change during a drag we will not know about it.

### How do you block updates?

Update blocking will look different depending on how you manage your data. It is probably best to explain by example:

Let's say you are using React component state to manage the state of your application. Your application state is tied to a REST endpoint that you poll every thirty seconds for data updates. During a drag you should not apply any server updates that could effect what is visible.

This could mean:

- stop your server poll during a drag
- ignore any results from server calls during a drag (do not call `this.setState` in your component with the new data)

### No update blocking can lead to bad times

Here are a few poor user experiences that can occur if you change things _during a drag_:

- If you increase the amount of nodes, then the library will not know about them and they will not be moved when the user would expect them to be.
- If you decrease the amount of nodes, then there might be gaps and unexpected movements in your lists.
- If you change the dimensions of any node, then it can cause the changed node as well as others to move at incorrect times.
- If you remove the node that the user is dragging, then the drag will instantly end
- If you change the dimension of the dragging node, then other things will not move out of the way at the correct time.

## `onDragStart` and `onDragEnd` pairing

We try very hard to ensure that each `onDragStart` event is paired with a single `onDragEnd` event. However, there maybe a rogue situation where this is not the case. If that occurs - it is a bug. Currently there is no mechanism to tell the library to cancel a current drag externally.
