# Avoiding image flickering

If your `<Draggable />` has a image inside of it, then you might notice that sometimes it flashes sometimes. Why is that?

Some behaviours will cause a `<Draggable />` to be **recreated**. This is where the original DOM element is destroyed, and a new DOM element is created. When the new DOM element is inserted into the DOM then the browser will try to load the image from scratch. Image flashing is caused by the gap between the new element being inserted into the DOM and the image being loaded.

These are the actions that can cause a `<Draggable />` to be recreated:

- [reparenting](/docs/guides/reparenting.md) a `<Draggable />` (using the cloning api, or using your own portal)
- moving `<Draggable />` into a new list. React will not shift the original element. It will recreate one.

## How can you prevent image flickering?

The big idea is you want to allow the browser to load the image **instantly** when it is recreated.

Here are some ways you can do that:

### Cache control

[TODO](TODO)

### Inline your images

Base64 encode your images and use that as the source. That way there is no need to talk to the server.

```diff
- <img src="face.png">

+ <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAA...">
```

You can use the [webpack url-loader](https://github.com/webpack-contrib/url-loader) to help.

⚠️ You will want to make sure your images are quite small to avoid blowing out the size of your DOM