# Using `innerRef`

> If you have not used `ref`'s before, please take a look at the [`React`: Refs and the DOM guide](https://reactjs.org/docs/refs-and-the-dom.html) on their documentation website.

Our `Draggable` and `Droppable` components both require a [`HTMLElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement) to be provided to them. This is done using the `innerRef` property on the `DraggableProvided` and `DroppableProvided` objects.

```diff
<Draggable draggableId="draggable-1" index={0}>
  {(provided, snapshot) => (
    <div
+      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      <h4>My draggable</h4>
    </div>
  )}
</Draggable>;
```

```diff
<Droppable droppableId="droppable-1">
  {(provided, snapshot) => (
    <div
+     ref={provided.innerRef}
      {...provided.droppableProps}
    >
      <h2>I am a droppable!</h2>
      {provided.placeholder}
    </div>
  )}
</Droppable>;
```

## Not all `ref`s are created equal

Confusion can arise because of how the `ref` callback works in `React`.

On a _Component_ such as `<Person />` the `ref` callback will return the _instance_ of the `Person` component.

On a _ReactElement_ such as `<div />` the `ref` callback will return the _HTMLElement_ that the _ReactElement_ is tied to.

[See on `codesandbox.io`](https://codesandbox.io/s/xok96ovo8p)

```js
class Person extends React.Component {
  state = {
    sayHello: false,
  };
  sayHello() {
    this.setState({
      sayHello: true,
    });
  }
  render() {
    if (this.state.sayHello) {
      return <div {...this.props}>Hello</div>;
    }

    return <div {...this.props}>'I am a person, I think..'</div>;
  }
}

class App extends React.Component {
  setPersonRef = ref => {
    this.personRef = ref;

    // When the ref changes it will firstly be set to null
    if (this.personRef) {
      // personRef is an instance of the Person class
      this.personRef.sayHello();
    }
  };
  setDivRef = ref => {
    this.divRef = ref;

    if (this.divRef) {
      // div ref is a HTMLElement
      this.divRef.style.backgroundColor = 'lightgreen';
    }
  };
  render() {
    return (
      <React.Fragment>
        <Person ref={this.setPersonRef} />
        <div ref={this.setDivRef}>hi there</div>
      </React.Fragment>
    );
  }
}
```

## A common error 🐞

Take a look at this example:

```js
<Draggable draggableId="draggable-1" index={0}>
  {(provided, snapshot) => (
    <Person
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    />
  )}
</Draggable>
```

While it looks correct, it **will cause your application to explode 💥!**

This is because `react-beautiful-dnd` expects the `provided.innerRef` function for a `Draggable` and a `Droppable` to be called with the DOM node of the component, and not the _instance_ of the class. In this example we are calling `provided.innerRef` with an _instance_ of `Person` and not the underlying DOM node.

## Exposing a DOM ref from your Component 🤩

A simple way to expose the _HTMLElement_ of your component is to **create your own `innerRef` prop**:

```js
class Person extends React.Component {
  render() {
    return (
      <div {...this.props} ref={this.props.innerRef}>
        I am a person, I think..
      </div>
    );
  }
}
```

> Note, the name `innerRef` is just a convention. You could call it whatever you want for your component. Something like `domRef` is fine.

You can then correctly supply the DOM node to a `Draggable` or `Droppable`

```diff
<Draggable draggableId="draggable-1" index={0}>
  {(provided, snapshot) => (
    <Person
-      ref={provided.innerRef}
+      innerRef={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      <h4>My draggable</h4>
    </div>
  )}
</Draggable>
```

⚠️ This approach will cause a `React` warning as we are spreading all of the props of the component onto the DOM node. `{...this.props}` This includes the `innerRef` prop which `React` does not like you adding to an element. So you can set things up like this:

```diff
class Person extends React.Component {
  render() {
-    return (
-      <div {...this.props} ref={this.props.innerRef}>
-        I am a person, I think..
-      </div>
-    );
  }
}
class Person extends React.Component {
  render() {
+    const { provided, innerRef } = this.props;
+    return (
+      <div
+        {...provided.draggableProps}
+        {...provided.dragHandleProps}
+        ref={innerRef}
+      >
+        I am a person, I think..
+      </div>
+    );
  }
}

<Draggable draggableId="draggable-1" index={0}>
  {(provided, snapshot) => (
    <Person
      innerRef={provided.innerRef}
-      {...provided.draggableProps}
-      {...provided.dragHandleProps}
+      provided={provided}
    />
  )}
</Draggable>
```

If you also need to use the _HTMLElement_ within your _Component_ you can have a more powerful ref setting approach:

```js
class Person extends React.Component {
  setRef = ref => {
    // keep a reference to the dom ref as an instance property
    this.ref = ref;
    // give the dom ref to react-beautiful-dnd
    this.props.innerRef(ref);
  };
  render() {
    const { provided, innerRef } = this.props;
    return (
      <div
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        ref={this.setRef}
      >
        I am a person, I think..
      </div>
    );
  }
}
```

## Putting it all together

Here is an example that shows off the learnings presented in this guide: https://codesandbox.io/s/v3p0q71qn5

## A note on SVG's

`react-beautiful-dnd` does not support the dragging of `<svg>` elements. Wrap your `<svg>` in a `HTMLElement` such as `<span>` or `<div>` for great accessibility and cross browser support. See our [using SVGs guide](https://github.com/atlassian/react-beautiful-dnd/tree/master/docs/guides/using-svgs.md) for more information.
