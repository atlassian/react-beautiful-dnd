# Reparenting a `<Draggable />`

There are situations were you want to change the parent element of the dragging item while a drag is occurring. There are two approaches you can use to do this:

1. Using our 1st class cloning API (required for virtual lists)
2. Using your own `portal` with [`ReactDOM.createPortal`](https://reactjs.org/docs/portals.html)

## Background

We leave elements in place when dragging. We apply `position: fixed` on elements when we are moving them around. This is quite robust and allows for you to have `position: relative | absolute | fixed` parents. However, unfortunately `position:fixed` is [impacted by `transform`](http://meyerweb.com/eric/thoughts/2011/09/12/un-fixing-fixed-elements-with-css-transforms/) (such as `transform: rotate(10deg);`). This means that if you have a `transform: *` on one of the parents of a `<Draggable />` then the positioning logic will be incorrect while dragging. Lame! For most consumers this will not be an issue.

To get around this issue you need to move the dragging item to another location in the DOM - usually `document.body` or a direct descendent of it. This removes the impact of any parent styles on the `position:fixed`. The new parent is often referred to as a `portal`.

## Cloning API

Our cloning API is a first class way of reparenting a `<Draggable />`s into another DOM location while a drag is occurring. When using our cloning API the original `<Draggable />` is removed while the drag is being performed; a new *clone* is rendered (using `renderClone`) into the container element (controllable using `getContainerForClone`)

Using our cloning API is required for compatibility with [virtual lists](TODO).

```js
function renderItem(provided, snapshot, descriptor) {
  //...
}

<Droppable renderClone={renderItem} getContainerForClone={() => document.body}>
  {renderItem}
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

⚠️ You are welcome to use your own `portal` solution if you want to from within your `<Draggable />`. Before we had a cloning API, reparenting needed to be done by using your own portal. It is now recommended that you use the cloning API.

We have created a [working example](https://react-beautiful-dnd.netlify.com/?selectedKind=Portals&selectedStory=Using%20your%20own%20portal&full=0&addons=1&stories=1&panelRight=0&addonPanel=storybook%2Factions%2Factions-panel) that uses `ReactDOM.createPortal` directly to guide you. You can view the [source here](https://github.com/atlassian/react-beautiful-dnd/blob/master/stories/11-portal.stories.js).

If you are doing drag and drop reordering within a `<table>` we have created a portal section inside our [table guide](/docs/patterns/tables.md)

## Performance ⚠️

Keep in mind that anything that is reparented will be rendered from scratch. So you do not want to be moving large component trees into a `portal`: otherwise you will experience large UI jank. We do not using reparenting out of the box because of this performance drawback.

[← Back to documentation](/README.md#documentation-)