# Combining

> 👶 This feature is still quite young. We wanted to get it out there for people to play with

`react-beautiful-dnd` supports the combining of `<Draggable />`s 🤩

![combining](https://user-images.githubusercontent.com/2182637/48045145-318dc300-e1e3-11e8-83bd-22c9bd44c442.gif)

> 🌲 If you are looking to build a tree view, we have built one already! [@atlaskit/tree](https://atlaskit.atlassian.com/packages/core/tree)

## Setup

In order to enable combining you need to set `isCombineEnabled` to `true` on a `<Droppable />` and you are good to go!

```js
<Droppable droppableId="droppable" isCombineEnabled>
  ...
</Droppable>
```

## Behaviour

When `isCombineEnabled` is set on a list _any_ item in the list can be combine with. You can toggle `isCombineEnabled` during a drag.

## When we combine and when we reorder

`react-beautiful-dnd` works hard to ensure that users are able to combine and reorder within the same list in a way that feels intuitive and natural.

| When entering from the start                                                                                             | When entering from the end                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Theory                                                                                                                   |
| ![enter-from-top](https://user-images.githubusercontent.com/2182637/48168370-08844400-e343-11e8-8954-6b4f3c5c825e.png)   | ![enter-from-bottom](https://user-images.githubusercontent.com/2182637/48168369-07ebad80-e343-11e8-9402-caf6e91307a3.png) |
| In practice                                                                                                              |
| ![enter-from-start](https://user-images.githubusercontent.com/2182637/48169676-49cb2280-e348-11e8-8f11-5eeaf392cae6.gif) | ![enter-from-end](https://user-images.githubusercontent.com/2182637/48169675-49cb2280-e348-11e8-854a-04b913d3851b.gif)    |

### How it works

> You do not really need to know how this works, but if you are interested you are welcome to read on. We are using the language 'forward', 'backwards', 'start', 'end' as it is `axis` independent

If a user moves the center point of a `<Draggable />` over a visible edge of a target `<Draggable />` then the user will be able to combine with the target.

We detect which direction the user is moving in when they cross the visible edge of a `<Draggable />`. We use this to know if they entered closer to the front or the back of the item.

If they entered closer to the _start of the item_, the the user will be able to combine with the item when they are moving in the _start 2/3_ of the item. This includes forwards and backwards movements.

If they entered closer to the _end of the item_, the the user will be able to combine with the item when they are moving in the _end 2/3_ of the item. This includes forwards and backwards movements.

If the user moves beyond the 2/3 allocated, then the target item will reorder as normal.

#### Combining with displaced item

Combining is displacement aware. This means that if you try to combine with an item that is already displaced, that displacement will be respected and the user will be able to combine with the item while it is displaced. This yields a really nice user experience

![combine-with-displaced](https://user-images.githubusercontent.com/2182637/48169674-49328c00-e348-11e8-8d35-d3d41916cd89.gif)

> Combining with a displaced item works as expected

#### Why 2/3?

We allow 2/3 of the size as a combine target as this will allow users a nice amount of room to combine items with. It is enough to allow the centers of the two items to be over each other with a little bit of grace distance. There is also a 1/3 area for reordering which allows enough room for both combining and reordering to occur in the same list.

## Current limitations

- No granular control over which items can be combined with within the list. We could move to the `isCombineEnabled` prop from a `<Droppable />` to a `<Draggable />` to allow this sort of customisation. However, in order to ship this huge feature we went a bit simplier to start with
- A list must be reorderable to also have items that can be combined with. It is not possible for a list to be 'combine only' at this stage

## `<Draggable />` > `DraggableStateSnapshot`

```diff
type DraggableStateSnapshot = {|
  isDragging: boolean,
  isDropAnimating: boolean,
  dropAnimation: ?DropAnimation,
  draggingOver: ?DroppableId,
+  combineWith: ?DraggableId,
+  combineTargetFor: ?DraggableId,
  mode: ?MovementMode,
|};
```

If you are dragging a `<Draggable />` over another `<Draggable />` in combine mode then the id of the `<Draggable />` being dragged over will be populated in `combineWith`

If a `<Draggable />` is being dragged over in combine mode then the id of the `<Draggable />` being dragged will be populated in `combineTargetFor`

## `<DragDropContext />` > `Responders`

`onDragUpdate` and `onDragEnd` will be updated with any changes to a `combine`

> See our [type guide](/docs/guides/types.md) for more details

## Persisting a `combine`

A `combine` result might signify different operations depending on your problem domain.

When combining, a simple operation is to just remove the item that was dragging

```js
class App extends React.Component {
  onDragEnd = result => {
    // combining item
    if (result.combine) {
      // super simple: just removing the dragging item
      const items: Quote[] = [...this.state.items];
      items.splice(result.source.index, 1);
      this.setState({ items });
      return;
    }
  };

  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        {this.props.children}
      </DragDropContext>
    );
  }
}
```

## Drop animation

One of the goals of `react-beautiful-dnd` is to create a drag and drop experience that feels physical. This is a bit tricky to achieve in a generic way when it comes to combining two things.

What we have gone for out of the box in the following animation:

- move the dragging item onto the center of the item being grouped with
- fade the opacity of the dragging item down to `0`
- scale the dragging item down

This animation attempts to communicate one item _moving into_ another item in a fairly generic way.

![combining](https://user-images.githubusercontent.com/2182637/48045145-318dc300-e1e3-11e8-83bd-22c9bd44c442.gif)

You are welcome to customise this animation using the information found in our [drop animation guide](/docs/guides/drop-animation.md)
