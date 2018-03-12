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

- Select everything between the newly selected item and the last selected item.

> MacOSX is a little more complicated than this, but for our purposes this seems like a good default

- If selecting the same index as we started on - we do not need to do anything

### Action: clear selection

#### `window` `click` handler

We add a `click` handler to the `window` to detect for a click that is not on a `Draggable`. We call `preventDefault` in our selection `onClick` handler so `click` events used for selection will have the `event.defaultPrevented` property set to `true`. Additionally, if a drag occurred the default `click` action [will be prevented](https://github.com/atlassian/react-beautiful-dnd#sloppy-clicks-and-click-prevention-). So if we receive a `click` event on the window that has not has `event.defaultPrevented` set to false we clear the current selection.

#### `window` `keyup` handler

This event handler operates in a similar way to the *`window` `click` handler* described above. If a `keyup` event that is not prevented and is the **escape** key then we clear the current selection.

### Putting it all together

[DEMO]

## Dragging

Just before dragging we need to do one check in `onDragStart`. If the user is dragging something that is not selected then we need to clear the selection

As the drag starts we need to add a few visual affordances:

1. Add a count to the dragging item to indicate how many items this drag is represenative of
2. Change the appearance of the selected items that are not dragging to a greyed out / disabled state.

We do not remove the selected items from the list. If we remove the items completely that can change the dimensions of the list which can lead to list collapsing and scroll jumps. If we leave them in the list and just make them invisible then there are these big blank sections in a list that have no meaning and can be confusing to interact with.

## Dropping

As much as possible we want to preserve the selection that the user had before the drag started. That way they could continue to move the same item or items around after the drag.

### No change

This occurs when you cancel the drag, drop nowhere or drop in the same location. No reordering is required and you can keep the previous selection

### Dropping in a different list

When moving the items to the new list they should be inserted into the new list at the index in which the dragging item was dropped. We suggest the moved items be placed in the following order:

1. Move the selected item to the first position

This is done to ensure that the item the user is dragging does not disappear suddenly on drop.

2. Order by the items natural indexes regardless of list. For example if 'item alpha' started in column 1 of index 2 and 'item beta' started in column 2 of index 2 then 'item beta' should be placed before 'item alpha'

This gives priority to original index. However, you might want to give priority to list. So that items selected in previous lists go before items selected in subsequent lists.

3. In the event of a tie then sort by the order in which the item was selected.

This strategy does change the order of items symantically: specifically step 1 which always moves the selected item to the top. If you do not want this you do not have to do it - however it is much nicer visually and helps to keep the user grounded on a drop.

### Dropping in the same list

The goal is to move the selected items to their new location. We want to insert all the items in at the index at which the dragging item was dropped. As with the strategy above we suggest the following order for the dropped items:

1. Move the selected item to the first position
2. Order the rest by their natural index

## Other: performance

Doing a multi drag interaction in a performant way can be challenging. The core thing you want to do is to avoid calling `render()` on components that do not need to update.

### Selection state change

In response to a selection change you want to render the minimum amount of `Draggable` and `Droppable` components as possible. In our example application whenever the selection changes we re-render the entire tree. This approach will not scale. Right now the best solution for this is `redux` in combination with `react-redux`, `reselect` and `memoizeOne`. You would move your selection state into a store and have connected components that read their selection state from the store.

This approach is not complete. In the event of a 'unselect all action' you might need to render a lot of components at once to clear their selected styles. For most usages this will be fine. If you want to go further you will need to avoid calling `render` for selection style changes.

- You could look into using the [dynamic shared styles pattern](https://medium.com/@alexandereardon/dragging-react-performance-forward-688b30d40a33).
- You could apply a **unique** data attribute to each item and then apply the *selected* style to it using selectors dynamically in a parent component.

### Ghosting

When a user starts dragging we 'ghost'