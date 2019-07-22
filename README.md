<p align="center">
  <img src="https://user-images.githubusercontent.com/2182637/53611918-54c1ff80-3c24-11e9-9917-66ac3cef513d.png" alt="react beautiful dnd logo" />
</p>
<h1 align="center">react-beautiful-dnd</h1>

<div align="center">

**Beautiful** and **accessible** drag and drop for lists with [`React`](https://facebook.github.io/react/)

[![CircleCI branch](https://img.shields.io/circleci/project/github/atlassian/react-beautiful-dnd/master.svg)](https://circleci.com/gh/atlassian/react-beautiful-dnd/tree/master)
[![npm](https://img.shields.io/npm/v/react-beautiful-dnd.svg)](https://www.npmjs.com/package/react-beautiful-dnd)

![quote application example](https://user-images.githubusercontent.com/2182637/53614150-efbed780-3c2c-11e9-9204-a5d2e746faca.gif)

[Play with this example if you want!](https://react-beautiful-dnd.netlify.com/iframe.html?selectedKind=board&selectedStory=simple)

</div>

## Core characteristics

- Beautiful and [natural movement](/docs/about/animations.md) of items 💐
- [Accessible](/docs/about/accessibility.md): powerful keyboard and screen reader support ♿️
- [Extremely performant](/docs/support/media.md) 🚀
- Clean and powerful api which is simple to get started with
- Plays extremely well with standard browser interactions
- [Unopinionated styling](/docs/guides/preset-styles.md)
- No creation of additional wrapper dom nodes - flexbox and focus management friendly!

## Get started 👩‍🏫

We have created [a free course on `egghead.io` 🥚](https://egghead.io/courses/beautiful-and-accessible-drag-and-drop-with-react-beautiful-dnd) to help you get started with `react-beautiful-dnd` as quickly as possible.

[![course-logo](https://user-images.githubusercontent.com/2182637/43372837-8c72d3f8-93e8-11e8-9d92-a82adde7718f.png)](https://egghead.io/courses/beautiful-and-accessible-drag-and-drop-with-react-beautiful-dnd)

## Currently supported feature set ✅

- Vertical lists ↕
- Horizontal lists ↔
- Movement between lists (▤ ↔ ▤)
- [Combining items](/docs/guides/combining.md)
- Mouse 🐭, keyboard 🎹♿️ and touch 👉📱 (mobile, tablet and so on) support
- [Multi drag support](/docs/patterns/multi-drag.md)
- Incredible screen reader support ♿️ - we provide an amazing experience for english screen readers out of the box 📦. We also provide complete customisation control and internationalisation support for those who need it 💖
- [Conditional dragging](/docs/api/draggable.md#optional-props) and [conditional dropping](/docs/api/droppable.md#conditionally-dropping)
- Multiple independent lists on the one page
- Flexible item sizes - the draggable items can have different heights (vertical lists) or widths (horizontal lists)
- [Add and remove items during a drag](/docs/guides/changes-while-dragging.md)
- Compatible with semantic `<table>` reordering - [table pattern](/docs/patterns/tables.md)
- [Auto scrolling](/docs/guides/auto-scrolling.md) - automatically scroll containers and the window as required during a drag (even with keyboard 🔥)
- Custom drag handles - you can drag a whole item by just a part of it
- Able to drag a [clone](TODO) or use a [portal](/docs/patterns/using-a-portal.md)
- Full [programmatic api 🎮](/docs/api/programmatic.md)
- 🌲 Tree support through the [`@atlaskit/tree`](https://atlaskit.atlassian.com/packages/core/tree) package
- A `<Droppable />` list can be a scroll container (without a scrollable parent) or be the child of a scroll container (that also does not have a scrollable parent)
- Independent nested lists - a list can be a child of another list, but you cannot drag items from the parent list into a child list
- Server side rendering (SSR) compatible - see [resetServerContext()](/docs/api/reset-server-context.md)
- Plays well with [nested interactive elements](/docs/api/draggable.md#interactive-child-elements-within-a-draggable-) by default

## Motivation 🤔

`react-beautiful-dnd` exists to create beautiful drag and drop for lists that anyone can use - even people who cannot see. For a good overview of the history and motivations of the project you can take a look at these external resources:

- 📖 [Rethinking drag and drop](https://medium.com/@alexandereardon/rethinking-drag-and-drop-d9f5770b4e6b)
- 🎧 [React podcast: fast, accessible and beautiful drag and drop](https://reactpodcast.simplecast.fm/17)

## Not for everyone ✌️

There are a lot of libraries out there that allow for drag and drop interactions within React. Most notable of these is the amazing [`react-dnd`](https://github.com/react-dnd/react-dnd). It does an incredible job at providing a great set of drag and drop primitives which work especially well with the [wildly inconsistent](https://www.quirksmode.org/blog/archives/2009/09/the_html5_drag.html) html5 drag and drop feature. `react-beautiful-dnd` is a higher level abstraction specifically built for lists (vertical, horizontal, movement between lists, nested lists and so on). Within that subset of functionality `react-beautiful-dnd` offers a powerful, natural and beautiful drag and drop experience. However, it does not provide the breadth of functionality offered by `react-dnd`. So `react-beautiful-dnd` might not be for you depending on what your use case is.

## Documentation 📖

### About 👋

- [Installation](/docs/about/installation.md)
- [Examples and samples](/docs/about/examples.md)
- [Get started](https://egghead.io/courses/beautiful-and-accessible-drag-and-drop-with-react-beautiful-dnd)
- [Design principles](/docs/about/design-principles.md)
- [Animations](/docs/about/animations.md)
- [Accessibility](/docs/about/accessibility.md)
- [Browser support](/docs/about/browser-support.md)

### Sensors 🔉

> The ways in which somebody can start and control a drag

- [Mouse dragging 🐭](/docs/sensors/mouse.md)
- [Touch dragging 👉📱](/docs/sensors/touch.md)
- [Keyboard dragging 🎹♿️](/docs/sensors/keyboard.md)
- [Programmatic dragging 🎮](/docs/sensors/programmatic.md)

### API 🏋️‍

![diagram](https://user-images.githubusercontent.com/2182637/53607406-c8f3a780-3c12-11e9-979c-7f3b5bd1bfbd.gif)

- [`<DragDropContext />`](/docs/api/drag-drop-context.md) - _Wraps the part of your application you want to have drag and drop enabled for_
- [`<Droppable />`](/docs/api/droppable.md) - _An area that can be dropped into. Contains `<Draggable />`s_
- [`<Draggable />`](/docs/api/draggable.md) - _What can be dragged around_
- [`resetServerContext()`](/docs/api/reset-server-context.md) - _Utility for server side rendering (SSR)_

### Guides 🗺

- [`<DragDropContext />` responders](/docs/guides/responders.md) - _`onDragStart`, `onDragUpdate`, `onDragEnd` and `onBeforeDragStart`_
- [Combining `<Draggable />`s](/docs/guides/combining.md)
- [Common setup issues](/docs/guides/common-setup-issues.md)
- [Using `innerRef`](/docs/guides/using-inner-ref.md)
- [Developer warnings and how to disable them](/docs/guides/developer-warnings.md)
- [Rules for `draggableId` and `droppableId`s](/docs/guides/identifiers.md)
- [Customising or skipping the drop animation](/docs/guides/drop-animation.md)
- [Auto scrolling](/docs/guides/auto-scrolling.md)
- [Controlling the screen reader](/docs/guides/screen-reader.md)
- [Use the html5 `doctype`](/docs/guides/doctype.md)
- [`TypeScript` and `flow`](/docs/guides/types.md)
- [Dragging `<svg>`s](/docs/guides/dragging-svgs.md)
- [Non-visible preset styles](/docs/guides/preset-styles.md)
- [How we detect scroll containers](/docs/guides/how-we-detect-scroll-containers.md)
- [How we use dom events](/docs/guides/how-we-use-dom-events.md) - _Useful if you need to build on top of `react-beautiful-dnd`_
- [Adding `<Draggable />`s during a drag](/docs/guides/changes-while-dragging.md) - _⚠️ Advanced_

### Patterns 👷‍

- [Multi drag](/docs/patterns/multi-drag.md)
- [Tables](/docs/patterns/tables.md)
- [Using a portal (`ReactDOM.createPortal`)](/docs/patterns/using-a-portal.md)

### Support 👩‍⚕️

- [Engineering health](/docs/support/engineering-health.md)
- [Community and addons](/docs/support/community-and-addons.md)
- [Release notes and changelog](https://github.com/atlassian/react-beautiful-dnd/releases)
- [Upgrading](/docs/support/upgrading.md)
- [Road map](https://github.com/atlassian/react-beautiful-dnd/issues)
- [Media](/docs/support/media.md)

## Read this in other languages 🌎

- [![kr](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/24/South-Korea.png) **한글/Korean**](https://github.com/LeeHyungGeun/react-beautiful-dnd-kr)
- [![china](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/24/China.png) **中文/Chinese**](https://github.com/chinanf-boy/react-beautiful-dnd-zh)
- [![ru](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/24/Russia.png) **На русском/Russian**](https://github.com/vtereshyn/react-beautiful-dnd-ru)
- [![pt](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/24/Brazil.png) **Português/Portuguese**](https://github.com/dudestein/react-beautiful-dnd-pt)

## Author ✍️

Alex Reardon [@alexandereardon](https://twitter.com/alexandereardon)

## Collaborators 🤝

- Bogdan Chadkin [@IAmTrySound](https://twitter.com/IAmTrySound)
- Luke Batchelor [@alukebatchelor](https://twitter.com/alukebatchelor)
- Jared Crowe [@jaredjcrowe](https://twitter.com/jaredjcrowe)
- Many other [@Atlassian](https://twitter.com/Atlassian)'s!
