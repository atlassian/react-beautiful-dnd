# Programmatic dragging 🎮

> WIP!!

It is possible to drive an entire drag and drop experience programmatically. You can use this to:

- Create drag and drop interactions from any input type you can think of
- Create beautiful scripted experiences

The programmatic API is the same API that our [mouse], [keyboard], and [touch] sensor use.

## How does it work?

You create a `sensor` that has the ability to attempt to claim a **lock**. A **lock** allows exclusive control of dragging a single item within a `<DragDropContext>`. The **lock** has two phases: _pre drag_ and _dragging_.

So here is how a `sensor` works:

1. Try to get a lock when it wants to drag and item. A sensor might not be able to claim a lock for a variety of reasons.
2. If a lock is returned then there are a number of _pre drag_ actions available to you (`PreDragActions`). This allows you to claim a lock before starting a drag. This is important for things like [sloppy click detection](TODO) where a drag is only started after a sufficiently large movement.
3. A _pre drag_ lock can be upgraded to a _drag lock_, which contains a different set of API's (`DragActions`). This then allows you to move items around.

A **lock** can be aborted at any time by the application, such as when an error occurs. If you try to perform actions on an aborted **lock** then it will not do anything.

```js
function useMySensor(tryGetActionLock: TryGetActionLock) => void) {
  const preDrag: ?PreDragActions = tryGetActionLock();
  // Could not get lock
  if(!preDrag) {
    return;
  }

  preDrag.lift({ mode: 'SNAP' });

  preDrag.moveDown();
  preDrag.moveDown();
  preDrag.moveDown();

  preDrag.drop();
}

function App() {
  return (
    <DragDropContext sensors={[useMySensor]}>{/*...*/}</DragDropContext>
  )
}
```

## <DragDropContext /> | `sensors`

This allows you to pass in an `array` of additional sensors you would like to use for the `DragDropContext`.

```js
import useMyCoolSensor from './awesome';

<DragDropContext sensors={[useMyCoolSensor]}>{/*...*/}</DragDropContext>;
```

## <DragDropContext /> | `enableDefaultSensors`

By default all of the default sensors ([mouse], [keyboard], and [touch]) will be applied. They can work in conjuction with your own custom sensors. However, you are welcome to disable the default sensors

```js
// disable default sensors
<DragDropContext enableDefaultSensors={false}>{/*...*/}</DragDropContext>
```

## Pre drag actions

When you request a lock with `tryGetActionLock(...)` you _can_ be supplied with `PreDragAction`s.

```js
type PreDragActions = {|
  // is lock still active?
  isActive: () => boolean,
  // whether it has been indicated if force press should be respected
  shouldRespectForcePress: () => boolean,
  // upgrade lock
  lift: (args: SensorLift) => DragActions,
  // release the lock
  abort: () => void,
|};
```

## Drag actions

> WIP

```js
type DragActions = {|
  isActive: () => boolean,
  shouldRespectForcePress: () => boolean,
  move: (point: Position) => void,
  moveUp: () => void,
  moveDown: () => void,
  moveRight: () => void,
  moveLeft: () => void,
  drop: (args?: StopDragOptions) => void,
  cancel: (args?: StopDragOptions) => void,
|};
```
