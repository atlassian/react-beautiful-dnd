# Developer only warnings 👷‍

For common setup and usage issues and errors `react-beautiful-dnd` will log some information `console` for development builds (`process.env.NODE_ENV !== 'production'`). These logs are stripped from productions builds to save kbs and to keep the `console` clean.

![dev only warnings](https://user-images.githubusercontent.com/2182637/46385261-98a8eb00-c6fe-11e8-9b46-0699bf3e6043.png)

How to drop the developer messages from your bundles:

- [React docs](https://reactjs.org/docs/optimizing-performance.html#use-the-production-build)
- [webpack instructions](https://webpack.js.org/guides/production/#specify-the-mode)
- [rollup instructions](https://github.com/rollup/rollup-plugin-replace)

## Disable warnings

If you want to disable the warnings in development, you just need to update a flag:

```js
// disable all react-beautiful-dnd development warnings
window['__react-beautiful-dnd-disable-dev-warnings'] = true;
```

Disabling the warnings will not stop a drag from being aborted in the case of an error. It only disabling the logging about it.
