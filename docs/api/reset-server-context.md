# `resetServerContext`

The `resetServerContext` function should be used when server side rendering (SSR). It ensures context state does not persist across multiple renders on the server which would result in client/server markup mismatches after multiple requests are rendered on the server.

Use it before calling the server side render method:

```js
import { resetServerContext } from 'react-beautiful-dnd';
import { renderToString } from 'react-dom/server';

// ...

resetServerContext();
renderToString(...);
```
