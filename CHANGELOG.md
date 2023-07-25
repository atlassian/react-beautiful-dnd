# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## [13.3.0]

### Added

- Add support for an element to include data-dnd-ignore-scrollable to not be considered a scrollable container.

## [13.2.1]

### Security

Includes merged Dependabot PRs for

- `terser` from 4.6.3 to 4.8.1
- `eventsource` from 1.0.7 to 1.1.2
- `async` from 2.6.3 to 2.6.4

## [13.2.0]

### Added

- Added new, opt-in fluid scroller behavior. The new behavior prevents scroll from occuring when a draggable is grabbed within the auto-scroll thresholds _until_ the draggable is explicitly dragged in that threshold's direction.
- Added ability to pass additional configuration options to fluid scroller via `DragDropContext`.

## [13.1.2]

### Changed

- Changed package name to `@planningcenter/react-beautiful-dnd`
- Updated author and repo information in `package.json`
- Updated README with overview of why we forked package

### Added

- Added configuration files
- Added GitHub action for building and testing code

## 13.1.1 and earlier

All release notes and upgrade notes for earlier versions can be found on the original
project's [Github Releases] page.

[13.2.1]: https://github.com/planningcenter/react-beautiful-dnd/compare/v13.2.0..v13.2.1
[13.2.0]: https://github.com/planningcenter/react-beautiful-dnd/compare/v13.1.2..v13.2.0
[13.1.2]: https://github.com/planningcenter/react-beautiful-dnd/compare/v13.1.1..v13.1.2
[github releases]: https://github.com/atlassian/react-beautiful-dnd/releases
