# How we detect scroll containers

> Generally you will not need to read this guide 😊. Detection of scroll containers "should just work". However, if you are having issues with it you can dig more deeply into this guide 🕵️‍

`react-beautiful-dnd` will automatically detect the scroll containers for your application when a drag is starting. It does this by looking at the _computed_ `overflowX` and `overflowY` values of an element.

If `react-beautiful-dnd` finds an element that has a _computed_ `overflowX` or `overflowY` set to `scroll` or `auto` then that element is marked as a scroll container.

## Background information about `overflow`

The css property `overflow` (and `overflow-x`, `overflow-y`) controls what happens when the content of an element is bigger than the elements size.

> For more information about `overflow` you can check out the [CSS-Tricks overflow guide](https://css-tricks.com/almanac/properties/o/overflow/) or the [MDN overflow guide](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow)

### `overflow` values

- `visible`: _(default)_ content will grow beyond boundary of any containing box without any clipping or scrollbars
- `scroll`: clip overflow and always show a scrollbar, even if there is no content being overflowed
- `auto`: clip overflow and only show scrollbar if there is any content in the overflow

### Shorthand

Setting `overflow: $value` is the same as setting `overflow-x: $value` and `overflow-y: $value`

### _Computed_ values

If only one axis has `overflow-[x|y]: hidden` and the other is `visible` _(the default value)_ then it will be _computed_ as `auto`.

> Computed value: as specified, except with visible/clip computing to auto/hidden (respectively) if one of overflow-x or overflow-y is neither visible nor clip
>
> - https://www.w3.org/TR/css-overflow-3/#overflow-properties

## `document.body`

`document.body` (`body`) is different from `document.documentElement` (the `html` element). Any scroll on the `html` element is considered a `window` scroll. Most of the time any scroll bar that would have appeared on the `body` will be merged with the `html` scroll bar. However, there are situations where they can have different scrollable areas.

The `body` is considered a scroll container when:

1. The `body` has `overflow-[x|y]: auto | scroll` AND
2. The parent of `body` (`html`) has an `overflow-[x|y]` set to anything except `visible` AND
3. There is a current overflow in the `body`

### How we detect current overflow on the `body`

We leverage box model information to detect if there is current overflow in the body

![apis](https://user-images.githubusercontent.com/2182637/48534396-18c89000-e8fc-11e8-9ab6-90372bfa5be5.jpeg)

> From [@alexandereardon](https://twitter.com/alexandereardon)'s talk: ["What's in the box"](https://twitter.com/alexandereardon/status/1058210532824616960)

So if the `scroll*` is greater than `client*` we know that there is currently overflow in the element

```js
const isCurrentlyOverflowed = (el: Element): boolean =>
  el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientWidth;
```
