# Virtual lists

`react-beautiful-dnd` supports drag and drop with virtual lists and connected virtual lists. This lets you have fantastic performance with very large data sets. As a general rule, you will want to start using a virtual list when your list size is more than 500 items.

## Background: what are virtual lists?

A "virtual list" is the name given to a _windowing_ performance optimisation technique where only the **visible** list items are rendered.

[TODO: GIF]

> See [Rendering large lists with react-window](https://addyosmani.com/blog/react-window/) By Addy Osmani

Keep in mind that there are drawbacks with using virtual lists. The biggest are poor accessiblity and findability. When using windowing non visible items are not rendered in the DOM. This means that inbuilt browser behaviours like

## Support

`react-beautiful-dnd` is designed to work with existing virtual list solutions and does not have it's own virtual list abstraction. There is no official "virtual list" specification or implementation for the web. Different virtual list libraries achieve windowing through various techniques. So we cannot guarentee that `react-beautiful-dnd` will work with every virtual list library. We have created examples for `react-window` and `react-virtualized` which are the two most popular virtual list libraries for `react`.

## Usage

`react-beautiful-dnd` does not provide it's own virtual list library so there is a bit of wiring that you will need to do in order to get going with virtual lists 🛠

### Enable overscanning

> Virtualisation libraries often have overscanning enabled by default

Most virtual list libraries support the concept of **overscanning**. Overscanning is where a small about of non-visible items are rendered near the boundary of the window. When a scroll occurs the overscanned item can be immediately moved into view and does not need to be created. Overscanning generally leads to a more fluid experience.

It is required that overscanning be enabled for `react-beautiful-dnd` to work correctly. If overscanning is not enabled, `rbd` cannot tell if there are more items in the list when an item is in the last visual position. We require an overscanning value of one or more.

### Set `<Droppable /> | mode` to `virtual`

Virtual lists behave differently to regular lists. You will need to tell `rbd` that your list is a virtual one.

```js
<Droppable droppableId="droppable" mode="virtual">
  {/*...*/}
</Droppable>
```

### Use the `<Droppable /> | renderClone` API

When using a virtual list the original dragging item can be unmounted during a drag if it becomes invisible. To get around this we require that you drag a clone of the dragging item. See our [reparenting guide](/docs/guides/reparenting.md) for more details.

```js
<Droppable
  droppableId="droppable"
  mode="virtual"
  renderClone={(provided, snapshot, descriptor) => (
    <div
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      ref={provided.innerRef}
    >
      Item id: {items[descriptor.id].id}
    </div>
  )}
>
  {/*...*/}
</Droppable>
```

### Stand in for the placeholder

Usually we require consumers to put a `placeholder` (`<Droppable /> | DroppableProvided | placeholder`) into the list so that we can insert space into a list as needing during a drag.

```js
<Droppable droppableId="droppable">
  {(provided, snapshot) => (
    <div ref={provided.innerRef} {...provided.droppableProps}>
      {/* Usually needed. But not for virtual lists! */}
      {provided.placeholder}
    </div>
  )}
</Droppable>
```

However, a `placeholder` does not make sense in the context of a virtual list as the dimensions of the list is not based on collective size of the visual items, but rather is calculated based on things like `itemCount` and `itemSize`. (eg `height` = `itemSize` \* `itemCount`). For virtual lists, inserting our own node into it would not increase the size of the list. **So we need you do insert the space for us!**

A simple way add extra space to a virtual list add a non-visible item to your list. It is important that this extra item is not a `<Draggable />`.

```js
// This example uses the `react-window` API

const Row = ({ data, index, style }: RowProps) => {
  const item = data[index];

   // We are rendering an extra item for the placeholder
  if (!quote) {
    return null;
  }

  return (
    <Draggable draggableId={item.id} index={index} key={item.id}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        {/*...*/}
      )}
    </Draggable>
  );
});

function render(provided: DroppableProvided, snapshot: DroppableStateSnapshot) {
  // Add an extra item to our list to make space for a dragging item
  // Usually the DroppableProvided.placeholder does this, but that won't
  // work in a virtual list
  const itemCount: number = provided.placeholderInfo
    ? quotes.length + 1
    : quotes.length;

  return (
    <List
      height={500}
      itemCount={itemCount}
      itemSize={110}
      width={300}
      outerRef={provided.innerRef}
      itemData={quotes}
    >
      {Row}
    </List>
  );
}
```

### Premade: `react-window

- [List example](TODO) [source](TODO)
- [Board example](TODO) [source](TODO)

### Premade: `react-virtualized`

- [List example](TODO) [source](TODO)
- [Board example](TODO) [source](TODO)

> Please raise a pull request ff you would like to add examples for other virtualization libraries! ❤

[← Back to documentation](/README.md#documentation-)
