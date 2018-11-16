# How we detect scroll containers

> Generally you will not need to read this guide 😊. Detection of scroll containers "should just work". However, if you are having issues with it you can dig more deeply into this guide 🕵️‍

`react-beautiful-dnd` will automatically detect the scroll containers for your application when a drag is starting. It does this by looking at the _computed_ `overflowX` and `overflowY` values of an element.

If `react-beautiful-dnd` finds an element that has a _computed_ `overflowX` or `overflowY` set to `scroll` or `auto` then that element is marked as a scroll container.

## Exceptions

`document.body` and `document.documentElement` will not be marked as scroll containers. When they scroll they fire scroll events on the `window`. It does not matter what `overflow` related properties you set on these elements, they will not be considered.

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

If only one axis has `overflow-[x|y]: hidden` and the other is `visible` then it will be _computed_ as `auto`.

> Computed value: as specified, except with visible/clip computing to auto/hidden (respectively) if one of overflow-x or overflow-y is neither visible nor clip
>
> - https://www.w3.org/TR/css-overflow-3/#overflow-properties

## Edge case: only `hidden` overflow on one axis

If you set `overflow: hidden`, or both `overflow-x: hidden` and `overflow-y: hidden` then the element will not be marked as a scroll container. All good ✌️.

The edge case is if you set **only one** of `overflow-x` or `overflow-y` to `hidden`. By default the browser will set the other property to `auto` (even though the default is `visible`) [See spec](https://www.w3.org/TR/css-overflow-3/#overflow-properties). This makes it impossible for us to know if you manually set `overflow-[x|y]` to `auto` or if it is the result of coercion because one axis is `hidden`.

We have a hard time detecting if an element is a scroll container when:

- `overflow-[x|y]` is set to `hidden` on only one axis
- we detect an `auto` value on the other `overflow-[x|y]`

| Case                                         | Is a scroll container? | Can safely detect? |
| -------------------------------------------- | ---------------------- | ------------------ |
| `overflow: auto`                             | Yes                    | Yes ✅             |
| `overflow: scroll`                           | Yes                    | Yes ✅             |
| `overflow: hidden`                           | No                     | Yes ✅             |
| `overflow-x: visible`, `overflow-y: visible` | No                     | Yes ✅             |
| `overflow-x: visible`, `overflow-y: auto`    | Yes                    | Yes ✅             |
| `overflow-x: visible`, `overflow-y: scroll`  | Yes                    | Yes ✅             |
| `overflow-x: visible`, `overflow-y: hidden`  | No                     | No 🛑              |
| `overflow-x: auto`, `overflow-y: visible`    | Yes                    | Yes ✅             |
| `overflow-x: auto`, `overflow-y: auto`       | Yes                    | Yes ✅             |
| `overflow-x: auto`, `overflow-y: scroll`     | Yes                    | Yes ✅             |
| `overflow-x: auto`, `overflow-y: hidden`     | Yes                    | No 🛑              |
| `overflow-x: scroll`, `overflow-y: visible`  | Yes                    | Yes ✅             |
| `overflow-x: scroll`, `overflow-y: auto`     | Yes                    | Yes ✅             |
| `overflow-x: scroll`, `overflow-y: scroll`   | Yes                    | Yes ✅             |
| `overflow-x: scroll`, `overflow-y: hidden`   | Yes                    | Yes ✅             |
| `overflow-x: hidden`, `overflow-y: visible`  | No                     | No 🛑              |
| `overflow-x: hidden`, `overflow-y: auto`     | Yes                    | No 🛑              |
| `overflow-x: hidden`, `overflow-y: scroll`   | Yes                    | Yes ✅             |
| `overflow-x: hidden`, `overflow-y: hidden`   | No                     | Yes ✅             |

### What can you do to help?

If you do want to be clear than an element is a scroll container, and you need one axis to be `hidden` (eg `overflow-x: hidden`), then set the other axis to `scroll` (eg: `overflow-y: scroll`)

### The fallback

If we end up in a situation where we detect `overflow-[x|y]: hidden` on a single axis, and `auto` on the other, then we fallback to another strategy to detect if the element is a scroll container. We leverage some information from the box model:

![apis](https://user-images.githubusercontent.com/2182637/48534396-18c89000-e8fc-11e8-9ab6-90372bfa5be5.jpeg)

```js
const isCurrentlyOverflowed = (el: Element): boolean =>
  el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientWidth;
```

This strategy is pretty good. However, it won't catch the case where:

- you have set `overflow-[x|y]: auto` on one axis and it currently does not have scroll bars
- an item moves into a `Droppable` during a drag, which adds space to the list and causes overflow and the scrollbars to appear

> This is a bit of an extreme edge case, and generally will not have any significant impact even if a user does run into it 👍
