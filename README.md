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

- Beautiful and [natural movement](/docs/general/philosophy.md) of items 💐
- [Accessible](/docs/general/accessibility.md): powerful keyboard and screen reader support ♿️
- [Extremely performant](/docs/general/media.md) 🚀
- Clean and powerful api which is simple to get started with
- Plays extremely well with standard browser interactions
- [Unopinionated styling](/docs/guides/preset-styles.md)
- No creation of additional wrapper dom nodes - flexbox and focus management friendly!

## Get started 👩‍🏫

We have created [a free course on `egghead.io`](https://egghead.io/courses/beautiful-and-accessible-drag-and-drop-with-react-beautiful-dnd) to help people get started with `react-beautiful-dnd` as quickly as possible.

[![course-logo](https://user-images.githubusercontent.com/2182637/43372837-8c72d3f8-93e8-11e8-9d92-a82adde7718f.png)](https://egghead.io/courses/beautiful-and-accessible-drag-and-drop-with-react-beautiful-dnd)

## Currently supported feature set ✅

- Vertical lists ↕
- Horizontal lists ↔
- Movement between lists (▤ ↔ ▤)
- [Combining items](/docs/guides/combining.md)
- Mouse 🐭, keyboard 🎹♿️ and touch 👉📱 (mobile, tablet and so on) support
- [Multi drag support](/docs/patterns/multi-drag.md)
- Incredible screen reader support ♿️ - we provide an amazing experience for english screen readers out of the box 📦. We also provide complete customisation control and internationalisation support for those who need it 💖
- [Conditional dragging](https://github.com/atlassian/react-beautiful-dnd#props-1) and [conditional dropping](https://github.com/atlassian/react-beautiful-dnd#conditionally-dropping)
- Multiple independent lists on the one page
- Flexible item sizes - the draggable items can have different heights (vertical lists) or widths (horizontal lists)
- [Add and remove items during a drag](/docs/guides/changes-while-dragging.md)
- Compatible with semantic `<table>` reordering - [table pattern](/docs/patterns/tables.md)
- [Auto scrolling](/docs/guides/auto-scrolling.md) - automatically scroll containers and the window as required during a drag (even with keyboard 🔥)
- Custom drag handles - you can drag a whole item by just a part of it
- Compatible with [`ReactDOM.createPortal`](https://reactjs.org/docs/portals.html) - [portal pattern](/docs/patterns/using-a-portal.md)
- 🌲 Tree support through the [`@atlaskit/tree`](https://atlaskit.atlassian.com/packages/core/tree) package
- A `Droppable` list can be a scroll container (without a scrollable parent) or be the child of a scroll container (that also does not have a scrollable parent)
- Independent nested lists - a list can be a child of another list, but you cannot drag items from the parent list into a child list
- Server side rendering (SSR) compatible - see [resetServerContext()](/docs/api/reset-server-context.md)
- Plays well with [nested interactive elements](TODO) by default

## Documentation 📖

### General 👋

- [Examples and samples](/docs/general/examples.md)
- [Installation](/docs/general/installation.md)
- [Get started](https://egghead.io/courses/beautiful-and-accessible-drag-and-drop-with-react-beautiful-dnd)
- [Design philosophy](/docs/general/philosphy.md) - _worth a read to understand the motivations and thinking behind the library_
- Drag types
  -- [Mouse dragging 🐭](/docs/general/sensor/mouse.md)
  -- [Touch dragging 👉📱](/docs/general/sensor/touch.md)
  -- [Keyboard dragging 🎹♿️](/docs/general/sensor/keyboard.md)
- [Accessibility](/docs/general/accessibility.md)
- [Browser support](/docs/general/browser-support.md)
- [Community and addons](/docs/general/community-and-addons.md)
- [Release notes and changelog](https://github.com/atlassian/react-beautiful-dnd/releases)
- [Upgrading](/docs/general/upgrading.md)
- [Engineering health](/docs/general/engineering-health.md)
- [Media](/docs/general/media.md)
- [Road map](https://github.com/atlassian/react-beautiful-dnd/issues)

### API 🏋️‍

[TODO: diagram]

- [`<DragDropContext />`](/docs/api/drag-drop-context.md) - _Wraps the part of your application you want to have drag and drop enabled for_
- [`<Droppable />`](/docs/api/droppable.md) - _An area that can be dropped into. Contains `<Draggable />`s_
- [`<Draggable />`](/docs/api/draggable.md) - _What can be dragged around_
- [`resetServerContext()`](/docs/api/reset-server-context.md) - _Utility for server side rendering (SSR)_

### Guides 🗺

- [`<DragDropContext>` responders](/docs/guides/responders.md) - _`onDragStart`, `onDragUpdate`, `onDragEnd` and `onBeforeDragStart`_
- [Combining `<Draggable>`s](/docs/guides/combining.md)
- [Common setup issues](/docs/guides/common-setup-issues.md)
- [Using `innerRef`](/docs/guides/using-inner-ref.md)
- [Developer warnings and how to disable them](/docs/guides/developer-warnings.md)
- [Rules for `draggableId` and `droppableId`s](/docs/guides/identifiers.md)
- [Animations](/docs/guides/animations.md)
- [Customising or skipping the drop animation](/docs/guides/drop-animation.md)
- [Auto scrolling](/docs/guides/auto-scrolling.md)
- [Controlling the screen reader](/docs/guides/screen-reader.md)
- [Use the html5 `doctype`](/docs/guides/doctype.md)
- [`TypeScript` and `flow`](/docs/guides/types.md)
- [Dragging `<svg>`s](/docs/guides/dragging-svgs.md)
- [Non-visible preset styles](/docs/guides/preset-styles.md)
- [How we detect scroll containers](/docs/guides/how-we-detect-scroll-containers.md)
- [How we use dom events](/docs/guides/how-we-use-dom-events.md) - _Useful if you need to build on top of `react-beautiful-dnd`_
- [Adding `<Draggable>`s during a drag](/docs/guides/changes-while-dragging.md) - _⚠️ Advanced_

### Patterns 👷‍

- [Multi drag](/docs/patterns/multi-drag.md)
- [Tables](/docs/patterns/tables.md)
- [Using a portal (`ReactDOM.createPortal`)](/docs/patterns/using-a-portal.md)

## Read this in other languages 🌎

- [![kr](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/24/South-Korea.png) **한글/Korean**](https://github.com/LeeHyungGeun/react-beautiful-dnd-kr)
- [![china](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/24/China.png) **中文/Chinese**](https://github.com/chinanf-boy/react-beautiful-dnd-zh)

## Author ✍️

Alex Reardon [@alexandereardon](https://twitter.com/alexandereardon)

## Collaborators 🤝

- Bogdan Chadkin [@IAmTrySound](https://twitter.com/IAmTrySound)
- Luke Batchelor [@alukebatchelor](https://twitter.com/alukebatchelor)
- Jared Crowe [@jaredjcrowe](https://twitter.com/jaredjcrowe)
- Many other [@Atlassian](https://twitter.com/Atlassian)'s!
