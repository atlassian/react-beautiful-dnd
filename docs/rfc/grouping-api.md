# Grouping API

We will be adding the ability to add 'grouping' support to `react-beautiful-dnd`. I am attempting to create naming for the new api that feels right. The grouping feature will enable ability to hover over a Draggable to group with it. Right now I have been calling the feature 'grouping'. However, I am not sure if even that is the right name for the feature.

## API

### `Draggable` > isGroupingEnabled

This would allow a particular Draggable to be grouped with

### `Draggable` > `DraggableStateSnapshot`

```diff
export type StateSnapshot = {|
  isDragging: boolean,
  draggingOver: ?DroppableId,
-  isDropAnimating: boolean,
+  dropping: ?DroppingState,
+  groupingWith: ?DraggableId,
+  groupedOverBy: ?DraggableId,
|};

+export type DroppingState = {|
+  reason: DropReason,
+  duration: number,
+|};
```

We have moved from `isDropAnimating` to `DroppingState` to give some more information about a drop. This is useful in crafting customised drop styles

> I am not happy with the naming of these and I am looking for input!

`groupingWith`: the id of the Draggable that is currently being dragged over. Will be provided to the dragging Draggable
`groupedOverBy`: the id of the Draggable that is currently dragging over a groupable Draggable. Will be provided to the grouping target

### `DragDropContext` > `onDragUpdate` and `onDragEnd`

Information provided about the grouping target. I am not totally sold on the naming

```diff
export type DragUpdate = {|
  ...DragStart,
  // may not have any destination (drag to nowhere)
  destination: ?DraggableLocation,
+  // populated when a draggable is dragging over another in grouping mode
+  grouping: ?GroupingLocation,
|};

+ export type GroupingLocation = {|
+   droppableId: DroppableId,
+   draggableId: DraggableId,
+ |};
```
