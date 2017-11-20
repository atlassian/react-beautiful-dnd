# react-beautiful-dnd

[![Greenkeeper badge](https://badges.greenkeeper.io/atlassian/react-beautiful-dnd.svg)](https://greenkeeper.io/)

Beautiful, accessible drag and drop for lists with [`React.js`](https://facebook.github.io/react/)

[![Build Status](https://travis-ci.org/atlassian/react-beautiful-dnd.svg?branch=master)](https://travis-ci.org/atlassian/react-beautiful-dnd) [![dependencies](https://david-dm.org/atlassian/react-beautiful-dnd.svg)](https://david-dm.org/atlassian/react-beautiful-dnd) [![SemVer](https://img.shields.io/badge/SemVer-2.0.0-brightgreen.svg)](http://semver.org/spec/v2.0.0.html)
[![npm](https://img.shields.io/npm/v/react-beautiful-dnd.svg)](https://www.npmjs.com/package/react-beautiful-dnd)

![example](https://raw.githubusercontent.com/alexreardon/files/master/resources/dnd.small.gif?raw=true)

## Examples 🎉

See how beautiful it is for yourself!

### Viewing on a desktop

[All the examples!](https://react-beautiful-dnd.netlify.com)

### Viewing on a mobile or tablet

- [Simple list](https://react-beautiful-dnd.netlify.com/iframe.html)
- [Board](https://react-beautiful-dnd.netlify.com/iframe.html?selectedKind=board&selectedStory=task%20board&full=0&down=1&left=1&panelRight=0&downPanel=storybook%2Factions%2Factions-panel) - best viewed in landscape

> We provide different links for touch devices as currently [storybook](https://github.com/storybooks/storybook) does not have a good mobile menu experience [more information](https://github.com/storybooks/storybook/issues/124)

## Core characteristics

- Beautiful, natural movement of items
- Clean and powerful api which is simple to get started with
- Plays extremely well with standard browser interactions
- Unopinionated styling
- No creation of additional wrapper dom nodes - flexbox and focus management friendly!

## Currently supported feature set

- Vertical lists ↕
- Horizontal lists ↔
- Movement between lists (▤ ↔ ▤)
- Mouse 🐭, keyboard 🎹 and touch 👉📱 (mobile, tablet and so on) support
- Conditional [dragging](https://github.com/atlassian/react-beautiful-dnd#props-1) and [dropping](https://github.com/atlassian/react-beautiful-dnd#conditionally-dropping)
- Multiple independent lists on the one page
- Independent nested lists - a list can be a child of another list, but you cannot drag items from the parent list into a child list
- Flexible item sizes - the draggable items can have different heights (vertical) or widths (horizontal))
- Custom drag handle - you can drag a whole item by just a part of it
- A droppable list can be a scroll container (without a scrollable parent) or be the child of a scroll container (that also does not have a scrollable parent)
- Server side rendering compatible

### Lots more coming soon

You can check out all the features that will be landing soon [on our issue page](https://github.com/atlassian/react-beautiful-dnd/issues).

## Not for everyone

There are a lot of libraries out there that allow for drag and drop interactions within React. Most notable of these is the amazing [`react-dnd`](https://github.com/react-dnd/react-dnd). It does an incredible job at providing a great set of drag and drop primitives which work especially well with the [wildly inconsistent](https://www.quirksmode.org/blog/archives/2009/09/the_html5_drag.html) html5 drag and drop feature. **`react-beautiful-dnd` is a higher level abstraction specifically built for vertical and horizontal lists**. Within that subset of functionality `react-beautiful-dnd` offers a powerful, natural and beautiful drag and drop experience. However, it does not provide the breadth of functionality offered by react-dnd. So this library might not be for you depending on what your use case is.

## Basic usage example

This is a simple reorderable list. [You can play with it on webpackbin](https://www.webpackbin.com/bins/-Kr9aE9jnUeWlphY8wsw)

![basic example](https://github.com/alexreardon/files/blob/master/resources/dnd-basic-example-small.gif?raw=true)

```js
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// fake data generator
const getItems = count =>
  Array.from({ length: count }, (v, k) => k).map(k => ({
    id: `item-${k}`,
    content: `item ${k}`,
  }));

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
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
  margin: `0 0 ${grid}px 0`,

  // change background colour if dragging
  background: isDragging ? 'lightgreen' : 'grey',

  // styles we need to apply on draggables
  ...draggableStyle,
});
const getListStyle = isDraggingOver => ({
  background: isDraggingOver ? 'lightblue' : 'lightgrey',
  padding: grid,
  width: 250,
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: getItems(10),
    };
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  onDragEnd(result) {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = reorder(
      this.state.items,
      result.source.index,
      result.destination.index
    );

    this.setState({
      items,
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
                <Draggable key={item.id} draggableId={item.id}>
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
              {provided.placeholder}
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

## Driving philosophy: physicality

The core design idea of `react-beautiful-dnd` is physicality: we want users to feel like they are moving physical objects around

### Application 1: no instant movement

It is a fairly standard drag and drop pattern for things to disappear and reappear in response to the users drag. For a more natural drag we animate the movement of items as they need to move out of the way while dragging to more clearly show a drags effect. We also animate the drop of an item so that it animates into its new home position. At no point is an item instantly moved anywhere — regardless of whether it is dragging or not.

### Application 2: knowing when to move

It is quite common for drag and drop interactions to be based on the position that user started the drag from.

In `react-beautiful-dnd` a dragging items impact is based on its centre of gravity — regardless of where a user grabs an item from. A dragging items impact follows similar rules to a set of scales ⚖️. Here are some rules that are followed to allow for a natural drag experience even with items of flexible height:

- A list is *dragged over* when the centre position of a dragging item goes over one of the boundaries of the list
- A resting drag item will move out of the way of a dragging item when the centre position of the dragging item goes over the edge of the resting item. Put another way: once the centre position of an item (A) goes over the edge of another item (B), B moves out of the way.

### Application 3: no drop shadows

Drop shadows are useful in an environment where items and their destinations snap around. However, with `react-beautiful-dnd` it should be obvious where things will be dropping based on the movement of items. This might be changed in the future - but the experiment is to see how far we can get without any of these affordances.

### Application 4: maximise interactivity

`react-beautiful-dnd` works really hard to avoid as many periods of non-interactivity as possible. The user should feel like they are in control of the interface and not waiting for an animation to finish before they can continue to interact with the interface. However, there is a balance that needs to be made between correctness and power in order to make everybody's lives more sane. Here are the only situations where some things are not interactive:

1. From when a user cancels a drag to when the drop animation completes. On cancel there are lots of things moving back to where they should be. If you grab an item in a location that is not its true home then the following drag will be incorrect.
2. Starting a drag on an item that is animating its own drop. For simplicity this is the case - it is actually quite hard to grab something while it is animating home. It could be coded around - but it seems like an edge case that would add a lot of complexity.

Keep in mind that these periods of inactivity may not always exist.

### Application 5: no drag axis locking

For now, the library does not support drag axis locking (aka drag rails). This is where the user is restricted to only dragging along one axis. The current thinking is this breaks the physical metaphore we are going for and sends a message to the user that they are interacting with a piece of software rather than moving physical objects around. It is possible to ensure that a user can only drop in a single list by using props `type` and `isDropEnabled`. You can also do some visual treatment to the list `onDragStart` to show the user that this is the only place they can interact with.

### Application 6: natural cross list movement

Rather than using an index based approach for keyboard movement between lists, `react-beautiful-dnd` performs cross list movement based on **inertia, gravity and collisions**. You can find out more about how this works by reading the blog ["Natural keyboard movement between lists"](https://medium.com/@alexandereardon/friction-gravity-and-collisions-3adac3a94e19).

![example](https://raw.githubusercontent.com/alexreardon/files/master/resources/collision.gif?raw=true)

## Carefully designed animations

With things moving a lot it would be easy for the user to become distracted by the animations or for them to get in the way. We have tweaked the various animations to ensure the right balance of guidance, performance and interactivity.

### Dropping

When you drop a dragging item its movement is based on physics (thanks [`react-motion`](https://github.com/chenglou/react-motion)). This results in the drop feeling more weighted and physical.

### Moving out of the way

Items that are moving out of the way of a dragging item do so with a CSS transition rather than physics. This is to maximise performance by allowing the GPU to handle the movement. The CSS animation curve has been designed to communicate getting out of the way.

How it is composed:

1. A warm up period to mimic a natural response time
2. A small phase to quickly move out of the way
3. A long tail so that people can read any text that is being animated in the second half of the animation

![animation curve](https://raw.githubusercontent.com/alexreardon/files/master/resources/dnd-ease-in-out-small.png?raw=true)
> animation curve used when moving out of the way

## Caring about the interaction details

### Focus management

`react-beautiful-dnd` does not create any wrapper elements. This means that it will not impact the usual tab flow of a document. For example, if you are wrapping an *anchor* tag then the user will tab to the anchor directly and not an element surrounding the *anchor*. Whatever element you wrap will be given a `tab-index` to ensure that users can tab to the element to perform keyboard dragging.

### Accessibility

Traditionally drag and drop interactions have been exclusively a mouse or touch interaction. This library ships with support for drag and drop interactions **using only a keyboard**. This enables power users to drive their experience entirely from the keyboard. As well as opening up these experiences to users who would have been excluded previously.

In addition to supporting keyboard, we have also audited how the keyboard shortcuts interact with standard browser keyboard interactions. When the user is not dragging they can use their keyboard as they normally would. While dragging we override and disable certain browser shortcuts (such as `tab`) to ensure a fluid experience for the user.

## Mouse dragging

### Sloppy clicks and click blocking 🐱🎁

When a user presses the mouse down on an element, we cannot determine if the user was clicking or dragging. Also, sometimes when a user clicks they can move the cursor slightly — a sloppy click. So we only start a drag once the user has moved beyond a certain distance with the mouse down (the drag threshold) — more than they would if they where just making a sloppy click. If the drag threshold is not exceeded then the user interaction behaves just like a regular click. If the drag threshold is exceeded then the interaction will be classified as a drag and the standard click action will not occur.

This allows consumers to wrap interactive elements such as an anchor and have it be both a standard anchor as well as a draggable item in a natural way.

(🐱🎁 is a [schrodinger's cat](https://www.youtube.com/watch?v=IOYyCHGWJq4) joke)

### Keyboard shortcuts: mouse dragging

When a drag **is not occurring** `react-beautiful-dnd` does not impact any of the standard keyboard interactions (it has no listeners bound).

When a drag **is occurring** with a *mouse* the user is able to execute the following keyboard shortcuts:

- **escape** <kbd>esc</kbd> - cancel the drag

During a mouse drag the following standard keyboard events are blocked to prevent a bad experience:

- **tab** <kbd>tab ↹</kbd> - blocking tabbing
- **enter** <kbd>⏎</kbd> - blocking submission

Other than these explicitly blocked keyboard events all standard keyboard events should work as expected.

## Keyboard dragging

`react-beautiful-dnd` supports dragging with only a keyboard

### Keyboard shortcuts: keyboard dragging

When a drag is not occurring, key the user will be able to navigation through the `Draggable`'s on a page using the standard **tab** <kbd>tab ↹</kbd> key to move forward through the tabbable elements and (**shift** + **tab**) (<kbd>shift</kbd> + )<kbd>tab ↹</kbd>) to move backwards. We achieve this by adding a `tab-index` to the `Draggable`. When a `Draggable` has focus the **spacebar** <kbd>space</kbd> will **lift** a `Draggable`. This will start the drag.

Once a drag is started the following keyboard shortcuts can be used:

- **spacebar** <kbd>space</kbd> - drop the `Draggable`
- **escape** <kbd>esc</kbd> - cancel the drag

The following commands are also available but they depend on the `type` of `Droppable` that the `Draggable` is *currently* in:

#### Within a vertical list

- **Up arrow** <kbd>↑</kbd> - move a `Draggable` upwards in a `Droppable`
- **Down arrow** <kbd>↓</kbd> - move a `Draggable` downwards in a `Droppable`
- **Right arrow** <kbd>→</kbd> - move a `Draggable` to a `Droppable` to the *right* of the current `Droppable` (move to new list)
- **Left arrow** <kbd>←</kbd> - move a `Draggable` to a `Droppable` to the *left* of the current `Droppable` (move to new list)

#### Within a horizontal list

- **Up arrow** <kbd>↑</kbd> - move a `Draggable` to a `Droppable` to *above* the current `Droppable` (move to new list)
- **Down arrow** <kbd>↓</kbd> - move a `Draggable` to a `Droppable` to *below* the current `Droppable` (move to new list)
- **Right arrow** <kbd>→</kbd> - move a `Draggable` to the *right* in the current `Droppable`
- **Left arrow** <kbd>←</kbd> - move a `Draggable` to the *left* in the current `Droppable`

During a drag the following standard keyboard events are blocked to prevent a bad experience:

- **tab** <kbd>tab ↹</kbd> - blocking tabbing
- **enter** <kbd>⏎</kbd> - blocking submission

### Limitations of keyboard dragging

There is current limitation of keyboard dragging: **the drag will cancel if the user scrolls the window**. This could be worked around but for now it is the simpliest initial approach.

## Touch dragging

`react-beautiful-dnd` supports dragging on touch devices such as mobiles and tablets.

![Mobile landscape](https://github.com/alexreardon/files/blob/master/resources/iphone-landscape.gif?raw=true)

> Recorded on iPhone 6s

### Starting a drag

A user can start a drag by:

1. Holding their finger 👇 on an element for a small period of time 🕑 (long press); OR
2. Moving an element beyond a small distance threshold

### Understanding intention: tap, force press, scroll and drag

When a user presses their finger (or other input) on a `Draggable` we are not sure if they where intending to *tap*, *force press*, *scroll the container* or *drag*. **As much as possible `react-beautiful-dnd` aims to ensure that a users default interaction experience remains unaffected**.

#### Tap support

If the user lifts their finger before the timer is finished then we release the event to the browser for it to determine whether to perform the standard tap / click action. This allows you to have a `Draggable` that is both clickable such as a anchor as well as draggable.

#### Opting out of native scrolling

When the user first puts their finger down we are not sure if they were attempting to scroll. However, when they first put their finger down we have a one time opportunity to opt out of native scrolling. You cannot opt back into native scrolling or out of native scrolling from this point. The primary reason we need to opt out of native scrolling is that the scroll of the page would cancel out the impact of a users reorder action. Scrolling while dragging will be supported when we add the [auto scrolling feature](https://github.com/atlassian/react-beautiful-dnd/issues/27)

| Native scrolling                | Reordering                      |
|---------------------------------|---------------------------------|
| Moving up moves the **page** up | Moving up moves the **item** up |
|![native scrolling](https://github.com/alexreardon/files/blob/master/resources/native-scroll.gif?raw=true)|![reordering](https://github.com/alexreardon/files/blob/master/resources/no-scroll-reorder.gif?raw=true)|

When a user moves an item up we need the item to move up in the list and not for the viewport or container to scroll up also. If we did not disable native scrolling the user would not be able to reorder items.

The library needs to opt out of native scrolling for reordering, however we recommend that you allow some ability for the user to scroll without reordering. This can be done through a variety of means including:

- Not making `Draggable`s the full width of the viewport so they can scroll on the side of it
- Use a *drag handle* so that only part of the `Draggable` is reserved for dragging

#### Force press support

> Safari only

If the user force presses on the element before they have moved the element (even if a drag has already started) then the drag is cancelled and the standard force press action occurs. For an anchor this is a website preview.

### Preset styles

We add the following styles to `Draggable`s by default to provide a more consistent touch dragging experience across various browsers out of the box. They have no visual impact. You are welcome to change these values or disable them for your specific use cases if you need to.

Avoid the *pull to refresh action* and *anchor focus* on Android Chrome

```css
touch-action: none;
```

A long press on anchors usually pops a content menu that has options for the link such as 'Open in new tab'. Because long press is used to start a drag we need to opt out of this behavior

```css
-webkit-touch-callout: none;
```

Webkit based browsers add a grey overlay to anchors when they are active. We remove this tap overlay as it is confusing for users. [more information](https://css-tricks.com/snippets/css/remove-gray-highlight-when-tapping-links-in-mobile-safari/).

```css
-webkit-tap-highlight-color: rgba(0,0,0,0);
```

### Vibration

> This is merely a suggestion - it is up to you to add this if you want this behavior.

If you like you could also trigger a [vibration event](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) when the user picks up a `Draggable`. This can provide tactile feedback that the user is doing something. It currently is only supported in Chrome on Android.

```js
class App extends React.Component {
  onDragStart = () => {
    // good times
    if (window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }
  };
  /*...*/
}
```

## Installation

```bash
# yarn
yarn add react-beautiful-dnd

# npm
npm install react-beautiful-dnd --save
```

## API

So how do you use the library?

## `DragDropContext`

In order to use drag and drop, you need to have the part of your `React` tree that you want to be able to use drag and drop in wrapped in a `DragDropContext`. It is advised to just wrap your entire application in a `DragDropContext`. Having nested `DragDropContext`'s is *not* supported. You will be able to achieve your desired conditional dragging and dropping using the props of `Droppable` and `Draggable`. You can think of `DragDropContext` as having a similar purpose to the [react-redux Provider component](https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store)

### Prop type information

```js
type Hooks = {|
  onDragStart?: (initial: DragStart) => void,
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
  onDragStart = () => {
    /*...*/
  };
  onDragEnd = () => {
    /*...*/
  };

  render() {
    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <div>Hello world</div>
      </DragDropContext>
    );
  }
}
```

### `Hook`s

These are top level application events that you can use to perform your own state updates.


### `onDragStart` (optional)

This function will get notified when a drag starts. You are provided with the following details:

### `initial: DragStart`

- `initial.draggableId`: the id of the `Draggable` that is now dragging
- `initial.type`: the `type` of the `Draggable` that is now dragging
- `initial.source`: the location (`droppableId` and `index`) of where the dragging item has started within a `Droppable`.

This function is *optional* and therefore does not need to be provided. It is **highly recommended** that you use this function to block updates to all `Draggable` and `Droppable` components during a drag. (See [*Best practices for `hooks` *](https://github.com/atlassian/react-beautiful-dnd#best-practices-for-hooks))

**Type information**

```js
onDragStart?: (initial: DragStart) => void

// supporting types
type DragStart = {|
  draggableId: DraggableId,
  type: TypeId,
  source: DraggableLocation,
|}

type DraggableLocation = {|
  droppableId: DroppableId,
  // the position of the draggable within a droppable
  index: number
|};
type Id = string;
type DraggableId = Id;
type DroppableId = Id;
type TypeId = Id;
```

### `onDragEnd` (required)

This function is *extremely* important and has an critical role to play in the application lifecycle. **This function must result in the *synchronous* reordering of a list of `Draggables`**

It is provided with all the information about a drag:

### `result: DropResult`

- `result.draggableId`: the id of the `Draggable` that was dragging.
- `result.type`: the `type` of the `Draggable` that was dragging.
- `result.source`: the location where the `Draggable` started.
- `result.destination`: the location where the `Draggable` finished. The `destination` will be `null` if the user dropped into no position (such as outside any list) *or* if they dropped the `Draggable` back into the same position in which it started.

### Synchronous reordering

Because this library does not control your state, it is up to you to *synchronously* reorder your lists based on the `result`.

*Here is what you need to do:*
- if the `destination` is `null`: all done!
- if `source.droppableId` equals `destination.droppableId` you need to remove the item from your list and insert it at the correct position.
- if `source.droppableId` does not equal `destination.droppableId`, then you need to remove the `Draggable` from the `source.droppableId` list and add it into the correct position of the `destination.droppableId` list.

### Persisting a reorder

If you need to persist a reorder to a remote data store - update the list synchronously on the client and fire off a request in the background to persist the change. If the remote save fails it is up to you how to communicate that to the user and update, or not update, the list.

### Type information

```js
onDragEnd: (result: DropResult) => void

// supporting types
type DropResult = {|
  draggableId: DraggableId,
  type: TypeId,
  source: DraggableLocation,
  // may not have any destination (drag to nowhere)
  destination: ?DraggableLocation
|}

type Id = string;
type DroppableId = Id;
type DraggableId = Id;
type TypeId = Id;
type DraggableLocation = {|
  droppableId: DroppableId,
  // the position of the droppable within a droppable
  index: number
|};
```

### Best practices for `hooks`

#### Block updates during a drag

It is **highly** recommended that while a user is dragging that you block any state updates that might impact the amount of `Draggable`s and `Droppable`s, or their dimensions. Please listen to `onDragStart` and block updates to the `Draggable`s and `Droppable`s until you receive at `onDragEnd`.

When the user starts dragging we take a snapshot of all of the dimensions of the applicable `Draggable` and `Droppable` nodes. If these change during a drag we will not know about it.

Here are a few poor user experiences that can occur if you change things *during a drag*:

- If you increase the amount of nodes, then the library will not know about them and they will not be moved when the user would expect them to be.
- If you decrease the amount of nodes, then there might be gaps and unexpected movements in your lists.
- If you change the dimensions of any node, then it can cause the changed node as well as others to move at incorrect times.
- If you remove the node that the user is dragging, then the drag will instantly end
- If you change the dimension of the dragging node, then other things will not move out of the way at the correct time.

#### Add a cursor style and block selection

During a drag it is recommended that you add two styles to the body:

1. `user-select: none;` and
2. `cursor: grab;` (or whatever cursor you want to use while dragging)

`user-select: none;` prevents the user drag from selecting text on the page as they drag.

`cursor: [your desired cursor];` is needed because we apply `pointer-events: none;` to the dragging item. This prevents you setting your own cursor style on the Draggable directly based on `snapshot.isDragging` (see [`Draggable`](https://github.com/atlassian/react-beautiful-dnd#draggable)).

#### Force focus after a transition between lists

When an item is moved from one list to a different list, it loses browser focus if it had it. This is because `React` creates a new node in this situation. It will not lose focus if transitioned within the same list. The dragging item will always have had browser focus if it is dragging with a keyboard. It is highly recommended that you give the item (which is now in a different list) focus again. You can see an example of how to do this in our stories. Here is an example of how you could do it:

- `onDragEnd`: move the item into the new list and record the id of the item that has moved
- When rendering the reordered list, pass down a prop which will tell the newly moved item to obtain focus
- In the `componentDidMount` lifecycle call back check if the item needs to gain focus based on its props (such as an `autoFocus` prop)
- If focus is required - call `.focus` on the node. You can obtain the node by using `ReactDOM.findDOMNode` or monkey patching the `provided.innerRef` callback.

### Other `hooks` information

**`onDragStart` and `onDragEnd` pairing**

We try very hard to ensure that each `onDragStart` event is paired with a single `onDragEnd` event. However, there maybe a rogue situation where this is not the case. If that occurs - it is a bug. Currently there is no mechanism to tell the library to cancel a current drag externally.

## `Droppable`

`Droppable` components can be **dropped on by a `Draggable`**. They also **contain** `Draggable`s. A `Draggable` must be contained within a `Droppable`.

```js
import { Droppable } from 'react-beautiful-dnd';

<Droppable droppableId="droppable-1" type="PERSON">
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      style={{ backgroundColor: snapshot.isDraggingOver ? 'blue' : 'grey' }}
    >
      <h2>I am a droppable!</h2>
      {provided.placeholder}
    </div>
  )}
</Droppable>;
```

### Props

- `droppableId`: A *required* `DroppableId(string)` that uniquely identifies the droppable for the application. Please do not change this prop - especially during a drag.
- `type`: An *optional* `TypeId(string)` that can be used to simply accept a class of `Draggable`. For example, if you use the type `PERSON` then it will only allow `Draggable`s of type `PERSON` to be dropped on itself. `Draggable`s of type `TASK` would not be able to be dropped on a `Droppable` with type `PERSON`. If no `type` is provided, it will be set to `'DEFAULT'`. Currently the `type` of the `Draggable`s within a `Droppable` **must be** the same. This restriction might be loosened in the future if there is a valid use case.
- `isDropDisabled`: An *optional* flag to control whether or not dropping is currently allowed on the `Droppable`. You can use this to implement your own conditional dropping logic. It will default to `false`.
- `direction`: The direction in which items flow in this droppable. Options are `vertical` (default) and `horizontal`.
- `ignoreContainerClipping`: When a `Droppable` is inside a scrollable container its area is constrained so that you can only drop on the part of the `Droppable` that you can see. Setting this prop opts out of this behavior, allowing you to drop anywhere on a `Droppable` even if it's visually hidden by a scrollable parent. The default behavior is suitable for most cases so odds are you'll never need to use this prop, but it can be useful if you've got very long `Draggable`s inside a short scroll container. Keep in mind that it might cause some unexpected behavior if you have multiple `Droppable`s inside scroll containers on the same page.

### Children function

The `React` children of a `Droppable` must be a function that returns a `ReactElement`.

```js
<Droppable droppableId="droppable-1">
  {(provided, snapshot) => ({
    /*...*/
  })}
</Droppable>;
```

The function is provided with two arguments:

#### 1. provided: (DroppableProvided)**

```js
type DroppableProvided = {|
  innerRef: (?HTMLElement) => void,
  placeholder: ?ReactElement,
|}
```

- `provided.innerRef`: In order for the droppable to function correctly, **you must** bind the `provided.innerRef` to the highest possible DOM node in the `ReactElement`. We do this in order to avoid needing to use `ReactDOM` to look up your DOM node.

- `provided.placeholder`: This is used to create space in the `Droppable` as needed during a drag. This space is needed when a user is dragging over a list that is not the home list. Please be sure to put the placeholder inside of the component for which you have provided the ref. We need to increase the side of the `Droppable` itself. This is different from `Draggable` where the `placeholder` needs to be a *sibling* to the draggable node.

```js
<Droppable droppableId="droppable-1">
  {(provided, snapshot) => (
    <div ref={provided.innerRef}>
      Good to go

      {provided.placeholder}
    </div>
  )}
</Droppable>;
```

#### 2. snapshot: (DroppableStateSnapshot)**

```js
type DroppableStateSnapshot = {|
  isDraggingOver: boolean,
|};
```

The `children` function is also provided with a small amount of state relating to the current drag state. This can be optionally used to enhance your component. A common use case is changing the appearance of a `Droppable` while it is being dragged over.

```js
<Droppable droppableId="droppable-1">
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      style={{ backgroundColor: snapshot.isDraggingOver ? 'blue' : 'grey' }}
    >
      I am a droppable!

      {provided.placeholder}
    </div>
  )}
</Droppable>;
```

### Conditionally dropping

- `Droppable`s can only be dropped on by `Draggable`s who share the same `type`. This is a simple way of allowing conditional dropping. If you do not provide a `type` for the `Droppable`, then it will only accept `Draggable`s which also have the default type. `Draggable`s and `Droppable`s both will have their `types` set to `'DEFAULT'` when none is provided. There is currently no way to set multiple `types`, or a `type` wildcard that will accept `Draggable`s of multiple any types. This could be added if there is a valid use case.
- Using the `isDropDisabled` prop you can conditionally allow dropping. This allows you to do arbitrarily complex conditional transitions. This will only be considered if the `type` of the `Droppable` matches the `type` of the currently dragging `Draggable`.
- You can disable dropping on a `Droppable` altogether by always setting `isDropDisabled` to false. You can do this to create a list that is never able to be dropped on, but contains `Draggable`s.
- Technically you do not need to use `type` and do all of your conditional drop logic with the `isDropDisabled` function. The `type` parameter is a convenient shortcut for a common use case.

### Scroll containers

This library supports dragging within scroll containers (DOM elements that have `overflow: auto;` or `overflow: scroll;`). The **only** supported use cases are:

1. The `Droppable` can itself be a scroll container with **no scrollable parents**
2. The `Droppable` has **one scrollable parent**

**Auto scrolling is not provided (yet!)**

Currently auto scrolling of scroll containers is not part of this library. Auto scrolling is where the container automatically scrolls to make room for the dragging item as you drag near the edge of a scroll container. You are welcome to build your own auto scrolling list, or if you would you really like it as part of this library we could provide a auto scrolling `Droppable`.

Users will be able to scroll a scroll container while dragging by using their trackpad or mouse wheel.

**Keyboard dragging limitation**

Getting keyboard dragging to work with scroll containers is quite difficult. Currently there is a limitation: you cannot drag with a keyboard beyond the visible edge of a scroll container. This limitation could be removed if we introduced auto scrolling. Scrolling a container with a mouse during a keyboard drag will cancel the drag.

## `Draggable`

`Draggable` components can be dragged around and dropped onto `Droppable`s. A `Draggable` must always be contained within a `Droppable`. It is **possible** to reorder a `Draggable` within its home `Droppable` or move to another `Droppable`. It is **possible** because a `Droppable` is free to control what it allows to be dropped on it.

```js
import { Draggable } from 'react-beautiful-dnd';

<Draggable draggableId="draggable-1" type="PERSON">
  {(provided, snapshot) => (
    <div>
      <div
        ref={provided.innerRef}
        style={provided.draggableStyle}
        {...provided.dragHandleProps}
      >
        <h4>My draggable</h4>
      </div>
      {provided.placeholder}
    </div>
  )}
</Draggable>;
```

> Note: when the library moves to React 16 this will be cleaned up a little bit as we will be able to return the placeholder as a sibling to your child function without you needing to create a wrapping element

### Props

- `draggableId`: A *required* `DraggableId(string)` that uniquely identifies the `Draggable` for the application. Please do not change this prop - especially during a drag.
- `type`: An *optional* type (`TypeId(string)`) of the `Draggable`. This is used to control what `Droppable`s the `Draggable` is permitted to drop on. `Draggable`s can only drop on `Droppable`s that share the same `type`. If no `type` is provided, then it will be set to `'DEFAULT'`. Currently the `type` of a `Draggable` **must be** the same as its container `Droppable`. This restriction might be loosened in the future if there is a valid use case.
- `isDragDisabled`: An *optional* flag to control whether or not the `Draggable` is permitted to drag. You can use this to implement your own conditional drag logic. It will default to `false`.

### Children function

The `React` children of a `Draggable` must be a function that returns a `ReactElement`.

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
</Draggable>;
```

The function is provided with two arguments:

#### 1. provided: (DraggableProvided)**

```js
type DraggableProvided = {|
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
  {(provided, snapshot) => <div ref={provided.innerRef}>Drag me!</div>}
</Draggable>;
```

**Type information**

```js
innerRef: (HTMLElement) => void
```

- `provided.draggableStyle (?DraggableStyle)`: This is an `Object` or `null` that contains an a number of styles that needs to be applied to the `Draggable`. This needs to be applied to the same node that you apply `provided.innerRef` to. This controls the movement of the draggable when it is dragging and not dragging. You are welcome to add your own styles to this object – but please do not remove or replace any of the properties.

**Ownership**

It is a contract of this library that it owns the positioning logic of the dragging element. This includes properties such as `top`, `right`, `bottom`, `left` and `transform`. The library may change how it positions things and which properties it uses without performing a major version bump. It is also recommended that you do not apply your own `transition` property to the dragging element.

**Warning: `position: fixed`**

`react-beautiful-dnd` uses `position: fixed` to position the dragging element. This is quite robust and allows for you to have `position: relative | absolute | fixed` parents. However, unfortunately `position:fixed` is [impacted by `transform`](http://meyerweb.com/eric/thoughts/2011/09/12/un-fixing-fixed-elements-with-css-transforms/) (such as `transform: rotate(10deg);`). This means that if you have a `transform: *` on one of the parents of a `Draggable` then the positioning logic will be incorrect while dragging. Lame! For most consumers this will not be an issue. We may look into creating a portal solution where we attach the dragging element to the body rather than leave it in place. However, leaving it in place is a really nice experience for everyone. For now we will leave it as is, but feel free to raise an issue if you this is important to you.

**Usage of `draggableStyle`**

```js
<Draggable draggableId="draggable-1">
  {(provided, snapshot) => (
    <div>
      <div ref={provided.innerRef} style={provided.draggableStyle}>
        Drag me!
      </div>
    </div>
  )}
</Draggable>;
```

**Extending with your own styles**

```js
<Draggable draggable="draggable-1">
  {(provided, snapshot) => {
    const style = {
      ...provided.draggableStyle,
      backgroundColor: snapshot.isDragging ? 'blue' : 'white',
      fontSize: 18,
    };
    return (
      <div>
        <div ref={provided.innerRef} style={style}>
          Drag me!
        </div>
      </div>
    );
  }}
</Draggable>;
```

**Type information**

```js
type DraggableStyle = DraggingStyle | NotDraggingStyle;

// These styles are applied by default to allow for a
// better touch device drag and drop experience.
// Users can opt out of these styles or change them if
// they really need too for their specific use case.
type BaseStyle = {|
  // Disable standard long press action
  WebkitTouchCallout: 'none',

  // Disable grey overlay on active anchors
  WebkitTapHighlightColor: 'rgba(0,0,0,0)',

  // Avoid pull to refresh action and anchor focus on Android Chrome
  touchAction: 'none',
|}

type DraggingStyle = {|
  ...BaseStyle,
  pointerEvents: 'none',
  position: 'fixed',
  width: number,
  height: number,
  boxSizing: 'border-box',
  top: number,
  left: number,
  margin: 0,
  transform: ?string,
  zIndex: ZIndex,
|}

type NotDraggingStyle = {|
  ...BaseStyle,
  transition: ?string,
  transform: ?string,
  pointerEvents: 'none' | 'auto',
|};
```

- `provided.placeholder (?ReactElement)` The `Draggable` element has `position: fixed` applied to it while it is dragging. The role of the `placeholder` is to sit in the place that the `Draggable` was during a drag. It is needed to stop the `Droppable` list from collapsing when you drag. It is advised to render it as a sibling to the `Draggable` node. This is unlike `Droppable` where the `placeholder` needs to be *within* the `Droppable` node. When the library moves to `React` 16 the `placeholder` will be removed from api.

```js
<Draggable draggableId="draggable-1">
  {(provided, snapshot) => (
    <div>
      <div ref={provided.innerRef} style={provided.draggableStyle}>
        Drag me!
      </div>
      {/* Always render me - I will be null if not required */}
      {provided.placeholder}
    </div>
  )}
</Draggable>;
```

- `provided.dragHandleProps (?DragHandleProps)` every `Draggable` has a *drag handle*. This is what is used to drag the whole `Draggable`. Often this will be the same node as the `Draggable`, but sometimes it can be a child of the `Draggable`. `DragHandleProps` need to be applied to the node that you want to be the drag handle. This is a number of props that need to be applied to the `Draggable` node. The simplest approach is to spread the props onto the draggable node (`{...provided.dragHandleProps}`). However, you are also welcome to [monkey patch](https://davidwalsh.name/monkey-patching) these props if you also need to respond to them. DragHandleProps will be `null` when `isDragDisabled` is set to `true`.

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
  onDrop: () => void,
|};
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
</Draggable>;
```

**Custom drag handle**

```js
<Draggable draggableId="draggable-1">
  {(provided, snapshot) => (
    <div>
      <div ref={provided.innerRef} style={provided.draggableStyle}>
        <h2>Hello there</h2>
        <div {...provided.dragHandleProps}>Drag handle</div>
      </div>
      {provided.placeholder}
    </div>
  )}
</Draggable>;
```

**Monkey patching**

> If you want to also use one of the props in `DragHandleProps`

```js
const myOnClick = event => console.log('clicked on', event.target);

<Draggable draggableId="draggable-1">
  {(provided, snapshot) => {
    const onClick = (() => {
      // dragHandleProps might be null
      if (!provided.dragHandleProps) {
        return myOnClick;
      }

      // creating a new onClick function that calls my onClick
      // event as well as the provided one.
      return event => {
        provided.dragHandleProps.onClick(event);
        // You may want to check if event.defaultPrevented
        // is true and optionally fire your handler
        myOnClick(event);
      };
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
</Draggable>;
```

#### 2. snapshot: (DraggableStateSnapshot)**

```js
type DraggableStateSnapshot = {|
  isDragging: boolean,
|};
```

The `children` function is also provided with a small amount of state relating to the current drag state. This can be optionally used to enhance your component. A common use case is changing the appearance of a `Draggable` while it is being dragged. Note: if you want to change the cursor to something like `grab` you will need to add the style to the body. (See `DragDropContext` > **style** above)

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
</Draggable>;
```

### Interactive child elements within a `Draggable`

It is possible for your `Draggable` to be an interactive element such as a `<button>` or an `<a>`. However, there may be a situation where you want your `Draggable` element be the parent of an interactive element such as a `<button>` or an `<input>`. By default the child interactive element **will not be interactive**. Interacting with these nested interactive elements will be used as part of the calculation to start a drag. This is because we call `event.preventDefault()` on the `mousedown` event for the `Draggable`. Calling `preventDefault` will prevent the nested interactive element from performing its standard actions and interactions. What you will need to do is *opt out* of our standard calling of `event.preventDefault()`. By doing this the nested interactive element will not be able to be used to start a drag - but will allow the user to interact with it directly. Keep in mind - that by doing this the user will not be able to drag the `Draggable` by dragging on the interactive child element - which is probably what you want anyway. There are a few ways you can get around the standard `preventDefault` behavior. Here are some suggestions:

**1. Call `event.stopPropagation()` on the interactive element `mousedown`**
*This is the simpler solution*

On the child element, call `event.stopPropagation()` for the `onMouseDown` function. This will stop the event bubbling up to the `Draggable` and having `event.preventDefault()` called on it. The `Draggable` will not be aware that a `mousedown` has even occurred.

```js
<input
  // stop event from bubbling up to Draggable where it will be prevented
  onMouseDown={e => e.stopPropagation()}
/>
```

**2. Patch the `onMouseDown` event in `provided`**
*This is the more complex solution*

If you cannot use the first solution, then you can consider patching the `provided` > `onMouseDown` function. The main idea of this approach is to add additional behavior to the existing `onMouseDown` function - only calling it when it should be called.

```js
class DraggableWithSelect extends Component {

  renderSelect = (provided) => {
    // Patched onMouseDown handler
    const onMouseDown = (event) => {
      // If mouse down is on a select, then do not
      // let react-beautiful-dnd do anything with it
      if(event.target.nodeName === 'SELECT') {
        return;
      }
      provided.dragHandleProps.onMouseDown(event);
    }

    // patching drag handle props
    const patched = {
      ...provided.dragHandleProps,
      onMouseDown,
    }

    return (
      <div>
        <div
          ref={provided.innerRef}
          style={getItemStyle(
            provided.draggableStyle,
            snapshot.isDragging
          )}
          {...patched}
        >
          <select>
            <option>One</option>
            <option>Two</option>
            <option>Three</option>
          </select>
        </div>
        {provided.placeholder}
      </div>
    );
  }

  render() {
    return (
      <Draggable draggableId="draggable-1">
        {this.renderSelect}
      </Draggable>
    );
  }
}
```

**3. Patch the `onKeyDown` event in `provided`**

Similar to #2, this patch should be used on inputs inside a `Draggable`

```js
class DraggableWithInput extends Component {
  renderInput = provided => {
    // Patched onMouseDown, make inputs selectable
    const onMouseDown = event => {
      if (event.target.nodeName === 'INPUT') {
        return;
      }
      provided.dragHandleProps.onMouseDown(event);
    };
    // Patched onKeyDown handler, make typing in inputs
    // work as expected. For example, spacebar can be used
    // as normal characters instead of a shortcut.
    const onKeyDown = event => {
      if (event.target.nodeName === 'INPUT') {
        return;
      }
      provided.dragHandleProps.onKeyDown(event);
    };
    // patching drag handle props
    const patched = {
      ...provided.dragHandleProps,
      onMouseDown,
      onKeyDown,
    };
    return (
      <div>
        <div
          ref={provided.innerRef}
          style={getItemStyle(
            provided.draggableStyle,
            snapshot.isDragging
          )}
          {...patched}
        >
          <input type="text" />
        </div>
        {provided.placeholder}
      </div>
    );
  }

  render() {
    return (
      <Draggable draggableId="draggable-1">
        {this.renderInput}
      </Draggable>
    );
  }
}
```

## Flow usage

`react-beautiful-dnd` is typed using [`flowtype`](flowtype.org). This greatly improves internal consistency within the codebase. We also expose a number of public types which will allow you to type your javascript if you would like to. If you are not using `flowtype` this will not inhibit you from using the library. It is just extra safety for those who want it.

### Public flow types

```js
// id's
type Id = string;
type TypeId = Id;
type DroppableId = Id;
type DraggableId = Id;

// hooks
type DropResult = {|
  draggableId: DraggableId,
  type: TypeId,
  source: DraggableLocation,
  // may not have any destination (drag to nowhere)
  destination: ?DraggableLocation
|}

type DraggableLocation = {|
  droppableId: DroppableId,
  // the position of the droppable within a droppable
  index: number
|};

// Droppable
type DroppableProvided = {|
  innerRef: (?HTMLElement) => void,
  placeholder: ?ReactElement,
|}

type DraggableStateSnapshot = {|
  isDraggingOver: boolean,
|}

// Draggable
type DraggableProvided = {|
  innerRef: (?HTMLElement) => void,
  draggableStyle: ?DraggableStyle,
  dragHandleProps: ?DragHandleProvided,
  placeholder: ?ReactElement,
|}

type DraggableStateSnapshot = {|
  isDragging: boolean,
|}

type DraggableStyle = DraggingStyle | NotDraggingStyle

type BaseStyle = {|
  WebkitTouchCallout: 'none',
  WebkitTapHighlightColor: 'rgba(0,0,0,0)',
  touchAction: 'none',
|}
type DraggingStyle = {|
  ...BaseStyle,
  pointerEvents: 'none',
  position: 'fixed',
  width: number,
  height: number,
  boxSizing: 'border-box',
  top: number,
  left: number,
  margin: 0,
  transform: ?string,
  zIndex: ZIndex,
|}
type NotDraggingStyle = {|
  ...BaseStyle,
  transition: ?string,
  transform: ?string,
  pointerEvents: 'none' | 'auto',
|}
type DragHandleProvided = {|
  onMouseDown: (event: MouseEvent) => void,
  onKeyDown: (event: KeyboardEvent) => void,
  onClick: (event: MouseEvent) => void,
  onTouchStart: (event: TouchEvent) => void,
  onTouchMove: (event: TouchEvent) => void,
  tabIndex: number,
  'aria-grabbed': boolean,
  draggable: boolean,
  onDragStart: () => void,
  onDrop: () => void
|}
```

### Using the flow types

The types are exported as part of the module so using them is as simple as:

```js
import type { DroppableProvided } from 'react-beautiful-dnd';
```

## Typescript

If you are using [TypeScript](https://www.typescriptlang.org/) you can use the community maintained [DefinitelyTyped type definitions](https://www.npmjs.com/package/@types/react-beautiful-dnd). [Installation instructions](http://definitelytyped.org/).

### Sample application

We have created a [sample application](https://github.com/alexreardon/react-beautiful-dnd-flow-example) which exercises the flowtypes. It is a super simple `React` project based on [`react-create-app`](https://github.com/facebookincubator/create-react-app). You can use this as a reference to see how to set things up correctly.

### Flow version

`react-beautiful-dnd` currently uses flow `0.52` which is not the [latest version](https://github.com/facebook/flow/releases). However, we are not able to upgrade until [eslint-plugin-react](https://github.com/yannickcr/eslint-plugin-react) [supports it](https://github.com/yannickcr/eslint-plugin-react/issues/1376) - [more details](https://github.com/atlassian/react-beautiful-dnd/issues/37)

## Engineering health

### Typed

This codebase is typed with [flowtype](flowtype.org) to promote greater internal consistency and more resilient code.

### Tested

This code base employs a number of different testing strategies including unit, performance and integration tests. Testing various aspects of the system helps to promote its quality and stability.

While code coverage is [not a guarantee of code health](https://stackoverflow.com/a/90021/1374236), it is a good indicator. This code base currently sits at **~95% coverage**.

### Performance

This codebase is designed to be extremely performant - it is part of its DNA. It builds on prior investigations into `React` performance that you can read about [here](https://medium.com/@alexandereardon/performance-optimisations-for-react-applications-b453c597b191) and [here](https://medium.com/@alexandereardon/performance-optimisations-for-react-applications-round-2-2042e5c9af97). It is designed to perform the minimum number of renders required for each task.

**Highlights**

- using connected-components with memoization to ensure the only components that render are the ones that need to - thanks [`react-redux`](https://github.com/reactjs/react-redux), [`reselect`](https://github.com/reactjs/reselect) and [`memoize-one`](https://github.com/alexreardon/memoize-one)
- all movements are throttled with a [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) - thanks [`raf-schd`](https://github.com/alexreardon/raf-schd)
- memoization is used all over the place - thanks [`memoize-one`](https://github.com/alexreardon/memoize-one)
- conditionally disabling [`pointer-events`](https://developer.mozilla.org/en/docs/Web/CSS/pointer-events) on `Draggable`s while dragging to prevent the browser needing to do redundant work - you can read more about the technique [here](https://www.thecssninja.com/css/pointer-events-60fps)
- Non primary animations are done on the GPU

| Minimal browser paints | Minimal React updates |
|------------------------|-----------------------|
|![minimal-browser-paints](https://github.com/alexreardon/files/blob/master/resources/dnd-browser-paint.gif?raw=true)|![minimal-react-updates](https://github.com/alexreardon/files/blob/master/resources/dnd-react-paint.gif?raw=true)|

## Supported browsers

This library supports the standard [Atlassian supported browsers](https://confluence.atlassian.com/cloud/supported-browsers-744721663.html) for desktop:

| Desktop                             | Version                                              |
|-------------------------------------|------------------------------------------------------|
| Microsoft Internet Explorer(Windows)| Version 11                                           |
| Microsoft Edge                      | Latest stable version supported                      |
| Mozilla Firefox (all platforms)     | Latest stable version supported                      |
| Google Chrome (Windows and Mac)     | Latest stable version supported                      |
| Safari (Mac)                        | Latest stable version on latest OS release supported |

| Mobile                              | Version                                              |
|-------------------------------------|------------------------------------------------------|
| Chrome (Android and iOS)            | Latest stable version supported                      |
| Mobile Safari (iOS)                 | Latest stable version supported                      |
| Android (Android)                   | The default browser on Android 4.0.3 (Ice Cream Sandwich) |

## Translations

The documentation for this library is also available in other languages:
- ![kr](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/24/South-Korea.png) **Korean**: [leehyunggeun/react-beautiful-dnd](https://github.com/LeeHyungGeun/react-beautiful-dnd-kr)

These translations are maintained by the community and are not reviewed or maintained by the maintainers of this library. Please raise issues on the respective translations if you would like to have them updated.

## Author

Alex Reardon - [@alexandereardon](https://twitter.com/alexandereardon) - areardon@atlassian.com

## Other maintainers

Jared Crowe - [@jaredjcrowe](https://twitter.com/jaredjcrowe) - jcrowe@atlassian.com
