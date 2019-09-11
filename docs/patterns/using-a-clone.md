# Using a `portal`

TODO: confusing two concepts!?!!! AHHH

It is possible to use a copy (clone) of your `<Draggable />` when dragging. When using a clone, the original `<Draggable />` children function is not rendered, and the clone is rendered inside of another DOM element. When working with virtual lists, a clone must be used.

## Background

We leave elements in place when dragging. We apply `position: fixed` on elements when we are moving them around. This is quite robust and allows for you to have `position: relative | absolute | fixed` parents. However, unfortunately `position:fixed` is [impacted by `transform`](http://meyerweb.com/eric/thoughts/2011/09/12/un-fixing-fixed-elements-with-css-transforms/) (such as `transform: rotate(10deg);`). This means that if you have a `transform: *` on one of the parents of a `<Draggable />` then the positioning logic will be incorrect while dragging. Lame! For most consumers this will not be an issue.

To get around the issue you can use a `portal`.

## `Portal`

Wait, what is a `portal`? A `portal` is a simply another DOM node outside of the current component tree. By using a portal you are able to move the `<Draggable />` into another DOM node while dragging. This can allow you to get around the limitations of `position: fixed`.

## `Portal` is not used by default as it is slow

React provides a first class api for using a `portal`: [`ReactDOM.createPortal`](https://reactjs.org/docs/portals.html). Originally we wanted to use it for all `<Draggable />`s while dragging. Unfortunately it has a big performance penalty - especially when dragging nodes with a lot of children ([React issue](https://github.com/facebook/react/issues/12247)). The reason for this is because components moving to a `ReactDOM.createPortal` are mounted and remounted which is quite expensive. Therefore we are currently not supporting it out of the box.

## Cloning API

We have created a first class way of rendering `<Draggable />`s into a `portal`.

```js
<Droppable renderClone={renderClone} getContainerForClone={() => document.body}>
  {(provided, snapshot) => (
    {/*...*/}
  )}
</Droppable>;
```

### `<Droppable />` | `renderClone`

This function is called to get a clone to be rendered while dragging.

```js
renderClone: ?DraggableChildrenFn
```

```js
type DraggableChildrenFn = (
  Provided,
  StateSnapshot,
  DraggableDescriptor,
) => Node | null;
```

> This is the same `type` as the child function for a `<Draggable />`. [See `<Draggable />` for more details](/docs/api/draggable.md).

### `<Droppable />` | `getContainerForClone`

A function that is called to get the DOM element you would like to put the clone into. If function is not defined, then `document.body` is used

```js
getContainerForClone: () => HTMLElement,
```

## Rolling your own `portal`

You are welcome to use your own `portal` solution if you want to from within your `<Draggable />`.

We have created a [working example](https://react-beautiful-dnd.netlify.com/?selectedKind=Portals&selectedStory=Using%20your%20own%20portal&full=0&addons=1&stories=1&panelRight=0&addonPanel=storybook%2Factions%2Factions-panel) that uses `ReactDOM.createPortal` directly to guide you. You can view the [source here](https://github.com/atlassian/react-beautiful-dnd/blob/master/stories/11-portal.stories.js).

If you are doing drag and drop reordering within a `<table>` we have created a portal section inside our [table guide](/docs/patterns/tables.md)

## Performance ⚠️

Keep in mind that anything that is rendered into a `portal` will be rendered from scratch. So you do not want to be moving large component trees into a `portal`: otherwise you will experience large UI jank.

[← Back to documentation](/README.md#documentation-)
