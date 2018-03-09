# Mutli drag pattern

Dragging multiple `Draggable`s at once (multi drag) is currently a pattern that needs to be built on top of `react-beautiful-dnd`. We have not baked the interaction into the library itself. This is done because a multi drag experience introduces a lot of concepts and decisions that are not required for standard list reordering. This page is designed to guide you through building your own mutil drag experience to your `react-beautiful-dnd` lists.

We have create **two** reference applications which implement the multi drag pattern.

1. Simple example

This example is fairly simple and should be fine for lists with small amounts of data (less than 50 items). This example is great to introduce yourself to the concepts of the pattern without getting distracted by performance optimisation techniques.

2. Performant example

This example addresses some of the main performance bottleknecks of the first approach.

## Selection

The core experience that needs to be built to enable a multi drag experience is *selection management*. This is an interaction that occurs *before a drag has started*. The user selects one or more `Draggable`s using a variety of selection techniques.

Here are our recommended interactions:

### Mouse

#### `onClick` on *drag handle*

- `click`: toggle the selected state of the `Draggable`. This should clear any other previously selected items
- `click + event.metaKey`: if a meta key is used while a click occurs pressed then add / remove the `Draggable` from the list of selected items.
- only update the selection if the user is using the primary mouse button `event.button === 0`.
- if updating the selection then call `event.preventDefault()` and `event.stopPropagation()` to stop the default behaviour of the click and to stop the event moving up the DOM tree

```js
onClick = (event: MouseEvent) => {
    const {
      isSelected,
      task,
      addToSelection,
      removeFromSelection,
      unselect,
      select,
    } = this.props;

    const primaryButton: number = 0;

    // Not performing selection management if not using the
    // primary mouse button
    if (event.button !== primaryButton) {
      return;
    }

    event.preventDefault();
    // Stopping the event so that it is not picked up by our window click handler
    event.stopPropagation();

    const wasMetaKeyUsed: boolean = event.metaKey;

    if (wasMetaKeyUsed) {
      if (isSelected) {
        removeFromSelection(task.id);
        return;
      }
      addToSelection(task.id);
      return;
    }

    if (isSelected) {
      unselect(task.id);
      return;
    }

    select(task.id);
  };
```

#### `window` `click` handler

We add a `click` handler to the `window` to detect for a click that is not on a `Draggable`. We call `stopPropagation` in our `onClick` handler so `click` events should only bubble up here if they did not perform selection management (such as by clicking outside of a `Draggable`). If a click is detected it should unselect all the currently selected items

```js
componentDidMount() {
  window.addEventListener('click', this.unselectAll);
}
```

#### `window` `keyup` handler

Here you want to listen to


### Keyboard

- Add an `onKeyUp` handler to a *drag handle* element. It the user presses the `enter` key - toggle the selected state of the `Draggable`.
- As with a mouse handler


### Touch



## Performance

Doing a multi drag interaction in a performant way can be challenging. The core thing you want to do is to avoid calling `render()` on components that do not need to update. Here are some pitfalls:

### Selection state change

You do not want to re-render **any** `Droppable` or `Draggable` in response to changes in the selected state. You do not want to re render `Draggables` whose selection state is not changing. Additionally, you do not even want to render the component whose selection state is changing.......

