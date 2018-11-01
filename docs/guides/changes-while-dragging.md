# Changes while dragging

`react-beautiful-dnd` supports the addition and removal of `Draggable`s during a drag. The circumstances that we support are fairly limited. We could look into supporting an increased set of behaviours in the future, but we opted to start small and stable.

> We attempt to print helpful debug information to the `console` if you do not follow these rules

## Rules

- You are allowed to add or remove `Draggables` during a drag
- These changes must occur within a `Droppable` that is a scroll container. _This is prevent accidental shifts to other `Droppables` on the page_
- You cannot modify the sizes of any existing `Draggable` or `Droppable` during a drag
- You cannot add or remove a `Droppable` during a drag. _We did this to avoid accidental shifting of other `Droppable`s_
- When an item is removed or added it must be done instantly. You cannot animate the size of the item. You are welcome to animate a property when adding a `Draggable` that does not impact the size of the item, such as opacity

## What behaviours does this unlock?

### Lazy loading of list items

[TODO gif]

### Collapsing and expanding groups

[TODO gif]
