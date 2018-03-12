# Mutli drag pattern

> This page is designed to guide you through adding your own mutli drag experience to your `react-beautiful-dnd` lists.

Dragging multiple `Draggable`s at once (multi drag) is currently a pattern that needs to be built on top of `react-beautiful-dnd`. We have not included the interaction into the library itself. This is done because a multi drag experience introduces a lot of concepts, decisions and opinions. However, we have done a lot of work to ensure there is a standard base of [dom event management](/docs/guides/how-we-use-dom-events.md) to build on.

We have created a [reference application](TODO) ([source](TODO)) which implements the multi drag pattern. The application is fairly basic and does not handle performance in large lists well. As such, there is are [a few performance recommendations](TODO) that we suggest you also add on to our reference application if you want to support lists greater than 50 in size.

## Experience

We have decided on a simple, but very flexible and scalable mutli drag pattern to start with. It is not as *beautiful* as our standard drag interactions - but it is a great base to build from and will scale across many problem spaces.

## User experience

We can break the user experience down in three phases.

1. [**Selection**](#selection): The user selects one or more items.
2. [**Dragging**](#dragging): The user drags one item as a representation of the whole group.
3. [**Reordering**](#reordering): The user drops an item into a new location. We move all of the selected items into the new location

## Selection

Before a drag starts we need to allow the user to *optionally* select a number of `Draggable`s to drag. We an item is selected you should apply a style update to the `Draggable` such as a background color change to indicate that the item is selected.

### Selection interaction recommendations

> These are based on the Mac OSX [*Finder*](https://support.apple.com/en-au/HT201732).

### Action: toggle section

If a user clicks on an item the selected state of the item should be toggled. Additionally, the selected state of the item should be updated when the user presses **enter** key. The **enter** key is quite nice because we do not use it for lifting or dropping - we use **space** for those.

#### `onClick` event handler

- Attach an `onClick` handler to your *drag handle* or `Draggable`
- Only toggle selection if the user is using the [`primaryButton`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button) (`event.button === 0`)
- Prevent the default action on the `click` as you are using it for selection (it is only useful to call `event.preventDefault()` for [selection clearing](TODO)).

#### `onKeyUp` event handler

- Attach an `onKeyUp` handler to your *drag handle* or `Draggable`. You could apply a `onKeyDown` but if you are applying it to a *drag handle* you will need to monkey patch the `DragHandleProvided > onKeyDown` event.
- Prevent the default action on the `onKeyUp` if you are toggling selection as you are using it for selection

#### Toggle selection behaviour

- If the item was not previously selected - make it the only selected item
- If the item was previously selected **and was not a part** of a selection group: unselect the item
- If the item was previous selected **and was a part** of a selection group: make it the only selected item

### Action: toggle selection in a group

This is providing the ability for a user to add or remove items to a selection group.

#### `onClick` event handler

- Use the same `onClick` event handler you used for [toggle selection](#toggle-section).
- If the [meta key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/metaKey) was used in addition to the click then toggle the selection in the group

> Note: On Macintosh keyboards, this is the `⌘ Command` key. On Windows keyboards, this is the Windows key (`⊞ Windows`) - [MDN](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/metaKey)

```js
const wasMetaKeyUsed: boolean = event.metaKey;

if (wasMetaKeyUsed) {
  toggleSelectionInGroup(task.id);
  return;
}
```

#### Toggle selection in a group behaviour

- If the item was not selected then add the item to the selected items
- If the item was previously selected then remove it from the selected items.

### Action: mutli select to

The ability to click on an item further down a list and select everything inbetween.

#### `onClick` event handler

- Use the same `onClick` event handler you used for [toggle selection](#toggle-section).
- If the [shift key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/metaKey) was used in addition then select up to this up

### Mutli select to: behaviour

This behaviour is the most complex. It deviates slightly from the `MacOSX` behaviour for simplicity.

#### Nothing was selected

If nothing is previously selected when the user triggers this action: simply set the selected item as the only selected item.

#### Selecting to a different list

If the user is selecting to an item that is in a different list to the last selected item: clear all the selected items and select everything up to the index of the selected to item in the new list

#### Selecting to in the same list



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

