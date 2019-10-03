# Content Security Policy

> This page is to help you get around the CSP error: "Refused to apply inline style because it violates the following Content Security Policy directive: "style-src 'self'"."
> A huge thankyou to [@Zweder](https://github.com/Zweder) for driving this effort

Content Security Policy (CSP) is a way of controlling where a browser can download assets from, as well as what those assets are allowed to do.

Background reading on CSP

- [Google guide](https://developer.chrome.com/extensions/contentSecurityPolicy)
- [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Helmetjs guide](https://helmetjs.github.io/docs/csp/)

`react-beautiful-dnd` creates a `<style>` element in the `<head>` and dynamically updates it's value (see [/docs/guides/preset-styles.md] and [Dragging React performance forward](https://medium.com/@alexandereardon/dragging-react-performance-forward-688b30d40a33)). This is considered a *unsafe inline* and will violate the strict CSP policy: `Content-Security-Policy: style-src 'self'`

## Option 1: use `unsafe-inline`

Simple solution number one, use a looser `style-src 'unsafe-inline'`. ⚠️ This is not ideal as it will loosen your CSP.

```diff
- Content-Security-Policy: style-src 'self'
+ Content-Security-Policy: style-src 'unsafe-inline'
```

## Option 2: Use a `nonce`

You can use the stricter directive `Content-Security-Policy: style-src 'self'` as long as you provide a `nonce` (number used once).

The [JSS](https://cssinjs.org/?v=v10.0.0) project has a great [CSP guide](https://cssinjs.org/csp) which goes through how you can setup a a `nonce`. Once you have a `nonce` value in the browser you can pass it into a `<DragDropContext />` to tell `react-beautiful-dnd` to use the `nonce`.

```js
<DragDropContext nonce={getNonce()}>
{/*...*/}
</DragDropContext>
```

[← Back to documentation](/README.md#documentation-)
