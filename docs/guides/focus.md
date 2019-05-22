# Focus

> "You got to focus on what's real, man" - [Jake from Adventure time](https://www.youtube.com/watch?v=TFGz6Qvg1CE)

`react-beautiful-dnd` includes logic to maintain browser focus for _drag handles_. This especially important for [keyboard dragging](/docs/sensors/keyboard.md) which requires the dragging item to be focused.

## Terminology reminder 📖

A `<Draggable />` has a _drag handle_. A _drag handle_ is the part of the `<Draggable />` that controls the dragging of the whole `<Draggable />`. A _drag handle_ can be the same element as the `<Draggable />`

## Drag handle not focused at drag start

If the _drag handle_ is not focused when a drag starts then **focus is not given** to the dragging item. This is a mirror of the native HTML5 drag and drop behaviour which does not give focus to an item just because it is dragging. You are welcome to call `HTMLElement.focus()` when a drag starts to give it focus, but that is up to you.

## Drag handle is focused at drag start

If a _drag handle_ has browser focus when a drag starts then `rbd` will try to give focus to the _drag handle_ during a drag and just after a drag ends.

Here is what is done:

- Give focus to a _drag handle_ with a matching `DraggableId` after the drag starts. This might be a different element to the original _drag handle_ if you are using a [portal](TODO) or a [clone](TODO).
- Give focus to a _drag handle_ with a matching `DraggableId` after the drag ends. Sometimes the original _drag handle_ element is lost during a drag, such as when using a [portal](TODO) or a [clone](TODO), or when moving a `Draggable` from one list to another as `React` will recreate the element.
- If [combining](TODO) then focus is given to the combine target after a drag ends. This allows keyboard users to continue to engage with the application without needing to get the focus back to where they where the last interaction was
