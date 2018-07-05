# Using SVGs

> LTDR: `react-beautiful-dnd` does not support the dragging of `<svg>` elements. Wrap your `<svg>` in a `HTMLElement` such as `<span>` or `<div>` for great accessibility and cross browser support

## Background: [`HTMLElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)

We require that a `Draggable` and its drag handle be a `HTMLElement`.

> The HTMLElement interface represents any HTML element. Some elements directly implement this interface, others implement it via an interface that inherits it.
>
> \- [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)

A `HTMLElement` extends [`Element`](https://developer.mozilla.org/en-US/docs/Web/API/Element)

![HTMLElement](https://user-images.githubusercontent.com/2182637/42302315-9150d4e0-805d-11e8-8345-71bc32135203.png)

## Enter [`SVGElement`](https://developer.mozilla.org/en-US/docs/Web/API/SVGElement) 🖼

An `SVGElement` does not implement `HTMLElement`, and directly implements `Element`.

![SVGElement](https://user-images.githubusercontent.com/2182637/42304424-8360143e-8069-11e8-9693-64f5e9763315.png)

`SVGElement` has **inconsistent**, and sometimes, **non-existent** focus management behavior across browsers. [more information](https://allyjs.io/tutorials/focusing-in-svg.html). Trying to call `svgElement.focus()` on IE11 will cause an exception. Additionally, applying `aria-*` to SVG's has unknown screen reader implications.

One of the core values of `react-beautiful-dnd` is accessibility

> Beautiful, **accessible** drag and drop for lists with React.js

So in order to provide the best accessibility and cross browser experience for consumers we enforce that `SVGElement`s need to be wrapped in a `HTMLElement` such as `<span>` or `<div>` if you want to have them as your `Draggable` or _drag handle_.

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
