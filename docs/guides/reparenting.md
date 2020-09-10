# Reparenting a `<Draggable />`

There are situations were you want to change the parent element of the dragging item while a drag is occurring. There are two approaches you can use to do this:

1. Using our 1st class cloning API (required for [virtual lists](/docs/patterns/virtual-lists.md))
2. Using your own `portal` with [`ReactDOM.createPortal`](https://reactjs.org/docs/portals.html)

## Background

We leave elements in place when dragging. We apply `position: fixed` on elements when we are moving them around. This is quite robust and allows for you to have `position: relative | absolute | fixed` parents. However, unfortunately `position:fixed` is [impacted by `transform`](http://meyerweb.com/eric/thoughts/2011/09/12/un-fixing-fixed-elements-with-css-transforms/) (such as `transform: rotate(10deg);`). This means that if you have a `transform: *` on one of the parents of a `<Draggable />` then the positioning logic will be incorrect while dragging. Lame! For most consumers this will not be an issue.

To get around this issue you need to move the dragging item to another location in the DOM - usually `document.body` or a direct descendent of it. This removes the impact of any parent styles on the `position:fixed`. The new parent is often referred to as a `portal`.

## Cloning API

Our cloning API is a first class way of reparenting a `<Draggable />`s into another DOM location while a drag is occurring. When using our cloning API the original `<Draggable />` is removed while the drag is being performed; a new _clone_ is rendered (using `renderClone`) into the container element (controllable using `getContainerForClone`)

<img src="https://user-images.githubusercontent.com/2182637/66469796-439f7200-ead4-11e9-834e-c11d13dafab0.gif" width="300px" />

Generally you will want to render the same visual item as the one that is dragging, but you can render anything you want. The displacement will be based on the dimensions of the original item so we strongly recommend using an element that is exactly the same size.

Using our cloning API is required for compatibility with [virtual lists](/docs/patterns/virtual-lists.md).

```js
function List(props) {
  const items = props.items;

  return (
    <Droppable
      droppableId="droppable"
      renderClone={(provided, snapshot, rubric) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
        >
          Item id: {items[rubric.source.index].id}
        </div>
      )}
    >
      {provided => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {items.map(item) => (
            <Draggable draggableId={item.id} index={item.index}>
              {(provided, snapshot) => (
                <div
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  ref={provided.innerRef}
                >
                  Item id: {item.id}
                </div>
              )}
            </Draggable>
          )}
        </div>
      )}
    </Droppable>
  );
}
```

You can also reuse the `<Draggable /> | DraggableChildrenFn` if you want too!

```js
const getRenderItem = (items) => (provided, snapshot, rubric) => (
  <div
    {...provided.draggableProps}
    {...provided.dragHandleProps}
    ref={provided.innerRef}
  >
    Item id: {items[rubric.source.index].id}
  </div>
);

function List(props) {
  const items = props.items;
  const renderItem = getRenderItem(items);

  return (
    <Droppable
      droppableId="droppable"
      renderClone={renderItem}
    >
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {items.map((item) => (
            <Draggable draggableId={item.id} index={item.index}>
              {renderItem}
            </Draggable>
          ))}
        </div>
      )}
    </Droppable>
  );
}
```

### `<Droppable /> | \renderClone`

This function is called to get a clone to be rendered while dragging.

```js
renderClone: ?DraggableChildrenFn
```

```js
type DraggableChildrenFn = (
  Provided,
  StateSnapshot,
  DraggableRubric,
) => Node | null;
```

> This is the same `type` as the child function for a `<Draggable />`. [See `<Draggable />` for more details](/docs/api/draggable.md).

### `<Droppable /> | getContainerForClone`

A function that is called to get the DOM element you would like to put the clone into. If function is not defined, then `document.body` is used

```js
getContainerForClone: () => HTMLElement,
```

## Rolling your own `portal`

⚠️ You are welcome to use your own `portal` solution if you want to from within your `<Draggable />`. Before we had a cloning API, reparenting needed to be done by using your own portal. It is now recommended that you use the cloning API.

We have created a [working example](https://react-beautiful-dnd.netlify.com/?selectedKind=Portals&selectedStory=Using%20your%20own%20portal&full=0&addons=1&stories=1&panelRight=0&addonPanel=storybook%2Factions%2Factions-panel) that uses `ReactDOM.createPortal` directly to guide you. You can view the [source here](https://github.com/atlassian/react-beautiful-dnd/blob/master/stories/11-portal.stories.js).

If you are doing drag and drop reordering within a `<table>` we have created a portal section inside our [table guide](/docs/patterns/tables.md)

## Performance ⚠️

Keep in mind that anything that is reparented will be rendered from scratch. So you do not want to be moving large component trees into a `portal`: otherwise you will experience large UI jank. We do not recommend using reparenting out of the box because of this performance drawback.

[← Back to documentation](/README.md#documentation-)
