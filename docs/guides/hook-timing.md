# Hook timing

The `DragDropContext > Hook` functions can be used to accomplish a variety of tasks. If you are unfamiliar with these functions we suggest that you [take a look at the docs](TODO) or our [getting started course](TODO).

The timing at which these hooks gets called can be important if you are building complex behaviors on top of `react-beautiful-dnd`. We are still exploring these timings and so we may change them in future releases.

## `onDragStart`

The `onDragStart` is called **after** all of the dimensions have been collected and the drag is _just about to begin_ (it will happen as the next function call). At this point the `Draggable` and `Droppable` components have not have their `provided` or `snapshot` values updated.

Any `this.setState(...)` call that happens inside of a `onDragStart` function will be applied to the `React` tree _before_ the `provided` and `snapshot` values are updated. You could use this to do 'dimension locking' for table reordering, or conditionally disable lists depending on what is dragging (using `Droppable` > `isDropDisabled`).

The purpose of this hook is not to change what draggables or droppables are present and what their sizes are. At this point that information has already been collected.
