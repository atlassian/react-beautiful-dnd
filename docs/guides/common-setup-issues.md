# Common setup issues

This is a little guide to help you with some common setup issues

## Check your `console`

For detectable setup issues we try to log information in the `console` for `development` builds of `react-beautiful-dnd`. If things are not working, first thing to do is check your `console`.

## React version

Please ensure that you meet our peer dependency version of `React`. Your React version needs to be greater than or equal to `16.3.1`.

If you want to know what React version you are on take a look at your [`package.json`](https://docs.npmjs.com/files/package.json) or use `console.log(React.version)`.

If you are not sure if your `package.json` version satisfies `16.3.1` have a read of [npm: about semantic versioning](https://docs.npmjs.com/about-semantic-versioning) and try out the [npm sermver calculator](https://semver.npmjs.com/)

## No duplicate ids

`draggableId` and `droppableId` values must be unique for the whole `<DragDropContext />` and not just a list.

More information: [identifiers guide](/docs/guides/identifiers.md)

## No margin collapsing between `Draggables`

This can happen if you have a `margin-top` as well as a `margin-bottom` on a `<Draggable />`.

[More information](https://github.com/atlassian/react-beautiful-dnd#unsupported-margin-setups)

## Avoid empty lists

We recommend you set a `min-height` or `min-width` on a `<Droppable />` to ensure that there is a visible drop target when a list is empty

We go over this in our [Get started with `react-beautiful-dnd` course](https://egghead.io/lessons/react-move-items-between-columns-with-react-beautiful-dnd-using-ondragend)

[Back to documentation](/README.md#documentation-)
