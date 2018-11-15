# How we detect scroll containers

`react-beautiful-dnd` will automatically detect the scroll containers for your application when a drag is starting. It does this by looking at the computed `overflowX` and `overflowY` values of an element (setting `overflow: value` will set both `overflow-x` and `overflow-y` to `value`).

If `react-beautiful-dnd` finds an element that has `overflowX` or `overflowY` set to `scroll` or `auto` then that element is marked as a scroll container.

> `overflow: scroll`: always show scrollbars
> `overflow: auto`: show scrollbars if there is any content in the overflow

## Edge case: `overflow-x: hidden`

If you set `overflow: hidden`, or both `overflow-x: hidden` and `overflow-y: hidden` then the element will not be marked as a scroll container. All good.

The edge case is if you set **only one** of `overflow-x` or `overflow-y` to `hidden`. By default the browser will set the other property to `auto` (even though the default is `visible`). This makes it impossible for us to know if you manually set `overflow-*` to `auto`. We then cannot know if the element is a scroll container based on this information

| Case                                         | Is a scroll container? | Can safely detect? | Notes                                |
| -------------------------------------------- | ---------------------- | ------------------ | ------------------------------------ |
| `overflow: auto`                             | Yes                    | Yes ✅             |                                      |
| `overflow: scroll`                           | Yes                    | Yes ✅             |                                      |
| `overflow: hidden`                           | No                     | Yes ✅             |                                      |
| `overflow-x: visible`, `overflow-y: visible` | No                     | Yes ✅             |                                      |
| `overflow-x: visible`, `overflow-y: auto`    | Yes                    | Yes ✅             |                                      |
| `overflow-x: visible`, `overflow-y: scroll`  | Yes                    | Yes ✅             |                                      |
| `overflow-x: visible`, `overflow-y: hidden`  | Yes                    | No 🛑              |                                      |
| `overflow-x: auto`, `overflow-y: visible`    | Yes                    | Yes ✅             |                                      |
| `overflow-x: auto`, `overflow-y: auto`       | Yes                    | Yes ✅             |                                      |
| `overflow-x: auto`, `overflow-y: scroll`     | Yes                    | Yes ✅             |                                      |
| `overflow-x: auto`, `overflow-y: hidden`     | Yes                    | No 🛑              |                                      |
| `overflow-x: scroll`, `overflow-y: visible`  | Yes                    | Yes ✅             |                                      |
| `overflow-x: scroll`, `overflow-y: auto`     | Yes                    | Yes ✅             |                                      |
| `overflow-x: scroll`, `overflow-y: scroll`   | Yes                    | Yes ✅             |                                      |
| `overflow-x: scroll`, `overflow-y: hidden`   | Yes                    | Yes ✅             | `overflow-x` will remain as `scroll` |
| `overflow-x: hidden`, `overflow-y: visible`  | No                     | No 🛑              |                                      |
| `overflow-x: hidden`, `overflow-y: auto`     | Yes                    | No 🛑              |                                      |
| `overflow-x: hidden`, `overflow-y: scroll`   | Yes                    | No 🛑              |                                      |
| `overflow-x: hidden`, `overflow-y: hidden`   | No                     | Yes ✅             |                                      |

> Cases that involve **only one** overflow property being set to `hidden` make it hard to detect scroll containers.

### What can you do to help?

If you do want to be clear than an element is a scroll container, and you need one axis to be `hidden` (eg `overflow-x: hidden`), then set the other axis to `scroll` (eg: `overflow-y: scroll`)

### The fallback

If we end up in a situation where we detect `overflow-*: hidden` on a single axis, and `auto` on the other, then we fallback to another strategy to detect if the element is a scroll container. We leverage some information from the box model:

![apis](https://user-images.githubusercontent.com/2182637/48534396-18c89000-e8fc-11e8-9ab6-90372bfa5be5.jpeg)

```js
const isCurrentlyOverflowed = (el: Element): boolean =>
  el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientWidth;
```

This strategy is pretty good. However, it won't catch the case where you have set `overflow-*: auto` on one axis and it currently does not have scroll bars. If an item moves into a `Droppable` that causes overflow then we won't be able to account for it.

> This is a bit of an extreme edge case, and probably would not have any significant impact even if the user did hit into it 👍

## Exceptions

`document.body` and `document.documentElement` will not be marked as scroll containers. When they scroll they fire scroll events on the `window`. It does not matter what `overflow` related properties you set on these elements, they will not be considered.
