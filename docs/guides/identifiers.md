# Identifiers (ids)

> `Draggable > draggableId` and `Droppable > droppableId`

A `Draggable` and a `Droppable` have an id. These are `draggableId` and `droppableId` respectively.

## String

We expect an id to be a `string`

```js
type Id = string;
type DroppableId = Id;
type DraggableId = Id;
```

> More information: [types guide](/docs/guides/types.md)

## Ids must be unique

A id must uniquely identify a `Draggable` or `Droppable` within a `DragDropContext`. So if you have multiple connected lists, each `Droppable` needs to have a unique id and each `Draggable` needs to have a unique id, even if the item is in a different list.

The id must also be unique event if the `type` argument on the `Droppable` is different.

## Avoid reusing ids

For simplicity, it is best to avoid changing a `draggableId` or `droppableId` when a reorder occurs. The safest option is to associate an id with an piece of data and do not update the id between reorders.

You can change the `draggableId` or `droppableId` at any time except during a drag. Including after reorder. However, to avoid an exception you need to avoid reusing id's between two components. This can happen if you base a draggableId or droppableId on an index.

> **Don't base an id on a index**

### What this looks like internally

#### 1. Update droppable

old droppableId: "droppable-0"
new droppableId: "droppable-1"

👉 delete reference to "droppable-0"
👉 add reference to "droppable-1"

#### 2. Update droppable

old droppableId: "droppable-1" 😢
new droppableId: "droppable-2"

👉 delete reference to "droppable-1" 😢 (will remove reference to our new "droppable-1")
👉 add a reference to "droppable-2"

#### 3. Update droppable

old droppableId: "droppable-1" 💥
new droppableId: "droppable-5"

👉 delete reference to "droppable-1" 💥 (will cause an exception because "droppable-1" is not found)

## Could we change these rules?

Yep!

But we do things this way for simplicity and performance. Feel free to continue this conversation in a Github issue if you feel strongly about it.
