# Preset styles

We apply a number of **non-visible** styles to facilitate the dragging experience. We do this using combination of styling targets and techniques. It is a goal of the library to provide unopinioned styling. However, we do apply some reasonable `cursor` styling on drag handles by default. This is designed to make the library work as simply as possible out of the box. If you want to use your own cursors you are more than welcome to. All you need to do is override our cursor style rules by using a rule with [higher specificity](https://css-tricks.com/specifics-on-css-specificity/).

Here are the styles that are applied at various points in the drag lifecycle:

## In every phase

### Always: drag handle

Styles applied to: **drag handle element** using the `data-react-beautiful-dnd-drag-handle` attribute.

A long press on anchors usually pops a content menu that has options for the link such as 'Open in new tab'. Because long press is used to start a drag we need to opt out of this behavior

```css
-webkit-touch-callout: none;
```

Webkit based browsers add a grey overlay to anchors when they are active. We remove this tap overlay as it is confusing for users. [more information](https://css-tricks.com/snippets/css/remove-gray-highlight-when-tapping-links-in-mobile-safari/).

```css
-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
```

Avoid the _pull to refresh action_ and _delayed anchor focus_ on Android Chrome

```css
touch-action: manipulation;
```

### Always: Droppable

Styles applied to: **droppable element** using the `data-react-beautiful-dnd-droppable` attribute.

Opting out of the browser feature which tries to maintain the scroll position when the DOM changes above the fold. We already correctly maintain the scroll position. The automatic `overflow-anchor` behavior leads to incorrect scroll positioning post drop.

```css
overflow-anchor: none;
```

## Phase: resting

### (Phase: resting): drag handle

Styles applied to: **drag handle element** using the `data-react-beautiful-dnd-drag-handle` attribute.

Adding a cursor style to let the user know this element is draggable. You are welcome to override this.

```css
cursor: grab;
```

## Phase: dragging

### (Phase: dragging): drag handle element

**Styles applied using the `data-react-beautiful-dnd-drag-handle` attribute**

An optimisation to avoid processing `pointer-events` while dragging. Also used to allow scrolling through a drag handle with a track pad or mouse wheel.

```css
pointer-events: none;
```

### (Phase: dragging): Draggable element

**Styles applied using the `data-react-beautiful-dnd-draggable` attribute**

This is what we use to control `<Draggable />`s that need to move out of the way of a dragging `<Draggable />`.

```css
transition: ${string};
```

### (Phase: dragging): Droppable element

**Styles applied using the `data-react-beautiful-dnd-droppable` attribute**

We apply `pointer-events: none` to a `<Droppable />` during a drag. This is technically not required as an optimisation. However, it gets around a common issue where hover styles are triggered during a drag. You are welcome to opt out of this one as it is it not required for functinality.

```css
pointer-events: none;
```

You are also welcome to extend this to every element under the body to ensure no hover styles for the entire application fire during a drag.

```css
/* You can add this yourself during onDragStart if you like */
body > * {
  pointer-events: none;
}
```

**Styles applied using inline styles**

This is described by the type [`DraggableStyle`](https://github.com/atlassian/react-beautiful-dnd#type-information-1).

### (Phase: dragging): body element

We apply a cursor while dragging to give user feedback that a drag is occurring. You are welcome to override this. A good point to do this is the `onDragStart` event.

```css
cursor: grabbing;
```

To prevent the user selecting text as they drag apply this style

```css
user-select: none;
```

## Phase: dropping

### (Phase: dropping): drag handle element

**Styles applied using the `data-react-beautiful-dnd-drag-handle` attribute**

We apply the grab cursor to all drag handles except the drag handle for the dropping `<Draggable />`. At this point the user is able to drag other `<Draggable />`'s if they like.

```css
cursor: grab;
```

### (Phase: dropping): draggable

Same as dragging phase

## Phase: user cancel

> When a user explicitly cancels a drag

This is the same as `Phase: dropping`. However we do not apply a `cursor: grab` to the drag handle. During a user initiated cancel we do not allow the dragging of other items until the drop animation is complete.

## Preset styles are vendor prefixed

All styles applied are vendor prefixed correctly to meet the requirements of our [supported browser matrix](https://confluence.atlassian.com/cloud/supported-browsers-744721663.html). This is done by hand to avoid adding to react-beautiful-dnd's size by including a css-in-js library

[Back to documentation 📖](/README.md#documentation-)
