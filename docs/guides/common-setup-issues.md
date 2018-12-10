# Common setup issues

This is a little guide to help you with some common setup issues

## Check your `console`

For detectable setup issues we try to log information in the `console` for `development` builds of `react-beautiful-dnd`. If things are not working, first thing to do is check your `console`.

## No duplicate ids

`draggableId` and `droppableId` values must be unique for the whole `DragDropContext` and not just a list.

More information: [identifiers guide](/docs/guides/identifiers.md)

## No margin collapsing between `Draggables`

This can happen if you have a `margin-top` as well as a `margin-bottom` on a `Draggable`.

[More information](https://github.com/atlassian/react-beautiful-dnd#unsupported-margin-setups)

## Avoid empty lists

We recommend you set a `min-height` or `min-width` on a `Droppable` to ensure that there is a visible drop target when a list is empty

We go over this in our [Get started with `react-beautiful-dnd` course](https://egghead.io/lessons/react-move-items-between-columns-with-react-beautiful-dnd-using-ondragend)
