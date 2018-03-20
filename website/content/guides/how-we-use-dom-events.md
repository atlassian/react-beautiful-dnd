---
title: 'How We Use Dom Events'
---

> This page details how we use DOM input events, what we do with them, and how you can build things on top of our usage. **Generally you will not need to know this information** but it can be helpful if you are also binding your own event handlers to the window or to a *drag handle*.

## Prior knowledge

This page assumes a working knowledge of DOM events. For a good introduction to DOM events see:

- [An introduction to browser events](https://javascript.info/introduction-browser-events)
- [How event capturing and bubbling works](https://javascript.info/bubbling-and-capturing)

## Safe event bindings

Without needing going into all the details below, here are the safest event handlers to build on top of `react-beautiful-dnd`:

> These can be added on the *drag handle*, anywhere else higher on the tree or to the window directly.

- `onClick`: the `event.defaultPrevented` property will be set to `true` if occurred as a part of the drag interaction. This is true even if the drag was not finished with a pre-click action such as `mouseup` or `touchend`. See [sloppy clicks and click prevention](https://github.com/atlassian/react-beautiful-dnd#sloppy-clicks-and-click-prevention-).
- `onKeyDown`: the `event.defaultPrevented` property will be set to `true` if it was used as a part of a drag. If you add `onKeyDown` to the *drag handle* you will need to monkey patch the [`DragHandleProps`](https://github.com/atlassian/react-beautiful-dnd#draghandleprops-type-information) `onKeyDown` event handler.

You may need to enchance the logic of your event handlers with information from [`onDragStart`](https://github.com/atlassian/react-beautiful-dnd#ondragstart-optional) and [`onDragEnd`](https://github.com/atlassian/react-beautiful-dnd#ondragend-required) to know about whether a drag is occuring while those events fire.

You are welcome to add other event handlers but you may be more reliant on `onDragStart` and `onDragEnd` information.

## General rules

### Event prevention

When we use an input event as part of a drag and drop interaction we generally call `event.preventDefault()` on the event to opt out of standard browser behaviour for the event. We **do not stop** the propagation of events that we call `event.preventDefault()` on so even though we may use a `mousemove` event for dragging **we will not block** that event from being published (propagating) and received by your event handlers.

- we use: `event.preventDefault()`
- we do not use: `event.stopPropagation()`

Some event handlers we add on the *drag handle* itself (see [`DragHandleProps`](https://github.com/atlassian/react-beautiful-dnd#draghandleprops-type-information)) and others we add to the `window` in the [capture phase](https://javascript.info/bubbling-and-capturing#capturing). What this means is as long as you are applying your events handlers in the [bubbling phase](https://javascript.info/bubbling-and-capturing#bubbling) (which is the default for event handlers) then behaviour of events will be as described on this page.

In order to know if we have already used the event for the purpose of drag and drop you need to check the [`event.defaultPrevented`](https://developer.mozilla.org/en-US/docs/Web/API/Event/defaultPrevented) property.

So let's say you want to add a window `click` handler. You could do something like this:

```js
window.addEventListener('click', (event: MouseEvent) => {
  // event has already been used for drag and drop
  if (event.defaultPrevented) {
    return;
  }

  doMyCoolThing();
});
```

### Direct and indirect actions

Some user events have a direct impact on a drag: such as a `mousemove` when dragging with a mouse or the **up arrow** <kbd>↑</kbd> `keydown` event while dragging with a keyboard. These direct events will have `event.preventDefault()` called on them to prevent their default browser behaviours. Some events indirectly impact a drag such as a `resize` event which cancels a drag. For events that indirectly impact a drag we do not call `event.preventDefault()` on them. Generally indirect events that impact are drag are events that cancel a drag such as `reize` or `orientationchange` events.

## Mouse dragging 🐭

### Initial `mousedown`

- `preventDefault()` **is called on `mousedown`** 😞

> This is the only known exception to our rule set. It is unfortunate that it is the first one to appear in this guide!

When the user first performs a `mousedown` on a *drag handle* we are not sure if they are intending to click or drag. Ideally we would not call `preventDefault()` on this event as we are not sure if it is a part of a drag. However, we need to call `preventDefault()` in order to avoid the item obtaining focus as it has a `tabIndex`.

### We are not sure yet if a drag will start

- `preventDefault()` not called on `mousemove`

The user needs to move a small threshold before we consider the movement to be a drag. In this period of time we do not call `preventDefault()` on any `mousemove` events as we are not sure if they are dragging or just performing a [sloppy click](https://github.com/atlassian/react-beautiful-dnd#sloppy-clicks-and-click-prevention-)

### The user has indicated that they are not mouse dragging

- `preventDefault()` not called on the event that caused the pending drag to end (such as `mouseup` and `keydown`). Any `keydown` event that is firered while there is a pending drag will be considered an indirect cancel
- `preventDefault()` is not called on the subsequent `click` event if there is one

### A mouse drag has started and the user is now dragging

- `preventDefault()` is called on `mousemove` events
- `preventDefault()` is called on a few `keydown` events to prevent their standard browser behaviour
- `preventDefault()` is not called on `keyup` events even if the `keydown` was prevented

### A drag is ending

- `preventDefault()` is called on a `mouseup` if it ended the drag
- `preventDefault()` is called on a **escape** <kbd>esc</kbd> `keydown` if it ended the drag as it directly ended the drag
- `preventDefault()` is called on the next `click` event regardless of how the drag ended. See [sloppy clicks and click prevention](https://github.com/atlassian/react-beautiful-dnd#sloppy-clicks-and-click-prevention-)
- `preventDefault()` is not called on other events such as `resize` that indirectly ended a drag
- `preventDefault()` is not called on `keyup` events even if they caused the drag to end

## Touch dragging 📱

> The logic for touch dragging works in a similar way to mouse dragging

### Initial `touchstart`

- `preventDefault()` is not called on `touchstart`.

When a user presses their finger (or other input) on a `Draggable` we are not sure if they where intending to *tap*, *force press*, *scroll the container* or *drag*. Because we do not know what the user is trying to do yet we do not call `preventDefault()` on the event.

### The user has indicated that they are not touch dragging

- `preventDefault()` is not called on any events

A user can start a drag by holding their finger 👇 on an element for a small period of time 🕑 (long press). If the user moves during this time with `touchmove` then we do not call `preventDefault()` on the event.

It is possible to cancel a touch drag with over events such as an `orientationchange` or a `touchcancel`. We do not call `preventDefault` on these events.

### A touch drag has started and the user is now dragging

- `preventDefault()` is called on `touchmove` events

✌️

### A touch drag is ending

- `preventDefault()` is called on `touchend`
- `preventDefault()` is called on `touchcancel`
- `preventDefault()` is called on an **escape** <kbd>esc</kbd> `keydown` as a direct cancel. `preventDefault()` is not call on any other `keydown` as it is an indirect cancel.
- `preventDefault()` is not called on other events such as `orientationchange` that can cancel a drag

### Force press

> See [force press support](https://github.com/atlassian/react-beautiful-dnd#force-press-support)

- `preventDefault()` is not called on `touchforcechange` if a drag has not started yet
- `preventDefault()` is not called on `touchforcechange` a drag that has started but no movement has occurred yet. The force press cancels the drag and is an indirect cancel.
- `preventDefault()` is called after on `touchforcechange` a drag has started and a `touchmove` has fired. This is defensive as a force press `touchforcechange` should not occur after a `touchmove`.

## Keyboard dragging 🎹

> We only use `keydown` events for keyboard dragging so `keyup` events never have `preventDefault()` called on them

### Drag start

> `preventDefault()` is called on `keydown`

Unlike mouse dragging a keyboard drag starts as soon as the user presses the **spacebar** <kbd>space</kbd>. This initial keyboard interaction has `event.preventDefault()` called on it.

### While dragging

- `preventDefault()` is called on a `keydown` event if the event is used as part of the drag (such as the **up arrow** <kbd>↑</kbd>)
- `preventDefault()` is called on `keydown` events were we want to block the stanard browser behaviours (such as `enter` for submission)
- `preventDefault()` is not called on `keydown` events that we do not use for the drag

### Drag ending

- `preventDefault()` is called on a `keydown` if it is the **spacebar** <kbd>space</kbd> key as it is dropping the item
- `preventDefault()` is called on a `keydown` if it is the **escape** <kbd>esc</kbd> key as it is explicitly cancelling the drag
- `preventDefault()` is not called on events that indirectly cancel a drag such as `resize` or `mousedown`.
