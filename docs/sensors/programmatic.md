# Programmatic dragging 🎮

> WIP: this is a hot mess

It is possible to drive an entire drag and drop experience programmatically 😱

You can use the programmatic API to:

- Create drag and drop interactions from **any input** type you can think of
- Create beautiful scripted **experiences**

The programmatic API is the same API that our [mouse](/docs/sensors/mouse.md), [keyboard](/docs/sensors/keyboard.md), and [touch](/docs/sensors/touch.md) sensors use. So it is powerful enough to drive any experience we ship out of the box.

## Overview

You create a `sensor` that has the ability to attempt to claim a **lock**. A **lock** allows _exclusive_ control of dragging a single `<Draggable />` within a `<DragDropContext>`. When you are finished with your interaction, you can then release the **lock**.

```js
function mySimpleSensor(tryGetLock: TryGetLock) {
  const preDrag: ?PreDragActions = tryGetLock();
  // Could not get lock
  if (!preDrag) {
    return;
  }

  const element = document.querySelector('#item-1');
  const drag: SnapDragActions = preDrag.snapLift(element);

  drag.moveDown();
  drag.moveDown();
  drag.moveDown();

  drag.drop();
}

function App() {
  return (
    <DragDropContext sensors={[mySimpleSensor]}>{/*...*/}</DragDropContext>
  );
}
```

## Lifecycle

![programmatic state flow](https://user-images.githubusercontent.com/2182637/58779115-35b67d80-8618-11e9-8934-6dfa2b14ce23.jpg)

1. Try to get a **lock** when a `sensor` wants to drag and item. A sensor might not be able to claim a lock for a variety of reasons, such as when another `sensor` already has a **lock**.
2. If a **lock** is obtained then there are a number of _pre drag_ actions available to you (`PreDragActions`). This allows a `sensor` to claim a lock before starting a drag. This is important for things like [sloppy click detection](TODO) where a drag is only started after a sufficiently large movement.
3. A _pre drag_ lock can be upgraded to a _drag lock_, which contains a different set of APIs (`FluidDragActions` or `SnapDragActions`). Once a `<Draggable />` has been lifted, it can be moved around.

## Rules

- Only one `<Draggable />` can be dragging at a time for a `<DragDropContext />`
- You cannot use outdated or aborted **locks** (see below)
- That's it!

## API

### Creating a `sensor`

A `sensor` is a [React hook](https://reactjs.org/docs/hooks-intro.html). It is fine if you do not want to use any of the React hook goodness, you can treat the `sensor` just as a function. React hooks are just functions that let you use the built in React hooks if you want to 🤫. You pass your `sensor` into the `sensors` array on a `<DragDropContext />`.

```js
function useMyCoolSensor(tryGetLock) {
  const start = useCallback(function start() {
    const preDrag = tryGetLock(document.querySelector('#item-1');
  }, []);

  useEffect(() => {
    window.addEventListener('click', start);

    return () => {
      window.removeEventListener('click', start);
    }
  }, [])
}

function App() {
  return (
    <DragDropContext sensors={[useMyCoolSensor]}>{/*...*/}</DragDropContext>
  );
}
```

You can also disable all of the prebuilt sensors ([mouse](/docs/sensors/mouse.md), [keyboard](/docs/sensors/keyboard.md), and [touch](/docs/sensors/touch.md)) by setting `enableDefaultSensors={false}` on a `<DragDropContext />`. This is useful if you _only_ want a `<DragDropContext />` to be controlled programmatically.

### Controlling a drag: try to get a lock

A `sensor` is provided with a function `tryGetLock()` which is used to try to get a **lock**.

```js
export type TryGetLock = (
  source: Event | Element,
  forceStop?: () => void,
) => ?PreDragActions;
```

- `source`: can either be an `Event` or a `Element`. For an `Element` we search for the closest _drag handle_ (via `.closest()`). For an `Event` we read the `event.target` and do the same search from there. If no _drag handle_ is found then a lock will not be given.
- `forceStop`: a function that is called when the lock needs to be abandoned by the application. See **force abandoning locks**.

### Controlling a drag: pre drag

TODO

### Controlling a drag: dragging

TODO

## Force abandoning locks

A **lock** can be aborted at any time by the application, such as when an error occurs. If you try to perform actions on an aborted **lock** then it will not do anything. The `tryGetLock()` function accepts two arguments: `tryGetLock(source: Element | Event, forceStop: () => void)`. The `forceStop` function will be called when the lock needs to be abandoned by the application. If you try to use any functions on the lock after it has been abandoned they will have no effect and will log a warning to the console.

```js
function useMySensor(tryGetLock: TryGetLock) {
  let unbindClick;

  function forceStop() {
    if (unbindClick) {
      unbindClick();
    }
  }

  const element = document.querySelector('#item-1');
  const preDrag: ?PreDragActions = tryGetLock(element, forceStop);
  // Could not get lock
  if (!preDrag) {
    return;
  }

  const drag: SnapDragActions = preDrag.snapLift();
  const move = () => drag.moveDown();
  window.addEventListener('click', move);
  unbindClick = window.removeEventListener('click', move);
}
```

The `PreDragActions`, `FluidDragActions` and `SnapDragActions` all have a `isActive()` function which can be called to discover if a lock is still active. So if you do not want to provide a `forceStop()` function, it is best to defensively call api's with a `isActiveCheck`.

```js
function useMySensor(tryGetLock: TryGetLock) {
  const preDrag: ?PreDragActions = tryGetLock();
  // Could not get lock
  if (!preDrag) {
    return;
  }

  const drag: SnapDragActions = preDrag.snapLift();
  const move = () => {
    if (drag.isActive()) {
      drag.moveDown();
      return;
    }
    // unbinding if no longer active
    window.removeEventListener('click', move);
  };
  window.addEventListener('click', move);
}
```

## Expired locks

TODO: calling pre drag actions when dragging, or calling drag actions when a lock has been released

## Drag modes: fluid and snap

There are two modes of drag interactions: **fluid** and **snap**.

### Fluid mode

When fluid dragging the dragging item is moved around based on client `x,y` positions. The impact of the drag is controlled by the center position of the dragging item.

```js
function useMySensor(tryGetLock: TryGetLock) => void) {
  const preDrag: ?PreDragActions = tryGetLock();
  // Could not get lock
  if(!preDrag) {
    return;
  }

  const drag: SnapDragActions = preDrag.fluidLift({x: 100, y: 200});

  drag.move({x: 120, y: 130});
}

function App() {
  return (
    <DragDropContext sensors={[useMySensor]}>{/*...*/}</DragDropContext>
  )
}
```

Calls to `.move()` are throttled using [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame). So if you make multipole `.move()` calls in the same animation frame, it will only result in a single update

```js
const drag: SnapDragActions = preDrag.fluidLift({ x: 0, y: 0 });

// will all be batched into a single update
drag.move({ x: 0, y: 1 });
drag.move({ x: 0, y: 2 });
drag.move({ x: 0, y: 3 });

// after animation frame
// update(x: 0, y: 3)
```

### Snap dragging

When snap dragging we jump the dragging item around to new positions in a single command. Eg "move up", "move down".

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

When you request a lock with `tryGetLock(...)` you _can_ be supplied with `PreDragAction`s.

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

```js
type DragActions = {|
  drop: (args?: StopDragOptions) => void,
  cancel: (args?: StopDragOptions) => void,
  isActive: () => boolean,
  shouldRespectForcePress: () => boolean,
|};

// returned when using preDrag.fluidLift();

export type FluidDragActions = {|
  ...DragActions,
  move: (point: Position) => void,
|};

// returned when using preDrag.snapLift();

export type SnapDragActions = {|
  ...DragActions,
  moveUp: () => void,
  moveDown: () => void,
  moveRight: () => void,
  moveLeft: () => void,
|};
```
