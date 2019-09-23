# Virtual lists

`react-beautiful-dnd` supports drag and drop with virtual lists and connected virtual lists. This lets you have fantastic performance with very large data sets. As a general rule, you will want to start using a virtual list when your list size is more than 500 items.

## Background: what are virtual lists?

A "virtual list" is the name given to a *windowing* performance optimisation technique where only the **visible** list items are rendered.

[TODO: GIF]

> See [Rendering large lists with react-window](https://addyosmani.com/blog/react-window/) By Addy Osmani

Keep in mind that there are drawbacks with using virtual lists. The biggest are poor accessiblity and findability. When using windowing non visible items are not rendered in the DOM. This means that inbuilt browser behaviours like

## Support

`react-beautiful-dnd` is designed to work with existing virtual list solutions and does not have it's own virtual list abstraction. There is no official "virtual list" specification or implementation for the web. Different virtual list libraries achieve windowing through various techniques. So we cannot guarentee that `react-beautiful-dnd` will work with every virtual list library. We have created examples for `react-window` and `react-virtualized` which are the two most popular virtual list libraries for `react`.

## Usage

In order to use `react-beautiful-dnd` with a virtual list solution there are a number of things you will need to do. `rbd` does not provide it's own virtual list library, so there is a bit of wiring that you will need to do in order to get going.

### Enable overscanning

> Most virtualisation libraries have overscanning enabled by default so you shouldn't need to change anything

Most virtual list libraries support the concept of **overscanning**. Overscanning is where the library will render a small about of items (usually one) that are technically not visible themselves, but near the boundary of the window. So when a scroll occurs the item is already visible. Overscanning generally leads to a more fluid experience.

It is required that overscanning be enabled for `react-beautiful-dnd` to work correctly. If overscanning is not enabled, we cannot tell if there are more items in the list when we are in the last visual position.

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
function renderItem(provided, snapshot, descriptor) {
  //...
}

<Droppable renderClone={renderItem}>
  {/*...*/}
</Droppable>;
```

### Stand in for the placeholder

Usually we require consumers to put a `placeholder` (`<Droppable /> | DroppableProvided | placeholder`) into the list so that we can insert space into a list as needing during a drag.

```js
<Droppable droppableId="droppable-1">
  {(provided, snapshot) => (
    <div ref={provided.innerRef} {...provided.droppableProps}>
      {/* Usually needed. But not for virtual lists! */}
      {provided.placeholder}
    </div>
  )}
</Droppable>
```

However, a `placeholder` does not make sense in the context of a virtual list as the dimensions of the list is not based on collective size of the visual items, but rather is calculated based on things like `itemCount` and `itemSize`. (eg `height` = `itemSize` * `itemCount`). For virtual lists, inserting our own node into it would not increase the size of the list. **So we need you do insert the space for us!**




### Premade: `react-window

- [List example](TODO) [source](TODO)
- [Board example](TODO) [source](TODO)

### Premade: `react-virtualized`

- [List example](TODO) [source](TODO)
- [Board example](TODO) [source](TODO)

> Please raise a pull request ff you would like to add examples for other virtualization libraries! ❤


[← Back to documentation](/README.md#documentation-)
