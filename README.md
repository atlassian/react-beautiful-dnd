<p align="center">
  <img src="https://raw.githubusercontent.com/alexreardon/files/master/resources/react-beautiful-dnd-logo.png" />
</p>
<h1 align="center">react-beautiful-dnd</h1>

<div align="center">

**Beautiful** and **accessible** drag and drop for lists with [`React`](https://facebook.github.io/react/)

[![CircleCI branch](https://img.shields.io/circleci/project/github/atlassian/react-beautiful-dnd/master.svg)](https://circleci.com/gh/atlassian/react-beautiful-dnd/tree/master)
[![npm](https://img.shields.io/npm/v/react-beautiful-dnd.svg)](https://www.npmjs.com/package/react-beautiful-dnd)

![quote application example](https://raw.githubusercontent.com/alexreardon/files/master/resources/website-board.gif?raw=true)

[Play with this example if you want!](TODO)

</div>

## Core characteristics 💐♿️🚀

- Beautiful and natural movement of items 💐
- Accessible: powerful keyboard and screen reader support ♿️
- [Extremely performant](/docs/general/media.md) 🚀
- Clean and powerful api which is simple to get started with
- Plays extremely well with standard browser interactions
- Unopinionated styling
- No creation of additional wrapper dom nodes - flexbox and focus management friendly!

## Get started 👩‍🏫

We have created [a free course on `egghead.io`](https://egghead.io/courses/beautiful-and-accessible-drag-and-drop-with-react-beautiful-dnd) to help people get started with `react-beautiful-dnd` as quickly as possible.

[![course-logo](https://user-images.githubusercontent.com/2182637/43372837-8c72d3f8-93e8-11e8-9d92-a82adde7718f.png)](https://egghead.io/courses/beautiful-and-accessible-drag-and-drop-with-react-beautiful-dnd)

## Currently supported feature set

- Vertical lists ↕
- Horizontal lists ↔
- Movement between lists (▤ ↔ ▤)
- Combining items (see [combining guide](/docs/guides/combining.md))
- Mouse 🐭, keyboard 🎹 and touch 👉📱 (mobile, tablet and so on) support
- [Multi drag support](/docs/patterns/multi-drag.md)
- Incredible screen reader support - we provide an amazing experience for english screen readers out of the box 📦. We also provide complete customisation control and internationalisation support for those who need it 💖
- Conditional [dragging](https://github.com/atlassian/react-beautiful-dnd#props-1) and [dropping](https://github.com/atlassian/react-beautiful-dnd#conditionally-dropping)
- Multiple independent lists on the one page
- Flexible item sizes - the draggable items can have different heights (vertical lists) or widths (horizontal lists)
- Add and remove `Draggable`s during a drag (see [changes while dragging guide](/docs/guides/changes-while-dragging.md))
- Compatible with semantic table reordering - [table pattern](/docs/patterns/tables.md)
- Auto scrolling - automatically scroll containers and the window as required during a drag (even with keyboard 🔥)
- Custom drag handles - you can drag a whole item by just a part of it
- Compatible with [`ReactDOM.createPortal`](https://reactjs.org/docs/portals.html) - [portal pattern](/docs/patterns/using-a-portal.md)
- 🌲 Tree support through the [`@atlaskit/tree`](https://atlaskit.atlassian.com/packages/core/tree) package
- A `Droppable` list can be a scroll container (without a scrollable parent) or be the child of a scroll container (that also does not have a scrollable parent)
- Independent nested lists - a list can be a child of another list, but you cannot drag items from the parent list into a child list
- Server side rendering compatible
- Plays well with [nested interactive elements](https://github.com/atlassian/react-beautiful-dnd#interactive-child-elements-within-a-draggable) by default

## Documentation 📖

### General 👋

- [Examples and samples](/docs/general/examples.md)
- [Installation](/docs/general/installation.md)
- [Get started](https://egghead.io/courses/beautiful-and-accessible-drag-and-drop-with-react-beautiful-dnd)
- [Design philosophy](/docs/general/philosphy.md) - _worth a read to understand the motivations and thinking behind the library_
- [Community and addons](/docs/general/community-and-addons.md)
- [Release notes and changelog](https://github.com/atlassian/react-beautiful-dnd/releases)
- [Upgrading](/docs/general/upgrading.md)
- [Media](/docs/general/media.md)
- [Road map](https://github.com/atlassian/react-beautiful-dnd/issues)

### API 🏋️‍

[TODO: diagram]

- [`<DragDropContext />`](/docs/api/drag-drop-context.md): Wraps the part of your application you want to have drag and drop enabled for
- [`<Droppable />`](/docs/api/droppable.md): An area that can be dropped into. Contains `<Draggable />`s
- [`<Draggable />`](/docs/api/draggable.md): What can be dragged around
- [`resetServerContext()`](/docs/api/reset-server-context.md): Utility for server side rendering (SSR)

### Guides 🗺

- [`<DragDropContext>` responders](/docs/guides/responders.md) - _`onDragStart`, `onDragUpdate`, `onDragEnd` and `onBeforeDragStart`_
- [Combining `<Draggable>`s](/docs/guides/combining.md)
- [Common setup issues](/docs/guides/common-setup-issues.md)
- [Using `innerRef`](/docs/guides/using-inner-ref.md)
- [Developer warnings and how to disable them](/docs/guides/developer-warnings.md)
- [Rules for `draggableId` and `droppableId`s](/docs/guides/identifiers.md)
- [Customising or skipping the drop animation](/docs/guides/drop-animation.md)
- [Controlling the screen reader](/docs/guides/screen-reader.md)
- [`TypeScript` and `flow`](/docs/guides/types.md)
- [Dragging `<svg>`s](/docs/guides/dragging-svgs.md)
- [Non-visible preset styles](/docs/guides/preset-styles.md)
- [How we detect scroll containers](/docs/guides/how-we-detect-scroll-containers.md)
- [How we use dom events](/docs/guides/how-we-use-dom-events.md) - _Useful if you need to build on top of `react-beautiful-dnd`_
- [Adding `<Draggable>`s during a drag](/docs/guides/changes-while-dragging.md) - _⚠️ advanced_

### Patterns 👷‍

- [Multi drag](/docs/patterns/multi-drag.md)
- [Tables](/docs/patterns/tables.md)
- [Using a portal (`ReactDOM.createPortal`)](/docs/patterns/using-a-portal.md)

## Read this in other languages

- [![kr](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/24/South-Korea.png) **한글/Korean**](https://github.com/LeeHyungGeun/react-beautiful-dnd-kr)

- [![china](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/24/China.png) **中文/Chinese**](https://github.com/chinanf-boy/react-beautiful-dnd-zh)

## Carefully designed animations

With things moving a lot it would be easy for the user to become distracted by the animations or for them to get in the way. We have tweaked the various animations to ensure the right balance of guidance, performance and interactivity.

### Dropping

We have designed a drop animation that feels weighted and physical. It is based on a [`spring`](https://developer.android.com/guide/topics/graphics/spring-animation) and uses a CSS animation with a dynamic duration to achieve the effect.

![result-curve](https://user-images.githubusercontent.com/2182637/48235467-1ce34200-e412-11e8-8c69-2060a0c2f61a.png)

> Animation curve used when dropping. Duration is dynamic based on distance to travel

You can tweak the drop animation if you would like to. We have created a guide: [drop animation](/docs/guides/drop-animation.md)

### Moving out of the way

Items that are moving out of the way of a dragging item do so with a CSS transition rather than physics. This is to maximise performance by allowing the GPU to handle the movement. The CSS animation curve has been designed to communicate getting out of the way.

How it is composed:

1.  A warm up period to mimic a natural response time
2.  A small phase to quickly move out of the way
3.  A long tail so that people can read any text that is being animated in the second half of the animation

![animation curve](https://raw.githubusercontent.com/alexreardon/files/master/resources/dnd-ease-in-out-small.png?raw=true)

> Animation curve used when moving out of the way

## Caring about the interaction details

### Focus management

`react-beautiful-dnd` does not create any wrapper elements. This means that it will not impact the usual tab flow of a document. For example, if you are wrapping an _anchor_ tag then the user will tab to the anchor directly and not an element surrounding the _anchor_. Whatever element you wrap will be given a `tab-index` to ensure that users can tab to the element to perform keyboard dragging.

### Auto scrolling

When a user drags a `Draggable` near the edge of a _container_ we automatically scroll the container as we are able to in order make room for the `Draggable`.

> A _container_ is either a `Droppable` that is scrollable or has a scroll parent - or the `window`.

| Mouse and touch                                                                                                           | Keyboard                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| ![auto-scroll-mouse](https://user-images.githubusercontent.com/2182637/36520373-c9e2cb7e-17e4-11e8-9e93-4d2389d51fa4.gif) | ![auto-scroll-keyboard](https://user-images.githubusercontent.com/2182637/36520375-cc1aa45c-17e4-11e8-842d-94aed694428a.gif) |

It also works in multi list configurations with all input types

| Mouse and touch                                                                                                                 | Keyboard                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| ![auto-scroll-board-mouse](https://user-images.githubusercontent.com/2182637/36520670-57752526-17e6-11e8-95b3-b5a3978a5312.gif) | ![auto-scroll-board-keyboard](https://user-images.githubusercontent.com/2182637/36520650-3d3638f8-17e6-11e8-9cba-1fb439070285.gif) |

#### For mouse and touch inputs 🐭📱

When the center of a `Draggable` gets within a small distance from the edge of a container we start auto scrolling. As the user gets closer to the edge of the container we increase the speed of the auto scroll. This acceleration uses an easing function to exponentially increase the rate of acceleration the closer we move towards the edge. We reach a maximum rate of acceleration a small distance from the true edge of a container so that the user does not need to be extremely precise to obtain the maximum scroll speed. This logic applies for any edge that is scrollable.

The distances required for auto scrolling are based on a percentage of the height or width of the container for vertical and horizontal scrolling respectively. By using percentages rather than raw pixel values we are able to have a great experience regardless of the size and shape of your containers.

##### Mouse wheel and trackpads

In addition to auto scrolling we also allow users to scroll the window or a `Droppable` manually using their _mouse wheel_ or _trackpad_ 👌

##### A note about big `Draggable`s

If the `Draggable` is bigger than a container on the axis you are trying to scroll - we will not permit scrolling on that axis. For example, if you have a `Draggable` that is longer than the height of the window we will not auto scroll vertically. However, we will still permit scrolling to occur horizontally.

##### iOS auto scroll shake 📱🤕

When auto scrolling on an iOS browser (webkit) the `Draggable` noticeably shakes. This is due to a [bug with webkit](https://bugs.webkit.org/show_bug.cgi?id=181954) that has no known work around. We tried for a long time to work around the issue! If you are interesting in seeing this improved please engage with the [webkit issue](https://bugs.webkit.org/show_bug.cgi?id=181954).

#### For keyboard dragging 🎹

We also correctly update the scroll position as required when keyboard dragging. In order to move a `Draggable` into the correct position we can do a combination of a `Droppable` scroll, `window` scroll and manual movements to ensure the `Draggable` ends up in the correct position in response to user movement instructions. This is boss 🔥.

This is amazing for users with visual impairments as they can correctly move items around in big lists without needing to use mouse positioning.

### Accessibility

Traditionally drag and drop interactions have been exclusively a mouse or touch interaction. This library ships with support for drag and drop interactions **using only a keyboard**. This enables power users to drive their experience entirely from the keyboard. As well as opening up these experiences to users who would have been excluded previously.

We provide **fantastic support for screen readers** to assist users with visual (or other) impairments. We ship with english messaging out of the box 📦. However, you are welcome to override these messages by using the `announce` function that it provided to all of the `DragDropContext > responder` functions.

See our [screen reader guide](/docs/guides/screen-reader.md) for a guide on crafting useful screen reader messaging.

#### Example screen reader behaviour

![screen-reader-text](https://user-images.githubusercontent.com/2182637/36571009-d326d82a-1888-11e8-9a1d-e44f8b969c2f.gif)

## Mouse dragging

### Sloppy clicks and click prevention 🐱🎁

When a user presses the mouse down on an element, we cannot determine if the user was clicking or dragging. Also, sometimes when a user clicks they can move the cursor slightly — a sloppy click. So we only start a drag once the user has moved beyond a certain distance with the mouse down (the drag threshold) — more than they would if they were just making a sloppy click. If the drag threshold is not exceeded then the user interaction behaves just like a regular click. If the drag threshold is exceeded then the interaction will be classified as a drag and the standard click behaviour will not occur.

This allows consumers to wrap interactive elements such as an anchor and have it be both a standard anchor as well as a draggable item in a natural way.

(🐱🎁 is a [schrodinger's cat](https://www.youtube.com/watch?v=IOYyCHGWJq4) joke)

> To see more in depth information about how we impact standard browser events see our [how we use DOM events guide](/docs/guides/how-we-use-dom-events.md)

### Keyboard shortcuts: mouse dragging

When a drag **is not occurring** `react-beautiful-dnd` does not impact any of the standard keyboard interactions (it has no listeners bound).

When a drag **is occurring** with a _mouse_ the user is able to execute the following keyboard shortcuts:

- **escape** <kbd>esc</kbd> - cancel the drag

During a mouse drag the following standard keyboard events are prevented to prevent a bad experience:

- **tab** <kbd>tab ↹</kbd> - preventing tabbing
- **enter** <kbd>⏎</kbd> - preventing submission

Other than these explicitly prevented keyboard events all standard keyboard events should work as expected.

## Keyboard dragging

`react-beautiful-dnd` supports dragging with only a keyboard. We have audited how our keyboard shortcuts interact with standard browser keyboard interactions. When the user is not dragging they can use their keyboard as they normally would. While dragging we override and disable certain browser shortcuts (such as `tab`) to ensure a fluid experience for the user.

> To see more indepth information about how we impact standard browser events see our [how we use DOM events guide](/docs/guides/how-we-use-dom-events.md)

### Keyboard shortcuts: keyboard dragging

When a drag is not occurring, the user will be able to navigate through the `Draggable`'s on a page using the standard **tab** <kbd>tab ↹</kbd> key to move forward through the tabbable elements and (**shift** + **tab**) (<kbd>shift</kbd> + )<kbd>tab ↹</kbd>) to move backwards. We achieve this by adding a `tab-index` to the `Draggable`. When a `Draggable` has focus the **spacebar** <kbd>space</kbd> will **lift** a `Draggable`. This will start the drag.

Once a drag is started the following keyboard shortcuts can be used:

- **spacebar** <kbd>space</kbd> - drop the `Draggable`
- **escape** <kbd>esc</kbd> - cancel the drag

The following commands are also available but they depend on the `type` of `Droppable` that the `Draggable` is _currently_ in:

#### Within a vertical list

- **Up arrow** <kbd>↑</kbd> - move a `Draggable` upwards in a `Droppable`
- **Down arrow** <kbd>↓</kbd> - move a `Draggable` downwards in a `Droppable`
- **Right arrow** <kbd>→</kbd> - move a `Draggable` to a `Droppable` to the _right_ of the current `Droppable` (move to new list)
- **Left arrow** <kbd>←</kbd> - move a `Draggable` to a `Droppable` to the _left_ of the current `Droppable` (move to new list)

#### Within a horizontal list

- **Up arrow** <kbd>↑</kbd> - move a `Draggable` to a `Droppable` to _above_ the current `Droppable` (move to new list)
- **Down arrow** <kbd>↓</kbd> - move a `Draggable` to a `Droppable` to _below_ the current `Droppable` (move to new list)
- **Right arrow** <kbd>→</kbd> - move a `Draggable` to the _right_ in the current `Droppable`
- **Left arrow** <kbd>←</kbd> - move a `Draggable` to the _left_ in the current `Droppable`

During a drag the following standard keyboard events have their default behaviour prevented (through `event.preventDefault()`) to avoid a bad experience:

- **tab** <kbd>tab ↹</kbd> - preventing tabbing
- **enter** <kbd>⏎</kbd> - preventing submission

## Touch dragging

`react-beautiful-dnd` supports dragging on touch devices such as mobiles and tablets.

![Mobile landscape](https://github.com/alexreardon/files/blob/master/resources/iphone-landscape.gif?raw=true)

> Recorded on iPhone 6s

### Understanding intention: tap, force press, scroll and drag

When a user presses their finger (or other input) on a `Draggable` we are not sure if they where intending to _tap_, _force press_, _scroll the container_ or _drag_. **As much as possible `react-beautiful-dnd` aims to ensure that a users default interaction experience remains unaffected**.

> To see more indepth information about how we impact standard browser events see our [how we use DOM events guide](/docs/guides/how-we-use-dom-events.md)

### Starting a drag: long press

A user can start a drag by holding their finger 👇 on an element for a small period of time 🕑 (long press)

### Tap support

If the user lifts their finger before the timer is finished then we release the event to the browser for it to determine whether to perform the standard tap / click action. This allows you to have a `Draggable` that is both clickable such as a anchor as well as draggable. If the item was dragged then we block the tap action from occurring.

### Native scrolling support

If we detect a `touchmove` before the long press timer expires we cancel the pending drag and allow the user to scroll normally. This means that the user needs to be fairly intentional and precise with their grabbing. Once the first `touchmove` occurs we have to either opt in or out of native scrolling.

- If the long press timer **has not** expired: _allow native scrolling and prevent dragging_
- If the long press timer **has** expired: _a drag has started and we prevent native scrolling_

### Force press support

> Safari only

If the user force presses on the element before they have moved the element (even if a drag has already started) then the drag is cancelled and the standard force press action occurs. For an anchor this is a website preview.

### Vibration

> This is merely an idea - it is up to you to add this if you want this behavior.

If you like you could also trigger a [vibration event](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) when the user picks up a `Draggable`. This can provide tactile feedback that the user is doing something. It currently is only supported in Chrome on Android.

```js
class App extends React.Component {
  onDragStart = () => {
    // good times
    if (window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }
  };
  /*...*/
}
```

## Multi drag

We have created a [multi drag pattern](/docs/patterns/multi-drag.md) that you can build on top of `react-beautiful-dnd` in order to support dragging multiple `Draggable` items at once.

![multi drag demo](https://user-images.githubusercontent.com/2182637/37322724-7843a218-26d3-11e8-9ebb-8d5853387bb3.gif)

## Preset styles

We apply a number of _non-visible styles_ to facilitate the dragging experience. We have a guide describing what they are and how they are applied in the various stages of a drag interaction: [guide: preset styles](/docs/guides/preset-styles.md);

## API

Okay, into the fun stuff - so how do you use the library?

## Use the html5 `doctype`

Be sure that you have specified the html5 `doctype` ([Document Type Definition - DTD](https://developer.mozilla.org/en-US/docs/Glossary/Doctype)) for your `html` page:

```html
<!DOCTYPE html>
```

A `doctype` impacts browser layout and measurement apis. Not specifying a `doctype` is a world of pain 🔥. Browsers will use some other `doctype` such as ["Quirks mode"](https://en.wikipedia.org/wiki/Quirks_mode) which can drastically change layout and measurement ([more information](https://www.w3.org/QA/Tips/Doctype)). The html5 `doctype` is our only supported `doctype`.

For non `production` builds we will log a warning to the `console` if a html5 `doctype` is not found. You can [disable the warning](#disable-warnings) if you like.

## Engineering health

### Typed

This codebase is typed with [flowtype](https://flow.org) to promote greater internal consistency and more resilient code.

### Tested

This code base employs a number of different testing strategies including unit, performance and integration tests. Testing various aspects of the system helps to promote its quality and stability.

While code coverage is [not a guarantee of code health](https://stackoverflow.com/a/90021/1374236), it is a good indicator. This code base currently sits at **~90% coverage**.

### Performance

This codebase is designed to be **extremely performant** - it is part of its DNA. It is designed to perform the smallest amount of updates possible. You can have a read about performance work done for `react-beautiful-dnd` here:

- [Rethinking drag and drop](https://medium.com/@alexandereardon/rethinking-drag-and-drop-d9f5770b4e6b)
- [Dragging React performance forward](https://medium.com/@alexandereardon/dragging-react-performance-forward-688b30d40a33)
- [Grabbing the flame 🔥](https://medium.com/@alexandereardon/grabbing-the-flame-290c794fe852)

## Size

Great care has been taken to keep the library as light as possible. It is currently **~31kb (gzip)** in size. There could be a smaller net cost if you where already using one of the underlying dependencies.

## Supported browsers

This library supports the standard [Atlassian supported browsers](https://confluence.atlassian.com/cloud/supported-browsers-744721663.html) for desktop:

| Desktop                              | Version                                              |
| ------------------------------------ | ---------------------------------------------------- |
| Microsoft Internet Explorer(Windows) | Version 11                                           |
| Microsoft Edge                       | Latest stable version supported                      |
| Mozilla Firefox (all platforms)      | Latest stable version supported                      |
| Google Chrome (Windows and Mac)      | Latest stable version supported                      |
| Safari (Mac)                         | Latest stable version on latest OS release supported |

| Mobile                   | Version                                                   |
| ------------------------ | --------------------------------------------------------- |
| Chrome (Android and iOS) | Latest stable version supported                           |
| Mobile Safari (iOS)      | Latest stable version supported                           |
| Android (Android)        | The default browser on Android 4.0.3 (Ice Cream Sandwich) |

## Author

Alex Reardon [@alexandereardon](https://twitter.com/alexandereardon)

## Collaborators

- Bogdan Chadkin [@IAmTrySound](https://twitter.com/IAmTrySound)
- Luke Batchelor [@alukebatchelor](https://twitter.com/alukebatchelor)
- Jared Crowe [@jaredjcrowe](https://twitter.com/jaredjcrowe)
- Many other [@Atlassian](https://twitter.com/Atlassian)'s!
