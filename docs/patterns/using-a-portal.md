# Using a Portal

> This guide will go through how you can move your `Draggable` into a [`React.Portal`](https://reactjs.org/docs/portals.html) while dragging.

> ⚠️ Moving items into a React Portal after a `touchstart` is currently not working 😞. React issue: [#13113](https://github.com/facebook/react/issues/13113). We are tracking it here: [#582](https://github.com/atlassian/react-beautiful-dnd/issues/582). Due to this issue with React Portals drag and drop will not work on touch devices if using a React Portal

## Background

We leave elements in place when dragging. We apply `position: fixed` on elements when we are moving them around. This is quite robust and allows for you to have `position: relative | absolute | fixed` parents. However, unfortunately `position:fixed` is [impacted by `transform`](http://meyerweb.com/eric/thoughts/2011/09/12/un-fixing-fixed-elements-with-css-transforms/) (such as `transform: rotate(10deg);`). This means that if you have a `transform: *` on one of the parents of a `Draggable` then the positioning logic will be incorrect while dragging. Lame! For most consumers this will not be an issue.

To get around the issue you can use a `portal`.

## `Portals`

Wait, what is a `portal`? A `portal` is a simply another DOM node outside of the current component tree. By using a portal you are able to move the `Draggable` into another DOM node while dragging. This can allow you to get around the limitations of `position: fixed`.

## Not using `React.Portal` by default

React provides a first class api for using `portals`: [`React.Portal`](https://reactjs.org/docs/portals.html). Originally we wanted to use it for all `Draggable`s while dragging. Unfortunately it has a big performance penalty - especially when dragging nodes with a lot of children ([React issue](https://github.com/facebook/react/issues/12247)). The reason for this is because components moving to a `React.Portal` are mounted and remounted which is quite expensive. Therefore we are currently not supporting it out of the box.

If your `Draggable` does not have many children nodes then you are welcome to use `React.Portal` on top of `react-beautiful-dnd`. If you are simply dragging cards in a list then you _should_ be fine using `React.Portal`. However, if you are dragging a column full of cards then you will get significant jank when a drag is starting.

## Example

<!-- TODO: embed example here on new website -->

We have created a [working example](https://react-beautiful-dnd.netlify.com/?selectedKind=Portals&selectedStory=Using%20your%20own%20portal&full=0&addons=1&stories=1&panelRight=0&addonPanel=storybook%2Factions%2Factions-panel) that uses `React.Portal` to guide you. You can view the [source here](https://github.com/atlassian/react-beautiful-dnd/blob/master/stories/11-portal.stories.js).

## Tables

If you are doing drag and drop reordering within a `<table>` we have created a portal section inside our [table guide](/docs/patterns/tables).
