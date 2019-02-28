# Engineering health

[![CircleCI branch](https://img.shields.io/circleci/project/github/atlassian/react-beautiful-dnd/master.svg)](https://circleci.com/gh/atlassian/react-beautiful-dnd/tree/master)

## Typed

[![Typed with flow](https://img.shields.io/badge/typed%20with-flow-brightgreen.svg?style=flat)](https://flow.org/)

This codebase is typed with [flow](https://flow.org) to promote greater internal consistency and more resilient code.

You can learn more about our `TypeScript` and `flow` support on our [types guide](/docs/guides/types.md).

## Tested

[![Tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://www.npmjs.com/package/react-beautiful-dnd) [![Tested with cypress](https://img.shields.io/badge/tested%20with-cypress-brightgreen.svg?style=flat)](https://www.cypress.io/)

This code base employs a number of different testing strategies including unit, integration, browser and performance tests. Testing various aspects of the system helps to promote its quality and stability.

While code coverage is [not a guarantee of code health](https://stackoverflow.com/a/90021/1374236), it is a good indicator. This code base currently sits at **~94% coverage**.

## Linting

- [`eslint`](https://eslint.org/)
- [`stylelint`](https://github.com/stylelint/stylelint)
- [`prettier`](https://github.com/prettier/prettier) - well, not strictly a linter, but close enough

## Performance

[![CircleCI branch](https://img.shields.io/badge/speed-blazing%20%F0%9F%94%A5-brightgreen.svg?style=flat)](https://circleci.com/gh/atlassian/react-beautiful-dnd/tree/master)

This codebase is designed to be **extremely performant** - it is part of its DNA. It is designed to perform the smallest amount of updates possible. You can have a read about performance work done for `react-beautiful-dnd` here:

- [Rethinking drag and drop](https://medium.com/@alexandereardon/rethinking-drag-and-drop-d9f5770b4e6b)
- [Dragging React performance forward](https://medium.com/@alexandereardon/dragging-react-performance-forward-688b30d40a33)
- [Grabbing the flame 🔥](https://medium.com/@alexandereardon/grabbing-the-flame-290c794fe852)

> More in [media](/docs/general/media.md)

## Size

[![minzip](https://img.shields.io/bundlephobia/minzip/react-beautiful-dnd.svg)](https://www.npmjs.com/package/react-beautiful-dnd)

Great care has been taken to keep the library as light as possible. There could be a smaller net cost if you where already using one of the underlying dependencies.

[Back to documentation 📖](/README.md#documentation-)
