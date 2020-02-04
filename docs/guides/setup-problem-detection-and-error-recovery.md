# When things mess up

> "People make mistakes. It's all a part of growing up and you never really stop growing" - [Duke of nuts (Adventure time)](https://adventuretime.fandom.com/wiki/Duke_of_Nuts)

- [Setup problem detection](#setup-problem-detection)
- [Error recovery](#error-recovery)

## Setup problem detection

For detectable setup problems `react-beautiful-dnd` will log some information `console` for development builds (`process.env.NODE_ENV !== 'production'`). These logs are stripped from productions builds to save kbs and to keep the `console` clean. Keep in mind, that any setup errors that are logged will cause things to **break** in fun and interesting ways - so it is worth ensuring that there are none.

![dev only warnings](https://user-images.githubusercontent.com/2182637/46385261-98a8eb00-c6fe-11e8-9b46-0699bf3e6043.png)

### Log rather than throw setup errors

Some setup problems will cause errors. These are logged with `console.error`. We do not `throw` these errors. This is because an infinite loop can be created.

<details>
  <summary>More details if you are interested</summary>

If we threw setup errors, here is the infinite loop:

1. Mount application
2. Error detected (we usually do it in a `useEffect`) and thrown
3. Error caught in `componentDidCatch`
4. React tree recovered (remounted). Goto step 2.

We could work around this loop condition, but it would lead to conditionally throwing, and otherwise logging. It is also tricky to avoid double logging of errors. Given that we are trying to recover the React tree, there is not a lot of value in throwing any setup problem in the first place. So we just log the problem in the `console`.

</details>

### Production builds

Here are a few guides on how to drop development only code from your production builds:

- [React docs](https://reactjs.org/docs/optimizing-performance.html#use-the-production-build)
- [webpack instructions](https://webpack.js.org/guides/production/#specify-the-mode)
- [rollup instructions](https://github.com/rollup/rollup-plugin-replace)

### Disable logging

If you want to disable the warnings in _development_, you just need to update a flag on the `window`:

```js
// disable all react-beautiful-dnd development warnings
window['__react-beautiful-dnd-disable-dev-warnings'] = true;
```

Note: this will not strip the messages from your production builds. See above for how to do that

## Error recovery

An error can occur when:

1. A `Error` is explicitly `throw`n by `react-beautiful-dnd` (an **rbd error**)
2. A `Error` is `throw`n by something else (a **non-rbd error**)
3. A **runtime error** occurs (eg `SyntaxError`, `TypeError`)

React [error boundaries](https://reactjs.org/docs/error-boundaries.html) do not catch all errors that can occur in `rbd`. So `rbd` uses a React error boundary as well as a `window` `error` event listener.

### Error is caught by a `rbd` error boundary

#### rbd error

- cancel any active drag (no choice about this really, [an error unmounts everything under the error boundary](https://codesandbox.io/s/react-error-boundaries-rfyds))
- log the error (non-production builds; will respect disabled logging)
- recover the React tree

#### non-rbd error or runtime error

- can any active drag
- **`throw` the error** for your own error boundary. We will not recover from errors that are not caused explicitly by `rbd`. A run time error (such as a `TypeError`) that is caused by `rbd` will not be recovered. `rbd` will only recover from explicitly thrown `rbd` errors.

### Error is caught by `window` `error` listener

#### rbd error

- Cancel any active drag.
- Log a warning stating that the drag has been cancelled (non-production builds; will respect disabled logging)
- Log the error
- Call `event.preventDefault()` on the event. This marks the event as consumed. See [how we use DOM events](/docs/guides/how-we-use-dom-events.md). It will also prevent any 'uncaught error' warnings in your `console`.

#### non-rbd error or runtime error

- Cancel any active drag.
- Log a warning stating that the drag has been cancelled (non-production builds; will respect disabled logging)

[← Back to documentation](/README.md#documentation-)
