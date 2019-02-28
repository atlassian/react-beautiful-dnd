# Auto scrolling

When a user drags a `<Draggable />` near the edge of a _container_ we automatically scroll the container as we are able to in order make room for the `<Draggable />`.

> A _container_ is either a `<Droppable />` that is scrollable or has a scroll parent - or the `window`.

| Mouse and touch                                                                                                           | Keyboard                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| ![auto-scroll-mouse](https://user-images.githubusercontent.com/2182637/36520373-c9e2cb7e-17e4-11e8-9e93-4d2389d51fa4.gif) | ![auto-scroll-keyboard](https://user-images.githubusercontent.com/2182637/36520375-cc1aa45c-17e4-11e8-842d-94aed694428a.gif) |

It also works in multi list configurations with all input types

| Mouse and touch                                                                                                                 | Keyboard                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| ![auto-scroll-board-mouse](https://user-images.githubusercontent.com/2182637/36520670-57752526-17e6-11e8-95b3-b5a3978a5312.gif) | ![auto-scroll-board-keyboard](https://user-images.githubusercontent.com/2182637/36520650-3d3638f8-17e6-11e8-9cba-1fb439070285.gif) |

## For mouse and touch inputs 🐭📱

When the center of a `<Draggable />` gets within a small distance from the edge of a container we start auto scrolling. As the user gets closer to the edge of the container we increase the speed of the auto scroll. This acceleration uses an easing function to exponentially increase the rate of acceleration the closer we move towards the edge. We reach a maximum rate of acceleration a small distance from the true edge of a container so that the user does not need to be extremely precise to obtain the maximum scroll speed. This logic applies for any edge that is scrollable.

The distances required for auto scrolling are based on a percentage of the height or width of the container for vertical and horizontal scrolling respectively. By using percentages rather than raw pixel values we are able to have a great experience regardless of the size and shape of your containers.

### Mouse wheel and trackpads

In addition to auto scrolling we also allow users to scroll the window or a `<Droppable />` manually using their _mouse wheel_ or _trackpad_ 👌

### A note about big `<Draggable />`s

If the `<Draggable />` is bigger than a container on the axis you are trying to scroll - we will not permit scrolling on that axis. For example, if you have a `<Draggable />` that is longer than the height of the window we will not auto scroll vertically. However, we will still permit scrolling to occur horizontally.

### iOS auto scroll shake 📱🤕

When auto scrolling on an iOS browser (webkit) the `<Draggable />` noticeably shakes. This is due to a [bug with webkit](https://bugs.webkit.org/show_bug.cgi?id=181954) that has no known work around. We tried for a long time to work around the issue! If you are interesting in seeing this improved please engage with the [webkit issue](https://bugs.webkit.org/show_bug.cgi?id=181954).

## For keyboard dragging 🎹♿️

We also correctly update the scroll position as required when keyboard dragging. In order to move a `<Draggable />` into the correct position we can do a combination of a `<Droppable />` scroll, `window` scroll and manual movements to ensure the `<Draggable />` ends up in the correct position in response to user movement instructions. This is boss 🔥.

This is amazing for users with visual impairments as they can correctly move items around in big lists without needing to use mouse positioning.

[Back to home](/README.md#documentation-)
