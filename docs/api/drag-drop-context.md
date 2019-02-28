# `<DragDropContext />`

In order to use drag and drop, you need to have the part of your `React` tree that you want to be able to use drag and drop in wrapped in a `<DragDropContext />`. It is advised to just wrap your entire application in a `<DragDropContext />`. Having nested `<DragDropContext />`'s is _not_ supported. You will be able to achieve your desired conditional dragging and dropping using the props of `<Droppable />` and `<Draggable />`. You can think of `<DragDropContext />` as having a similar purpose to the [react-redux Provider component](https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store)

## Props

```js
type Responders = {|
  // optional
  onBeforeDragStart?: OnBeforeDragStartResponder,
  onDragStart?: OnDragStartResponder,
  onDragUpdate?: OnDragUpdateResponder,
  // required
  onDragEnd: OnDragEndResponder,
|};

import type { Node } from 'react';

type Props = {|
  ...Responders,
  children: ?Node,
|};
```

> See our [type guide](/docs/guides/types.md) for more details

## Basic usage

```js
import { DragDropContext } from 'react-beautiful-dnd';

class App extends React.Component {
  onBeforeDragStart = () => {
    /*...*/
  };

  onDragStart = () => {
    /*...*/
  };
  onDragUpdate = () => {
    /*...*/
  };
  onDragEnd = () => {
    // the only one that is required
  };

  render() {
    return (
      <DragDropContext
        onBeforeDragStart={this.onBeforeDragStart}
        onDragStart={this.onDragStart}
        onDragUpdate={this.onDragUpdate}
        onDragEnd={this.onDragEnd}
      >
        <div>Hello world</div>
      </DragDropContext>
    );
  }
}
```

## `Responder`s

> `Responders` were previously known as `Hooks`

Responders are top level application events that you can use to perform your own state updates, style updates, as well as to make screen reader announcements.

[Please see our Responders guide](/docs/guides/responders.md) for detailed information about responders ❤️

[Back to home](/README.md#documentation-)
