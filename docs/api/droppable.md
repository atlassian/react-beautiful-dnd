# `<Droppable />`

`<Droppable />` components can be **dropped on by a `<Draggable />`**. They also **contain** `<Draggable />`s. A `<Draggable />` must be contained within a `<Droppable />`.

```js
import { Droppable } from 'react-beautiful-dnd';

<Droppable droppableId="droppable-1" type="PERSON">
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      style={{ backgroundColor: snapshot.isDraggingOver ? 'blue' : 'grey' }}
      {...provided.droppableProps}
    >
      <h2>I am a droppable!</h2>
      {provided.placeholder}
    </div>
  )}
</Droppable>;
```

## Droppable props

```js
import type { Node } from 'react';

type Props = {|
  // required
  droppableId: DroppableId,
  // optional
  type?: TypeId,
  isDropDisabled?: boolean,
  isCombineEnabled?: boolean,
  direction?: Direction,
  ignoreContainerClipping?: boolean,
  children: (Provided, StateSnapshot) => Node,
|};
```

### Required props

> `react-beautiful-dnd` will throw an error if a required prop is not provided

- `droppableId`: A _required_ `DroppableId(string)`. See our [identifiers guide](/docs/guides/identifiers.md) for more information.

### Optional props

- `type`: A `TypeId(string)` that can be used to simply accept only the specified class of `<Draggable />`. `<Draggable />`s always inherit type from the `<Droppable />` they are defined in. For example, if you use the type `PERSON` then it will only allow `<Draggable />`s of type `PERSON` to be dropped on itself. `<Draggable />`s of type `TASK` would not be able to be dropped on a `<Droppable />` with type `PERSON`. If no `type` is provided, it will be set to `'DEFAULT'`.
- `isDropDisabled`: A flag to control whether or not dropping is currently allowed on the `<Droppable />`. You can use this to implement your own conditional dropping logic. It will default to `false`.
- `isCombineEnabled`: A flag to control whether or not _all_ the `Draggables` in the list will be able to be **combined** with. It will default to `false`.
- `direction`: The direction in which items flow in this droppable. Options are `vertical` (default) and `horizontal`.
- `ignoreContainerClipping`: When a `<Droppable />` is inside a scrollable container its area is constrained so that you can only drop on the part of the `<Droppable />` that you can see. Setting this prop opts out of this behavior, allowing you to drop anywhere on a `<Droppable />` even if it's visually hidden by a scrollable parent. The default behavior is suitable for most cases so odds are you'll never need to use this prop, but it can be useful if you've got very long `<Draggable />`s inside a short scroll container. Keep in mind that it might cause some unexpected behavior if you have multiple `<Droppable />`s inside scroll containers on the same page.

## Children function

The `React` children of a `<Droppable />` must be a function that returns a [`ReactElement`](https://tylermcginnis.com/react-elements-vs-react-components/).

```js
<Droppable droppableId="droppable-1">
  {(provided, snapshot) => ({
    /*...*/
  })}
</Droppable>
```

The function is provided with two arguments:

### 1. provided: (DroppableProvided)

```js
type DroppableProvided = {|
  innerRef: (?HTMLElement) => void,
  droppableProps: DroppableProps,
  placeholder: ?ReactElement,
|};

type DroppableProps = {|
  // used for shared global styles
  'data-react-beautiful-dnd-droppable': string,
|};
```

- `provided.innerRef`: In order for the droppable to function correctly, **you must** bind the `provided.innerRef` to the highest possible DOM node in the `ReactElement`. We do this in order to avoid needing to use `ReactDOM` to look up your DOM node.

> For more information on using `innerRef` see our [using `innerRef` guide](/docs/guides/using-inner-ref.md)

- `provided.placeholder`: This is used to create space in the `<Droppable />` as needed during a drag. This space is needed when a user is dragging over a list that is not the home list. Please be sure to put the placeholder inside of the component for which you have provided the ref. We need to increase the size of the `<Droppable />` itself.
- `provided.droppableProps (DroppableProps)`: This is an Object that contains properties that need to be applied to a Droppable element. It needs to be applied to the same element that you apply `provided.innerRef` to. It currently contains a `data` attribute that we use to control some non-visible css.

```js
<Droppable droppableId="droppable-1">
  {(provided, snapshot) => (
    <div ref={provided.innerRef} {...provided.droppableProps}>
      Good to go
      {provided.placeholder}
    </div>
  )}
</Droppable>
```

### 2. snapshot: (DroppableStateSnapshot)

```js
type DroppableStateSnapshot = {|
  // Is the Droppable being dragged over?
  isDraggingOver: boolean,
  // What is the id of the draggable that is dragging over the Droppable?
  draggingOverWith: ?DraggableId,
|};
```

The `children` function is also provided with a small amount of state relating to the current drag state. This can be optionally used to enhance your component. A common use case is changing the appearance of a `<Droppable />` while it is being dragged over.

```js
<Droppable droppableId="droppable-1">
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      style={{ backgroundColor: snapshot.isDraggingOver ? 'blue' : 'grey' }}
      {...provided.droppableProps}
    >
      I am a droppable!
      {provided.placeholder}
    </div>
  )}
</Droppable>
```

## Conditionally dropping

- `<Droppable />`s can only be dropped on by `<Draggable />`s who share the same `type`. This is a simple way of allowing conditional dropping. If you do not provide a `type` for the `<Droppable />`, then it will only accept `<Draggable />`s which also have the default type. `<Draggable />`s and `<Droppable />`s both will have their `types` set to `'DEFAULT'` when none is provided. There is currently no way to set multiple `types`, or a `type` wildcard that will accept `<Draggable />`s of multiple any types. This could be added if there is a valid use case.
- Using the `isDropDisabled` prop you can conditionally allow dropping. This allows you to do arbitrarily complex conditional transitions. This will only be considered if the `type` of the `<Droppable />` matches the `type` of the currently dragging `<Draggable />`.
- You can disable dropping on a `<Droppable />` altogether by always setting `isDropDisabled` to `true`. You can do this to create a list that is never able to be dropped on, but contains `<Draggable />`s.
- Technically you do not need to use `type` and do all of your conditional drop logic with the `isDropDisabled` function. The `type` parameter is a convenient shortcut for a common use case.

## Combining

`react-beautiful-dnd` supports the combining of `<Draggable />`s 🤩

![combining](https://user-images.githubusercontent.com/2182637/48045145-318dc300-e1e3-11e8-83bd-22c9bd44c442.gif)

You can enable a _combining_ mode for a `<Droppable />` by setting `isCombineEnabled` to `true` on a `<Droppable />`. We have created a [combining guide](/docs/guides/combining.md) to help you implement combining in your lists.

## Adding and removing `<Draggable />`s while dragging

It is possible to change the `<Draggable />`s in a `<Droppable />` for a limited set of circumstances. We have created a comprehensive [changes while dragging guide](/docs/guides/changes-while-dragging.md)

## Scroll containers

This library supports dragging within scroll containers (DOM elements that have `overflow: auto;` or `overflow: scroll;`). The **only** supported use cases are:

1.  The `<Droppable />` can itself be a scroll container with **no scrollable parents**
2.  The `<Droppable />` has **one scrollable parent**

where a _scrollable parent_ refers to a scroll container that is not the window itself.

For more information see [how we detect scroll containers guide](/docs/guides/how-we-detect-scroll-containers.md)

> We currently only support a single scroll parent. We plan on adding support for [nested scroll containers](https://github.com/atlassian/react-beautiful-dnd/issues/131)

## Empty `<Droppable />`s

It is recommended that you put a `min-height` on a vertical `<Droppable />` or a `min-width` on a horizontal `<Droppable />`. Otherwise when the `<Droppable />` is empty there may not be enough of a target for `<Draggable />` being dragged with touch or mouse inputs to be _over_ the `<Droppable />`.

## Fixed `<Droppable />`s

`react-beautiful-dnd` has partial support for `<Droppable />` lists that use `position: fixed`. When you start a drag and _any_ list of the same type is `position:fixed` then auto window scrolling will be disabled. This is because our virtual model assumes that when the page scroll changes the position of a `<Droppable />` will shift too. If a manual window scroll is detected then the scroll will be aborted. Scroll container scroll is still allowed. We could improve this support, but it would just be a big effort. Please raise an issue if you would be keen to be a part of this effort ❤️

## Recommended `<Droppable />` performance optimisation

> 📺 This optimisation is covered in a [free lesson of our getting started course](https://egghead.io/lessons/react-optimize-performance-in-react-beautiful-dnd-with-shouldcomponentupdate-and-purecomponent)

When a user drags over, or stops dragging over, a `<Droppable />` we re-render the `<Droppable />` with an updated `DroppableStateSnapshot > isDraggingOver` value. This is useful for styling the `<Droppable />`. However, by default this will cause a render of all of the children of the `<Droppable />` - which might be 100's of `<Draggable />`s! This can result in a noticeable frame rate drop. To avoid this problem we recommend that you create a component that is the child of a `<Droppable />` who's responsibility it is to avoid rendering children if it is not required.

Here is an example of how you could do this:

```js
import React, { Component } from 'react';

class Student extends Component<{ student: Person }> {
  render() {
    // Renders out a draggable student
  }
}

class InnerList extends Component<{ students: Person[] }> {
  // do not re-render if the students list has not changed
  shouldComponentUpdate(nextProps: Props) {
    if (this.props.students === nextProps.students) {
      return false;
    }
    return true;
  }
  // You could also not do your own shouldComponentUpdate check and just
  // extend from React.PureComponent

  render() {
    return this.props.students.map((student: Person) => (
      <Student student={student} />
    ));
  }
}

class Students extends Component {
  render() {
    return (
      <Droppable droppableId="list">
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <div
            ref={provided.innerRef}
            style={{
              backgroundColor: provided.isDragging ? 'green' : 'lightblue',
            }}
            {...provided.droppableProps}
          >
            <InnerList students={this.props.students} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  }
}
```

By using the approach you are able to make style changes to a `<Droppable />` when it is being dragged over, but you avoid re-rendering all of the children unnecessarily. Keep in mind that if you are using `React.PureComponent` that your component will [not respond to changes in the context with the legacy context API](https://github.com/facebook/react/issues/2517).

When moving into a new list, the visible `Draggables` will have their `render` function called directly even with this optimisation. This is because we need to move those `Draggables` out of the way. The `InnerList` optimisation will prevent the `<Droppable />` from calling `render` on the whole list from the top down. This optimisation will prevent the non-visible `Draggables` from having their render function called.

Unfortunately we are [unable to apply this optimisation for you](https://medium.com/merrickchristensen/function-as-child-components-5f3920a9ace9). It is a byproduct of using the render-props pattern.

[← Back to documentation](/README.md#documentation-)
