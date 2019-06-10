# Accessibility ♿️

Traditionally drag and drop interactions have been exclusively a mouse or touch interaction. This library has invested a huge amount of effort to ensure that everybody has access to drag and drop interactions

## What we do to include everyone

- [Full keyboard support](/docs/sensors/keyboard.md) (reordering, combining, moving between lists)
- [Keyboard multi drag support](/docs/patterns/multi-drag.md)
- Keyboard [auto scrolling](/docs/guides/auto-scrolling.md)
- Fantastic [screen reader support](/docs/guides/screen-reader.md) - _We ship with english messaging out of the box 📦_
- Correct use of `aria-*` attributes for [lift announcements](/docs/guides/screen-reader.md)
- Ensure a dragging item maintains focus if started dragging with focus - [more info](/docs/api/draggable.md)
- Ensure a dragging item maintains focus when dropping into a new list to allow drags to be chained together - [more info](/docs/api/draggable.md)
- Ensure a dragging item maintains focus moving into a [portal](/docs/patterns/using-a-portal.md)

![screen-reader-text](https://user-images.githubusercontent.com/2182637/36571009-d326d82a-1888-11e8-9a1d-e44f8b969c2f.gif)

> Example screen reader announcement

[← Back to documentation](/README.md#documentation-)
