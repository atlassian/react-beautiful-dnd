# Avoiding image flickering

> Often all you need to do is close your browsers dev tools! See 'HTTP cache headers below'

If your `<Draggable />` has a image inside of it, then you might notice that sometimes it flashes sometimes. Why is that?

Some behaviours will cause a `<Draggable />` to be **recreated**. This is where the original DOM element is destroyed, and a new DOM element is created. When the new DOM element is inserted into the DOM then the browser will try to load the image from scratch. Image flashing is caused by the gap between the new element being inserted into the DOM and the image being loaded.

These are the actions that can cause a `<Draggable />` to be recreated:

- [Reparenting](/docs/guides/reparenting.md) a `<Draggable />` (using the cloning api, or using your own portal)
- Moving `<Draggable />` into a new list. React will not shift the original element. It will recreate one.

## How can you prevent image flickering?

The big idea is you want to allow the browser to load the image **instantly** when it is recreated.

Here are some ways you can do that:

### HTTP cache headers

> When you open devtools, it can disable HTTP caching. So simply closing devtools might make your image flickering go away! 🤘

Generally speaking, a browser will not request an image that it already has cached and it will load instantly. You can use the [HTTP cache headers](https://devcenter.heroku.com/articles/increasing-application-performance-with-http-cache-headers) to tell a browser that an image can be cached. Ultimately the browser can decide to re-request the image if it wants to, but that would be an edge case.

We put together an [example on Glitch](https://glitch.com/~image-flickering) that shows off the impact of using HTTP cache headers.

### Inline your images

[Base64 encode](https://stackoverflow.com/questions/201479/what-is-base-64-encoding-used-for) your images and use that as the source. That way there is no need to talk to the server to get the source.

```diff
- <img src="/public/my-image.png">

+ <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAA...">
```

You can use the [webpack `url-loader`](https://github.com/webpack-contrib/url-loader) to help.

#### Drawbacks of this approach

- If the same image is used in multiple places, they all need to be downloaded independently
- The browser cannot defer image loading

You will want to keep your image sizes fairly small.

### Really anything else!

The big idea is that you don't want to be calling the server to refetch an image that has already been fetched. So anything you can use to do client side caching of images is fine. You could even use [service workers](https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker) if you want!

[← Back to documentation](/README.md#documentation-)
