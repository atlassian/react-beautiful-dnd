# Philosophy 📖

This page goes over the design and interaction thinking behind `react-beautiful-dnd`.

## Going deeper

For a bit more context on the thinking outlined on this page you are welcome to check out the following:

- 📖 [Rethinking drag and drop](https://medium.com/@alexandereardon/rethinking-drag-and-drop-d9f5770b4e6b)
- 🎧 [React podcast: fast, accessible and beautiful drag and drop](https://reactpodcast.simplecast.fm/17)

## Foundational idea: physicality

The core design idea of `react-beautiful-dnd` is physicality: we want users to feel like they are moving physical objects around

### Application 1: no instant movement (no snapping)

It is a fairly standard drag and drop pattern for things to disappear and reappear in response to the users drag. For a more natural drag we animate the movement of items as they need to move out of the way while dragging to more clearly show a drags effect. We also animate the drop of an item so that it animates into its new home position. At no point is an item instantly moved anywhere — regardless of whether it is dragging or not.

### Application 2: knowing when to move

It is quite common for drag and drop interactions to be based on the position that user started the drag from.

In `react-beautiful-dnd` a dragging items impact is based on its centre of gravity — regardless of where a user grabs an item from. A dragging items impact follows similar rules to a set of scales ⚖️. Here are some rules that are followed to allow for a natural drag experience even with items of flexible height:

- A list is _dragged over_ when the centre position of a dragging item goes over one of the boundaries of the list
- A resting drag item will move out of the way of a dragging item when the centre position of the dragging item goes over the edge of the resting item. Put another way: once the centre position of an item (A) goes over the edge of another item (B), B moves out of the way.

### Application 3: movement to communicate positioning

> No support for drop shadows or line markings
> _Drop shadow: putting a clone or 'shadow' of the dragging item in the drop location_

`react-beautiful-dnd` relies on movement to communicate positioning. It is trying to create a system that is based on physical metaphores. Drop shadows, lines and other affordences are useful in drag and drop contexts where natural movement is not possible.

Drop shadows pose a number of confusing design moments if combined with a natural movement system, including:

- Where the shadow when you are not over a list?
- How should it move between items?
- How should it appear as you enter a new list?

The answer to these is often: snapping (where something just appears in the right spot). We are trying hard to avoid any snapping as it breaks the physicality we are trying to model.

### Application 4: maximise interactivity

`react-beautiful-dnd` works really hard to avoid as many periods of non-interactivity as possible. The user should feel like they are in control of the interface and not waiting for an animation to finish before they can continue to interact with the interface. However, there is a balance that needs to be made between correctness and power in order to make everybody's lives more sane. Here are the only situations where some things are not interactive:

1.  From when a user cancels a drag to when the drop animation completes. On cancel there are lots of things moving back to where they should be. If you grab an item in a location that is not its true home then the following drag will be incorrect.
2.  Starting a drag on an item that is animating its own drop. For simplicity this is the case - it is actually quite hard to grab something while it is animating home. It could be coded around - but it seems like an edge case that would add a lot of complexity.

Keep in mind that these periods of inactivity may not always exist.

### Application 5: no drag axis locking

For now, the library does not support drag axis locking (aka drag rails). This is where the user is restricted to only dragging along one axis. The current thinking is this breaks the physical metaphor we are going for and sends a message to the user that they are interacting with a piece of software rather than moving physical objects around. It is possible to ensure that a user can only drop in a single list by using props `type` and `isDropDisabled`. You can also do some visual treatment to the list `onDragStart` to show the user that this is the only place they can interact with.

### Application 6: natural cross list movement

Rather than using an index based approach for keyboard movement between lists, `react-beautiful-dnd` performs cross list movement based on **inertia, gravity and collisions**. You can find out more about how this works by reading the blog ["Natural keyboard movement between lists"](https://medium.com/@alexandereardon/friction-gravity-and-collisions-3adac3a94e19).

![example](https://raw.githubusercontent.com/alexreardon/files/master/resources/collision.gif?raw=true)
