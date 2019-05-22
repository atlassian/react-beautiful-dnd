# Dragging `<svg>`s

> Summary: `react-beautiful-dnd` does not support the usage of `<svg>` (`SVGElement`) for a `<Draggable />` or it's _drag handle_. You are still able to drag SVG's around using a number of different strategies listed below

## Background: [`HTMLElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)

We require that a `<Draggable />` and its drag handle be a `HTMLElement`. Almost every element that you make in the browser is a `HTMLElement`. [See huge list on MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element). A `HTMLElement` extends [`Element`](https://developer.mozilla.org/en-US/docs/Web/API/Element)

![HTMLElement](https://user-images.githubusercontent.com/2182637/42302315-9150d4e0-805d-11e8-8345-71bc32135203.png)

## Focus management

We use and manipulate focus on a drag handle during a drag if it is needed. This is especially true for keyboard dragging that relies on focus management. See our [focus guide](/docs/guides/focus.md).

## Enter [`SVGElement`](https://developer.mozilla.org/en-US/docs/Web/API/SVGElement) 🖼

An `SVGElement` does not implement `HTMLElement`, and directly extends `Element`.

![SVGElement](https://user-images.githubusercontent.com/2182637/42304424-8360143e-8069-11e8-9693-64f5e9763315.png)

`SVGElement` has **inconsistent**, and sometimes, **non-existent** focus management behavior across browsers. [more information](https://allyjs.io/tutorials/focusing-in-svg.html). Trying to call `svgElement.focus()` on IE11 will cause an exception. There are also additional concerns:

- Applying `aria-*` to a `<svg>` has unknown screen reader implications.
- Inconsistent `tabindex` behaviour in older browsers

One of the core values of `react-beautiful-dnd` is accessibility

> Beautiful and **accessible** drag and drop for lists with `React`

## But I want to drag using a `<svg>`!

### Option 1: Wrap in an `HTMLElement`

In order to provide the best accessibility and cross browser experience for consumers we enforce that `SVGElement`s need to be wrapped in a `HTMLElement` such as `<span>` or `<div>` if you want to have them as your `<Draggable />` or _drag handle_.

```js
// ❌ not supported
<Draggable draggableId="not-supported" index={0}>
  {provided => (
    <svg
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      ref={provided.innerRef}
      {/* other SVG stuff */}
    />
  )}
</Draggable>
```

```js
// ✅ supported
<Draggable draggableId="supported" index={0}>
{provided => (
  <span
    {...provided.draggableProps}
    {...provided.dragHandleProps}
    ref={provided.innerRef}
    >
      <svg {/* other SVG stuff */} />
  </span>
)}
</Draggable>
```

### Option 2: use an `<img>` tag

You can use the `src` of an `<img>` tag (which is a `HTMLElement`) to have a draggable SVG.

```js
// ✅ supported
<Draggable draggableId="supported" index={0}>
  {provided => (
    <img
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      ref={provided.innerRef}
      src="my-cool-image.svg"
    />
  )}
</Draggable>
```

> You can read more about this approach on [CSS-Tricks](https://css-tricks.com/using-svg/)

### Option 3: use `background-image`

Alternatively you could also apply the SVG as a `background-image` to another `HTMLElement`.

```css
.item {
  background-image: url(my-cool-image.svg);
}
```

```js
// ✅ supported
<Draggable draggableId="supported" index={0}>
  {provided => (
    <div
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      ref={provided.innerRef}
      className="item"
    />
  )}
</Draggable>
```

> You can read more about this approach on [CSS-Tricks](https://css-tricks.com/using-svg/)

[← Back to documentation](/README.md#documentation-)
