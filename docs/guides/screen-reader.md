# Screen reader guide

> Because great features should be accessible for everyone

`react-beautiful-dnd` ships with great screen reader support, in English, out of the box. If you just want to get started, then there's nothing you have to do. But if it's tailored messaging you're after, you have total control of that too.

This guide is here to help you create messaging that supports and delights your users. The screen reader experience is focused on keyboard interactions, but it's possible for a screen reader user to use any input type (for example mouse or touch).

## On focus messaging

A screen reader will read out information about [interactive content](https://www.w3.org/TR/html51/dom.html#interactive-content) when it is given browser focus (note: NVDA requires interactive content to have a `role` too causing it to be a `widget`). Interactive content has a number of _accessibility properties_ that are used to determine what a screen reader will announce when the element is given focus.

<details>
  <summary>A note about drag and drop accessibility</summary>
  `rbd` does not use the HTML5 drag and drop API. It does not provide the experience we are trying to achieve. HTML5 drag and drop does not have a _great_ accessibility story out of the box as requires you to build a secondary widget for keyboard interactions.

We do not use the `aria-grabbed` and `aria-dropeffect` as they are [deprecated in wai-aria 1.1](https://www.w3.org/TR/wai-aria-1.1/). There is currently no replacement in [wai-aria 1.2](https://www.w3.org/TR/wai-aria-1.2/). For state information about a drag we rely on [live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions) as an escape hatch to provide our own information to screen reader users during a drag.

</details>

<details>
  <summary>Background on accessibility properties 📖</summary>

Screen readers use the following accessibility properties about an DOM Element to let assistive technologies what something is and how to describe it.

| Attribute        | Description                                                                                                                                   | Notes                                                                                                                                                                                                                                                                                    | Examples                                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name             | A way of identifying the element. Ideally these would be unique, but it doesn't need to be. Often the name is just the content of the element | This property is [computed](https://www.w3.org/TR/accname-1.1/#mapping_additional_nd_name). Can be based on visible text, or invisible attributes such as `aria-label`. The highest priority value will be picked as the name                                                            | `aria-label`, `aria-labelledby`, `title` (but not recommended) element content                                                                             |
| Role             | Main indicator for type of element. Can be inferred from semantic element type, or controlled by `role="button"`                              |                                                                                                                                                                                                                                                                                          | `<div role="button">Oh no</div>`                                                                                                                           |
| Role description | Override the role text read out. Useful for adding a more specific role to a widget                                                           |                                                                                                                                                                                                                                                                                          | `<button aria-roledescription="slide"> Quarterly Report</section>` Will announce as: _"Quarterly Report, slide"_ rather than _"Quarterly Report, section"_ |
| Description      | Adds additional usage information about an element                                                                                            | This property is [computed](https://www.w3.org/TR/accname-1.1/#mapping_additional_nd_te). Mostly controlled by `aria-describedby`<br />["Using the aria-describedby property to provide a descriptive label for user interface controls"](https://www.w3.org/TR/WCAG20-TECHS/ARIA1.html) |                                                                                                                                                            |

</details>

> 👆This is actually pretty useful to know for accessibility generally 😊

When a user focuses on a _drag handle_ (a _widget_) we need to let the user know that the item is draggable and how to start a drag.

Ideally we would like the screen reader to announce:

- `${name}, ${role}, ${description}`
- `${name}, Draggable item, Press spacebar to lift`

We do not control the **name** of the element. The name is a way to identify the element and is usually the content of the element (see accessibility guide above)

| Attribute               | Code                                                      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Interactive content** | `tabindex="0"`                                            | By adding a `tabindex` to a _drag handle_ we are [marking it as interactive content](https://www.w3.org/TR/html51/dom.html#kinds-of-content-interactive-content) that a user can focus on, even if it is semanatically not an interactive element such as `div` or `span`.                                                                                                                                                                                                                                                                                                                                                          |
| **Role**                | (not added by default - yet)                              | In order to correctly give a role like "Draggable item" we first need to add a `role` (such as `role="button"`) and then give it a more accurate title with `aria-roledescription`. Given that we cannot use `aria-roledescription` for now (see below) we will not be using `role="button"` yet. We plan on adding it in [soon](https://github.com/atlassian/react-beautiful-dnd/issues/1742)                                                                                                                                                                                                                                      |
| **Role description**    | (not added by default - yet)                              | A role description adds more specific description of a widget. We would like the default to be `aria-roledescription="Draggable item"`. However, this does not pass the current [Google lighthouse](https://developers.google.com/web/tools/lighthouse) accessibility audit. This is a bug in Google lighthouse, and should be fixed when they upgrade their `axe-core`. You are welcome to add the `aria-roledescription`, but keep in mind that lighthouse might punish you. We plan on adding the `aria-roledescription` in an upcoming release. [follow up issue](https://github.com/atlassian/react-beautiful-dnd/issues/1742) |
| **Description**         | `DragHandleProps` <br/> `aria-describedby="${elementId}"` | We are using the description of the element to provide usage instructions. The default usage instructions are `"Press space bar to start a drag. When dragging you can use the arrow keys to move the item around and escape to cancel. Ensure your screen reader is in focus mode or forms mode"`. We create a hidden element with this text which is pointed to be `aria-describedby`. If you want to change this text you will need to create your own hidden element with an `id` and point to that with `DragHandleProps` > `aria-describedby`.                                                                                |

## Drag lifecycle announcements

We announce to screen reader users know what is going on during the drag and drop lifecycle. We provide default english messages for every stage of the drag and drop lifecycle out of the box. You can control these announcements by using the `announce` function is provided to each of the `<DragDropContext /> > Responder`s.

Messages will be immediately read out. It's important to deliver messages immediately, so your users have a fast and responsive experience. If you attempt to hold onto the `announce` function and call it later, it won't work and will just print a warning to the console. If you try to call announce twice for the same event, only the first will be read by the screen reader with subsequent calls to announce being ignored and a warning printed.

> We use [live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions) to do drag lifecycle announcements. They are a way of getting a screen reader to announce some text

<details>
  <summary>Some advice when using <code>announce</code></summary>

### Use position, not index

> `position = index + 1`

When making a screen reader announcement we recommend announcing the position of an item in a list, rather than an index. index based listed start at `0`, where as position based lists start a `1`.

It reads more natural to hear "You have moved an item to position 2" than "You have moved an item to index 1"

```js
const position = (index) => index + 1;

const startPosition = position(source.index);
const endPosition = destination ? position(destination.index) : null;
```

### Use names where possible

All of our built in screen reader messages use `id`'s to identify `<Draggable />` and `<Droppable />`s. You might want to consider replacing these with more readable names.

> Potentially this could be a prop for `<Draggable />` and `<Droppable />` 🤔. Please raise an issue if you would like to see this happen!

</details>

### Drag starting

When a user lifts a `<Draggable />` by using the `spacebar` we want to tell them a number of things.

**Default message**: "You have lifted an item in position `${startPosition}`."

We tell the user the following:

- They have lifted the item
- What position the item is in

Notice that we don't tell them that they are in position `1 of x`. This is because we don't have access to the size of the list in the current api. This is especially true for [virtual lists](/docs/patterns/virtual-lists.md) where only a portion of the list is rendered at any one time. Feel free to add the the `1 of x` in your own messaging, and what list the item is in.

**Message with more info**: "You have lifted an item in position `${startPosition}` of `${listLength}` in the `${listName}` list."

You control the message printed to the user through the `<DragDropContext />` | `onDragStart` responder

```js
onDragStart = (start: DragStart, provided: ResponderProvided) => {
  provided.announce('My super cool message');
};
```

### Drag updates

After a user has started a drag there are different scenarios that can spring from that, so we'll create different messaging for each scenario.

We can control the announcement through the `<DragDropContext />` | `onDragUpdate` responder.

```js
onDragUpdate = (update: DragUpdate, provided: ResponderProvided) => {
  provided.announce('Update message');
};
```

#### Scenario 1. Moved in the same list

The user has moved backwards or forwards within the same list, so we want to tell the user what position they are now in.

**Default message**: "You have moved the item from position `${startPosition}` to position `${endPosition}`"

Think about including of `${listLength}` in your messaging.

#### Scenario 2. Moved into a different list

The user has moved on the cross axis into a different list, so we want to tell them a number of things.

**Default message** "You have moved the item from position `${startPosition}` in list `${source.droppableId}` to list `${destination.droppableId}` in position `${endPosition}`"

We tell the user the following:

- They have moved to a new list
- Some information about the new list
- What position they have moved from
- What position they are now in

Think about using friendlier text for the name of the droppable, and including the length of the lists in the messaging.

**Message with more info**: "You have moved the item from list `${sourceName}` in position `${sourcePosition}` of `${sourceLength}` to list `${destinationName}` in position `${newPosition}` of `${destinationLength}`".

#### Scenario 4. Combining in same list

The user has moved over another `<Draggable />` in [combine mode](/docs/guides/combining.md) in the same list

**Default message** "The item `${source.draggableId}` has been combined with `${combine.draggableId}`"

#### Scenario 5: Combining in different list

The user has moved over another `<Draggable />` in [combine mode](/docs/guides/combining.md) in a list that is not the list the dragging item started in

**Default message** "The item `${source.draggableId}` in list `${source.droppableId}` has been combined with `${combine.draggableId}` in list `${combine.droppableId}`"

#### Scenario 6. Over no drop target

You can't do this with a keyboard, but it's worthwhile having a message for this scenario, in case the user has a pointer for dragging.

**Default message**: "You are currently not dragging over a droppable area".

Think about how you could make this messaging friendlier and clearer.

### Drag end

There are two ways a drop can happen. Either the drag is cancelled or the user drops the dragging item. You can control the messaging for these events using the `<DragDropContext /> > onDragEnd` responder.

#### Scenario 1. Drag cancelled

A `DropResult` object has a `reason` property which can either be `DROP` or `CANCEL`. You can use this to announce your cancel message.

```js
onDragEnd = (result: DropResult, provided: ResponderProvided) => {
  if (result.reason === 'CANCEL') {
    provided.announce('Your cancel message');
    return;
  }
};
```

**Default message**: "Movement cancelled. The item has returned to its starting position of `${startPosition}`"

We tell the user the following:

- The drag has been cancelled
- Where the item has returned to

Think about adding information about the length of the list, and the name of the list you have dropped into.

**Message with more info**: "Movement cancelled. The item has returned to its starting position `${startPosition}` of `${listLength}`"

#### Scenario 2. Dropped in the home list

**Default message**: "You have dropped the item. It has moved from position `${startPosition}` to `${endPosition}`"

We tell the user the following:

- They have completed the drag
- What position the item is in now

#### Scenario 3. Dropped on a foreign list

The messaging for this scenario should be similar to 'dropped in a home list', but we also add what list the item started in and where it finished.

**Default message**: "You have dropped the item. It has moved from position `${startPosition}` in list `${result.source.droppableId}` to position `${endPosition}` in list `${result.destination.droppableId}`"

#### Scenario 4. Dropped on another `<Draggable />` in the home list

The user has dropped onto another `<Draggable />` in [combine mode](/docs/guides/combining.md) in the same list that the drag started in

**Default message**: "You have dropped the item. The item `${source.draggableId}` has been combined with `${combine.draggableId}`"

#### Scenario 5. Dropped on another `<Draggable />` in a foreign list

The user has dropped onto another `<Draggable />` in [combine mode](/docs/guides/combining.md) in a list that is not the list the dragging item started in

**Default message**: "The item `${source.draggableId}` in list `${source.droppableId}` has been combined with `${combine.draggableId}` in list `${combine.droppableId}`"

#### Scenario 6. Dropped on no destination

You can't do this with a keyboard, but it's worthwhile having a message for this scenario, in case the user has a pointer for dragging.

**Default message**: "The item has been dropped while not over a droppable location. The item has returned to its starting position of \${startPosition}"

We tell the user the following:

- They dropped over a location that is not droppable
- Where the item has returned to

## `VoiceOver` on Mac

If you are using Mac, then you are welcome to test against the inbuilt `VoiceOver` screen reader. Here is a [quick start guide](https://www.imore.com/how-enable-voiceover-mac)

> To start `VoiceOver`: <kbd>`cmd`</kbd> + <kbd>`f5`</kbd>

## That's all folks

We hope you find this guide useful. Feel free to send in suggestions for scenarios you'd like to see included, or you might want to share your own default messages and grow the knowledge even further 🙂.

[← Back to documentation](/README.md#documentation-)
