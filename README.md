# react-beautiful-dnd

Beautiful, accessible drag and drop for lists with [React.js](https://facebook.github.io/react/)

[![Build Status](https://travis-ci.org/atlassian/react-beautiful-dnd.svg?branch=master)](https://travis-ci.org/atlassian/react-beautiful-dnd) [![dependencies](https://david-dm.org/atlassian/react-beautiful-dnd.svg)](https://david-dm.org/atlassian/react-beautiful-dnd) [![SemVer](https://img.shields.io/badge/SemVer-2.0.0-brightgreen.svg)](http://semver.org/spec/v2.0.0.html)

![example](https://raw.githubusercontent.com/alexreardon/files/master/resources/dnd.small.gif?raw=true)

## Examples 🎉

See how beautiful it is for yourself - [have a play with the examples!](https://react-beautiful-dnd.netlify.com)

## Core characteristics:

- beautiful, natural movement of items
- clean and powerful api which is simple to get started with
- unopinionated styling
- no creation of additional wrapper dom nodes - flexbox and focus management friendly!
- plays well with existing interactive nodes such as anchors
- state driven dragging - which allows for dragging from many input types, including programatic dragging. Currently only mouse and keyboard dragging are supported

## Why not [react-dnd](https://github.com/react-dnd/react-dnd)?

There are a lot of libraries out there that allow for drag and drop interactions within React. Most notable of these is the amazing **react-dnd**. It does an incredible job at providing a great set of drag and drop primitives which work especially well with the [wildly inconsistent](https://www.quirksmode.org/blog/archives/2009/09/the_html5_drag.html) html5 drag and drop feature. **react-beautiful-dnd is a higher level abstraction specifically built for vertical and horizontal lists**. Within that subset of functionality react-beautiful-dnd offers a powerful, natural and beautiful drag and drop experience. However, it does not provide the breadth of functionality offered by **react-dnd**. So this library might not be for you depending on what your use case is.

## Still young!

This library is still fairly new and so there is a relatively small feature set. Be patient! Things will be moving rather quickly!

### Currently supported feature set

- dragging an item within a single vertical list
- mouse 🐭 and **keyboard 🎹** dragging
- the vertical list can be a scroll container (without a scrollable parent) or be the child of a scroll container (that also does not have a scrollable parent)

### Short term backlog

- Dragging within a horizontal list
- Moving items between vertical lists (until this lands conditional dropping will not be available)

### Medium term backlog

- Moving items between horizontal lists
- Moving a `Draggable` from a vertical list to a horizontal list
- Touch support

### Long term backlog

- Nesting
- Automatically disabling animations when the frame rate drops below a threshold.
- A mechanism to programatically perform dragging without user input
- Dragging multiple items at a time
- And lots more!

## Installation

```bash
# yarn
yarn add react-beautiful-dnd

# npm
npm install react-beautiful-dnd --save
```

## Basic usage example

This is a simple little reorderable list. [You can play with it on webpackbin](https://www.webpackbin.com/bins/-Kr9aE9jnUeWlphY8wsw)

![basic example](https://github.com/alexreardon/files/blob/master/resources/dnd-basic-example-small.gif?raw=true)

```js
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// fake data generator
const getItems = (count) => Array.from({length: count}, (v, k) => k).map(k => ({
  id: `item-${k}`,
  content: `item ${k}`
}));

// a little function to help us with reordering the result
const reorder =  (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

// using some little inline style helpers to make the app look okay
const grid = 8;
const getItemStyle = (draggableStyle, isDragging) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: 'none',
  padding: grid * 2,
  marginBottom: grid,

  // change background colour if dragging
  background: isDragging ? 'lightgreen' : 'grey',

  // styles we need to apply on draggables
  ...draggableStyle
});
const getListStyle = (isDraggingOver) => ({
  background: isDraggingOver ? 'lightblue' : 'lightgrey',
  padding: grid,
  width: 250
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: getItems(10)
    }
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  onDragEnd (result) {
    // dropped outside the list
    if(!result.destination) {
      return;
    }

    const items = reorder(
      this.state.items,
      result.source.index,
      result.destination.index
    );

    this.setState({
      items
    });
  }

  // Normally you would want to split things out into separate components.
  // But in this example everything is just done in one place for simplicity
  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              style={getListStyle(snapshot.isDraggingOver)}
            >
              {this.state.items.map(item => (
                <Draggable
                  key={item.id}
                  draggableId={item.id}
                >
                  {(provided, snapshot) => (
                    <div>
                      <div
                        ref={provided.innerRef}
                        style={getItemStyle(
                          provided.draggableStyle,
                          snapshot.isDragging
                        )}
                        {...provided.dragHandleProps}
                      >
                        {item.content}
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Draggable>
              ))}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}

// Put the thing into the DOM!
ReactDOM.render(<App />, document.getElementById('app'));
```

## API

So how do you use the library?

## `DragDropContext`

In order to use drag and drop, you need to have the part of your react tree that you want to be able to use drag and drop in wrapped in a `DragDropContext`. It is advised to just wrap your entire application in a `DragDropContext`. Having nested `DragDropContext`'s is *not* supported. You will be able to achieve your desired conditional dragging and dropping using the props of `Droppable` and `Draggable`. You can think of `DragDropContext` as having a similar purpose to the [react-redux Provider component](https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store)

### Prop type information

```js
type Hooks = {|
  onDragStart?: (id: DraggableId, location: DraggableLocation) => void,
  onDragEnd: (result: DropResult) => void,
|}

type Props = Hooks & {|
  children?: ReactElement,
|}
```

### Basic usage

```js
import { DragDropContext } from 'react-beautiful-dnd';

class App extends React.Component {
  onDragStart = () => {...}
  onDragEnd = () => {...}

  render() {
    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <div>Hello world</div>
      </DragDropContext>
    )
  }
}
```

### `Hook`s

These are top level application events that you can use to perform your own state updates.


### `onDragStart` (optional)

This function will get notified when a drag starts. You are provided with the following details:

- `id`: the id of the `Draggable` that is now dragging
- `location`: the location (`droppableId` and `index`) of where the dragging item has started within a `Droppable`.

This function is *optional* and therefore does not need to be provided. It is **highly recommended** that you use this function to block updates to all `Draggable` and `Droppable` components during a drag. (See *Best `hooks` practices*)

**Type information**

```js
onDragStart?: (id: DraggableId, location: DraggableLocation) => void

// supporting types
type Id = string;
type DroppableId: Id;
type DraggableId: Id;
type DraggableLocation = {|
  droppableId: DroppableId,
  // the position of the draggable within a droppable
  index: number
|};
```

### `onDragEnd` (required)

This function is *extremely* important and has an important role to play in the application lifecycle. **This function must result in the *synchronous* reordering of a list of `Draggables`**

It is provided with all the information about a drag:

### `result: DragResult`

- `result.draggableId`: the id of the `Draggable` was dragging.
- `result.source`: the location that the `Draggable` started in.
- `result.destination`: the location that the `Draggable` finished in. The `destination` will be `null` if the user dropped into no position (such as outside any list) *or* if they dropped the `Draggable` back into the same position that it started in.

### Synchronous reordering

Because this library does not control your state, it is up to you to *synchronously* reorder your lists based on the `result`.

*Here is what you need to do:*
- if the `destination` is `null`: all done!
- if `source.droppableId` equals `destination.droppableId` you need to remove the item from your list and insert it at the correct position.
- if `source.droppableId` does not equal `destination.droppable` you need to the `Draggable` from the `source.droppableId` list and [add it](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/splice) into the correct position of the `destination.droppableId` list.

(links assume you store your ids in arrays)

### Type information

```js
onDragEnd: (result: DropResult) => void

// supporting types
type DropResult = {|
  draggableId: DraggableId,
  source: DraggableLocation,
  // may not have any destination (drag to nowhere)
  destination: ?DraggableLocation
|}

type Id = string;
type DroppableId: Id;
type DraggableId: Id;
type DraggableLocation = {|
  droppableId: DroppableId,
  // the position of the droppable within a droppable
  index: number
|};
```

### Best practices for `hooks`

**Block updates during a drag**

It is **highly** recommended that while a user is dragging that you block any state updates that might impact the amount of `Draggable`s and `Droppable`s, or their dimensions. Please listen to `onDragStart` and block updates to the `Draggable`s and `Droppable`s until you receive at `onDragEnd`.

When the user starts dragging we take a snapshot of all of the dimensions of the applicable `Draggable` and `Droppable` nodes. If these change during a drag we will not know about it.

Here are a few poor user experiences that can occur if you change things *during a drag*:

- If you increase the amount of nodes the library will not know about them and they will not be moved when the user would expect them to be.
- If you decrease the amount of nodes then there might be gaps and unexpected movements in your lists.
- If you change the dimensions of any node, it can cause the changed node as well as others to move at incorrect times.
- If you remove the node that the user is dragging the drag will instantly end
- If you change the dimension of the dragging node then other things will not move out of the way at the correct time.


**`onDragStart` and `onDragEnd` pairing**

We try very hard to ensure that each `onDragStart` event is paired with a single `onDragEnd` event. However, there maybe a rouge situation where this is not the case. If that occurs - it is a bug. Currently there is no mechanism to tell the library to cancel a current drag externally.

**Style**

During a drag it is recommended that you add two styles to the body:

1. `user-select: none;` and
2. `cursor: grab;` (or whatever cursor you want to use while dragging)

`user-select: none;` prevents the user drag from selecting text on the page as they drag.

`cursor: [your desired cursor];` is needed because we apply `pointer-events: none;` to the dragging item. This prevents you setting your own cursor style on the Draggable directly based on `snapshot.isDragging` (see `Draggable`).

**Dynamic hooks**

Your *hook* functions will only be captured *once at start up*. Please do not change the function after that. If there is a valid use case for this then dynamic hooks could be supported. However, at this time it is not.

## `Droppable`

`Droppable` components can be **dropped on by a `Draggable`**. They also **contain** `Draggable`s. A `Draggable` must be contained within a `Droppable`.

```js
import { Droppable } from 'react-beautiful-dnd';

<Droppable
  droppableId="droppable-1"
  type="PERSON"
>
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      style={{backgroundColor: snapshot.isDraggingOver ? 'blue' : 'grey'}}
    >
      I am a droppable!
    </div>
  )}
</Droppable>
```

### Props

- `droppableId`: A *required* `DroppableId(string)` that uniquely identifies the droppable for the application. Please do not change this prop - especially during a drag.
- `type`: An *optional* `TypeId(string)` that can be used to simply accept a class of `Draggable`. For example, if you use the type `PERSON` then it will only allow `Draggable`s of type `PERSON` to be dropped on itself. `Draggable`s of type `TASK` would not be able to be dropped on a `Droppable` with type `PERSON`. If no `type` is provided, it will be set to `'DEFAULT'`. Currently the `type` of the `Draggable`s within a `Droppable` **must be** the same. This restriction might be loosened in the future if there is a valid use case.
- `isDropDisabled`: An *optional* flag to control whether or not dropping is currently allowed on the `Droppable`. You can use this to implement your own conditional dropping logic. It will default to `false`.

### Children function

The React children of a `Droppable` must be a function that returns a `ReactElement`.

```js
<Droppable droppableId="droppable-1">
  {(provided, snapshot) => (
    // ...
  )}
</Droppable>
```

The function is provided with two arguments:

**1. provided: (Provided)**

```js
type Provided = {|
  innerRef: (HTMLElement) => mixed,
|}
```

In order for the droppable to function correctly, **you must** bind the `provided.innerRef` to the highest possible DOM node in the `ReactElement`. We do this in order to avoid needing to use `ReactDOM` to look up your DOM node.

```js
<Droppable droppableId="droppable-1">
  {(provided, snapshot) => (
    <div ref={provided.innerRef}>
      Good to go
    </div>
  )}
</Droppable>
```

**2. snapshot: (StateSnapshot)**

```js
type StateSnapshot = {|
  isDraggingOver: boolean,
|}
```

The `children` function is also provided with a small about of state relating to the current drag state. This can be optionally used to enhance your component. A common use case is changing the appearance of a `Droppable` while it is being dragged over.

```js
<Droppable droppableId="droppable-1">
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      style={{backgroundColor: snapshot.isDraggingOver ? 'blue' : 'grey'}}
    >
      I am a droppable!
    </div>
  )}
</Droppable>
```

### Conditionally dropping

> Keep in mind that this is not supported at this time. In this current initial version we only support reordering within a single list.

- `Droppable`s can only be dropped on by `Draggable`s who share the same `type`. This is a simple way of allowing conditional dropping. If you do not provide a `type` for the `Droppable` then it will only accept `Draggable`s which also have the default type. `Draggable`s and `Droppable`s both will have their `types` set to `'DEFAULT'` when none is provided. There is currently no way to set multiple `types`, or a `type` wildcard that will accept `Draggable`s of multiple any types. This could be added if there is a valid use case.
- Using the `isDropDisabled` prop you can conditionally allow dropping. This allows you to do arbitrarily complex conditional transitions. This will only be considered if the `type` of the `Droppable` matches the `type` of the currently dragging `Draggable`.
- You can disable dropping on a `Droppable` altogether by always setting `isDropDisabled` to false. You can do this to create a list that is never able to be dropped on, but contains `Draggable`s.
- Technically you do not need to use `type` and do all of your conditional drop logic with the `isDropDisabled` function. The `type` parameter is a convenient shortcut for a common use case.

### Scroll containers

This library supports dragging within scroll containers (DOM elements that have `overflow: auto;` or `overflow: scroll;`). The **only** supported use cases are:

1. The `Droppable` can itself be a scroll container with **no scrollable parents**
2. The `Droppable` has **one scrollable parent**

**Auto scrolling is not provided**

Currently auto scrolling of scroll containers is not part of this library. Auto scrolling is where the container automatically scrolls to make room for the dragging item as you drag near the edge of a scroll container. You are welcome to build your own auto scrolling list, or if you would you really like it as part of this library we could provide a auto scrolling `Droppable`.

Users will be able to scroll a scroll container while dragging by using their trackpad or mouse wheel.

**Keyboard dragging limitation**

Getting keyboard dragging to work with scroll containers is quite difficult. Currently there is a limitation: you cannot drag with a keyboard beyond the visible edge of a scroll container. This limitation could be removed if we introduced auto scrolling.

## `Draggable`

`Draggable` components can be dragged around and dropped onto `Droppable`s. A `Draggable` must always be contained within a `Droppable`. It is **possible** to reorder a `Draggable` within its home `Droppable` or move to another `Droppable`. It is **possible** because a `Droppable` is free to control what it allows to be dropped on it.

> Note: moving between `Droppable`s is currently not supported in the initial version.

```js
import { Draggable } from 'react-beautiful-dnd';

<Draggable
  draggableId="draggable-1"
  type="PERSON"
>
  {(provided, snapshot) => (
    <div>
      <div
        ref={draggableProvided.innerRef}
        style={draggableProvided.draggableStyle}
        {...draggableProvided.dragHandleProps}
      >
        <h4>My draggable</h4>
      </div>
      {provided.placeholder}
    </div>
  )}
</Draggable>
```

> Note: when the library moves to React 16 this will be cleaned up a little bit as we will be able to return the placeholder as a sibling to your child function without you needing to create a wrapping element

### Props

- `draggableId`: A *required* `DraggableId(string)` that uniquely identifies the `Draggable` for the application. Please do not change this prop - especially during a drag.
- `type`: An *optional* type (`TypeId(string)`) of the `Draggable`. This is used to control what `Droppable`s the `Draggable` is permitted to drop on. `Draggable`s can only drop on `Droppable`s that share the same `type`. If no `type` is provided, it will be set to `'DEFAULT'`. Currently the `type` of a `Draggable` **must be** the same as its container `Droppable`. This restriction might be loosened in the future if there is a valid use case.
- `isDragDisabled`: An *optional* flag to control whether or not dropping is currently allowed on the `Droppable`. You can use this to implement your own conditional dropping logic. It will default to `false`.

### Children function

The React children of a `Draggable` must be a function that returns a `ReactElement`.

```js
<Draggable draggableId="draggable-1">
  {(provided, snapshot) => (
    <div>
      <div
        ref={provided.innerRef}
        style={provided.draggableStyle}
        {...provided.dragHandleProps}
      >
        Drag me!
      </div>
      {provided.placeholder}
    </div>
  )}
</Draggable>
```

The function is provided with two arguments:

**1. provided: (Provided)**

```js
type Provided = {|
  innerRef: (HTMLElement) => void,
  draggableStyle: ?DraggableStyle,
  dragHandleProps: ?DragHandleProvided,
  placeholder: ?ReactElement,
|}
```

Everything within the *provided* object must be applied for the `Draggable` to function correctly.

- `provided.innerRef (innerRef: (HTMLElement) => void)`: In order for the `Droppable` to function correctly, **you must** bind the `innerRef` function to the `ReactElement` that you want to be considered the `Draggable` node. We do this in order to avoid needing to use `ReactDOM` to look up your DOM node.

```js
<Draggable draggableId="draggable-1">
  {(provided, snapshot) => (
    <div ref={provided.innerRef}>
      Drag me!
    </div>
  )}
</Draggable>
```

**Type information**

```js
innerRef: (HTMLElement) => void
```

- `provided.draggableStyle (?DraggableStyle)`: This is an `Object` or `null` that contains an a number of styles that needs to be applied to the `Draggable`. This needs to be applied to the same node that you apply `provided.innerRef` to. The controls the movement of the draggable when it is dragging and not dragging. You are welcome to add your own styles to this object - but please do not remove or replace any of the properties.

**Ownership**

It is a contract of this library that it own the positioning logic of the dragging element. This includes properties such as `top`, `right`, `bottom`, `left` and `transform`. The library may change how it positions things and what properties it uses without performing a major version bump. It is also recommended that you do not apply your own `transition` property to the dragging element.

```js
<Draggable draggableId="draggable-1">
  {(provided, snapshot) => (
    <div>
      <div
        ref={provided.innerRef}
        style={provided.draggableStyle}
      >
        Drag me!
      </div>
    </div>
  )}
</Draggable>
```

**Extending with your own styles**

```js
<Draggable draggable="draggable-1">
  {(provided, snapshot) => {
    const style = {
      ...provided.draggableStyle,
      backgroundColor: snapshot.isDragging : 'blue' : 'white',
      fontSize: 18,
    }
    return (
      <div>
        <div
          ref={provided.innerRef}
          style={style}
        >
          Drag me!
        </div>
      </div>
    );
  }}
</Draggable>
```

**Type information**

```js
type DraggableStyle = DraggingStyle | NotDraggingStyle;

type DraggingStyle = {|
  position: 'fixed',
  boxSizing: 'border-box',
  // allow scrolling of the element behind the dragging element
  pointerEvents: 'none',
  zIndex: ZIndex,
  width: number,
  height: number,
  top: number,
  left: number,
  transform: ?string,
|}

type NotDraggingStyle = {|
  transition: ?string,
  transform: ?string,
  pointerEvents: 'none' | 'auto',
|}
```

- `provided.placeholder (?ReactElement)` The `Draggable` element has `position:fixed` applied to it while it is dragging. The role of the `placeholder` is to sit in the place that the `Draggable` was during a drag. It is needed to stop the `Droppable` list from collapsing when you drag. It is advised to render it as a sibling to the `Draggable` node. When the library moves to React 16 the `placeholder` will be removed from api.

```js
<Draggable draggableId="draggable-1">
  {(provided, snapshot) => (
    <div>
      <div
        ref={provided.innerRef}
        style={provided.draggableStyle}
      >
        Drag me!
      </div>
      {/* Always render me - I will be null if not required */}
      {provided.placeholder}
    </div>
  )}
</Draggable>
```

- `provided.dragHandleProps (?DragHandleProps)` every `Draggable` has a *drag handle*. This is what is used to drag the whole `Draggable`. Often this will be the same as the node as the `Draggable`, but sometimes it can be a child of the `Draggable`. `DragHandleProps` need to be applied to the node that you want to be the drag handle. This is a number of props that need to be applied to the `Draggable` node. The simpliest approach is to spread the props onto the draggable node (`{...provided.dragHandleProps}`). However, you are also welcome to [monkey patch](https://davidwalsh.name/monkey-patching) these props if you also need to respond to them. DragHandleProps will be `null` when `isDragDisabled` is set to `true`.

**Type information**

```js
type DragHandleProps = {|
  onMouseDown: (event: MouseEvent) => void,
  onKeyDown: (event: KeyboardEvent) => void,
  onClick: (event: MouseEvent) => void,
  tabIndex: number,
  'aria-grabbed': boolean,
  draggable: boolean,
  onDragStart: () => void,
  onDrop: () => void
|}
```

**Standard example**

```js
<Draggable draggableId="draggable-1">
  {(provided, snapshot) => (
    <div>
      <div
        ref={provided.innerRef}
        style={provided.draggableStyle}
        {...provided.dragHandleProps}
      >
        Drag me!
      </div>
      {provided.placeholder}
    </div>
  )}
</Draggable>
```

**Custom drag handle**

```js
<Draggable draggableId="draggable-1">
  {(provided, snapshot) => (
    <div>
      <div
        ref={provided.innerRef}
        style={provided.draggableStyle}
      >
        <h2>Hello there</h2>
        <div {...provided.dragHandleProps}>
          Drag handle
        </div>
      </div>
      {provided.placeholder}
    </div>
  )}
</Draggable>
```

**Monkey patching**

> If you want to also use one of the props in `DragHandleProps`

```js
const myOnClick = (event) => console.log('clicked on', event.target);

<Draggable draggableId="draggable-1">
  {(provided, snapshot) => {
    const onClick = (() => {
      // dragHandleProps might be null
      if(!provided.dragHandleProps) {
        return myOnClick;
      }

      // creating a new onClick function that calls my onClick
      // event as well as the provided one.
      return (event) => {
        provided.dragHandleProps.onClick(event);
        // You may want to check if event.defaultPrevented
        // is true and optionally fire your handler
        myOnClick(event);
      }
    })();

    return (
      <div>
        <div
          ref={provided.innerRef}
          style={provided.draggableStyle}
          {...provided.dragHandleProps}
          onClick={onClick}
        >
          Drag me!
        </div>
        {provided.placeholder}
      </div>
    );
  }}
</Draggable>
```

**2. snapshot: (StateSnapshot)**

```js
type StateSnapshot = {|
  isDragging: boolean,
|}
```

The `children` function is also provided with a small about of state relating to the current drag state. This can be optionally used to enhance your component. A common use case is changing the appearance of a `Draggable` while it is being dragged. Note: if you want to change the cursor to something like `grab` you will need to add the style to the body. (See `DragDropContext` > **style** above)

```js
<Draggable draggableId="draggable-1">
  {(provided, snapshot) => {
    const style = {
      ...provided.draggableStyle,
      backgroundColor: snapshot.isDragging ? 'blue' : 'grey',
    };

    return (
      <div>
        <div
          ref={provided.innerRef}
          style={style}
          {...provided.dragHandleProps}
        >
          Drag me!
        </div>
        {provided.placeholder}
      </div>
    );
  }}
</Draggable>
```

### Sloppy clicks and click blocking

A drag will not start until a user has dragged their mouse past a small threshold. If this threshold is not exceeded then the library will not impact the mouse click and will release the event to the browser.

When a user presses the mouse down on an element, we cannot determine if the user was clicking or dragging. If the sloppy click threshold was not exceeded then the event will be treated as if it where a click and the click event will bubble up unmodified. If the user has started dragging by moving the mouse beyond the sloppy click threshold then the click event will be prevented. This behavior allows you to wrap an element that has click behavior such as an anchor and have it work just like a standard anchor while also allowing it to be dragged.

### Focus management

react-beautiful-dnd does not create any wrapper elements. This means that it will not impact the usage tab flow of a document. For example, if you are wrapping an *anchor* tag then the user will tab to the anchor directly and not an element surrounding the *anchor*. Whatever element you wrap will be given a `tab-index` to ensure that users can tab to the element to perform keyboard dragging.

### Keyboard dragging 🎹

Traditionally drag and drop interactions have been exclusively a mouse or touch interaction. This library supports drag and drop interactions using only a keyboard. This enables power users to drive more of our interfaces with a keyboard. It also opens drag and drop interactions to those who previously would be unable to use them due to an impediment.

#### Shortcuts

Currently the keyboard handling is hard coded. This could be changed in the future to become customisable. Here is the existing keyboard mapping:

- **tab `↹`** - standard browser tabbing will navigate through the `Droppable`'s. The library does not do anything fancy with `tab` while users are selecting. Once a drag has started, `tab` is blocked for the duration of the drag.
- **spacebar ` `** - lift a focused `Draggable`. Also, drop a dragging `Draggable` where the drag was started with a `spacebar`.
- **Up arrow `↑`** - move a `Draggable` that is dragging up on a vertical list
- **Down arrow `↓`** - move a `Draggable` that is dragging down on a vertical list
- **Escape `esc`** - cancel an existing drag - regardless of whether the user is dragging with the keyboard or mouse.

#### Limitations of keyboard dragging

There is a currently limitation of keyboard dragging: **the drag will cancel if the user scrolls the window**. This could be worked around but for now it is the simpliest initial approach.

## Engineering health

### Typed

This codebase is typed with [flowtype](flowtype.org) to promote greater internal consistency and more resilient code.

### Tested

This code base employs a number of different testing strategies including unit, performance and integration tests. Testing various aspects of the system helps to promote its quality and stability.

While code coverage is [not a guarantee of code health](https://stackoverflow.com/a/90021/1374236), it is a good indicator. This code base currently sits at **~95% coverage**.

### Performance

This codebase is designed to be extremely performant - it is part of its DNA. It builds on prior investigations into React performance that you can read about [here](https://medium.com/@alexandereardon/performance-optimisations-for-react-applications-b453c597b191) and [here](https://medium.com/@alexandereardon/performance-optimisations-for-react-applications-round-2-2042e5c9af97). It is designed to perform the minimum number of renders required for each task.

**Highlights**

- using connected-components with memoization to ensure the only components that render are the ones that need to - thanks [react-redux](https://github.com/reactjs/react-redux), [reselect](https://github.com/reactjs/reselect) and [memoize-one](https://github.com/alexreardon/memoize-one)
- all movements are throttled with a [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) - thanks [raf-schd](https://github.com/alexreardon/raf-schd)
- memoization is used all over the place - thanks [memoize-one](https://github.com/alexreardon/memoize-one)
- conditionally disabling [`pointer-events`](https://developer.mozilla.org/en/docs/Web/CSS/pointer-events) on `Draggable`s while dragging to prevent the browser needing to do redundant work

| Minimal browser paints | Minimal React updates |
|------------------------|-----------------------|
|![minimal-browser-paints](https://github.com/alexreardon/files/blob/master/resources/dnd-browser-paint.gif?raw=true)|![minimal-react-updates](https://github.com/alexreardon/files/blob/master/resources/dnd-react-paint.gif?raw=true)|

## Author / maintainer

Alex Reardon - [@alexandereardon](https://twitter.com/alexandereardon) - areardon@atlassian.com