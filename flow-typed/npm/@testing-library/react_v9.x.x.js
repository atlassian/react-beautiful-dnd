// flow-typed signature: 38ccc5bbcbb54d21f37adca5cc3ed7a1
// flow-typed version: 0b0eb4afe9/@testing-library/react_v9.x.x/flow_>=v0.104.x

declare module '@testing-library/react' {
  // This type comes from
  // https://github.com/facebook/flow/blob/v0.104.0/lib/react-dom.js#L64
  declare type ReactDOMTestUtilsThenable = {
    then(resolve: () => mixed, reject?: () => mixed): mixed,
    ...
  };
  // This type comes from
  // https://github.com/facebook/flow/blob/v0.104.0/lib/react-dom.js#L116
  declare type ReactDOMTestUtilsAct = (
    callback: () => void | ReactDOMTestUtilsThenable
  ) => ReactDOMTestUtilsThenable;

  declare type TextMatch =
    | string
    | RegExp
    | ((content: string, element: HTMLElement) => boolean);

  declare type TextMatchOptions = {
    exact?: boolean,
    trim?: boolean,
    collapseWhitespace?: boolean,
    ...
  };

  declare type SelectorMatchOptions = {
    selector?: string,
    ...
  } & TextMatchOptions;

  declare type GetByText = (
    text: TextMatch,
    options?: SelectorMatchOptions
  ) => HTMLElement;

  declare type QueryByText = (
    text: TextMatch,
    options?: SelectorMatchOptions
  ) => ?HTMLElement;

  declare type AllByText = (
    text: TextMatch,
    options?: SelectorMatchOptions
  ) => Array<HTMLElement>;

  declare type GetByBoundAttribute = (
    text: TextMatch,
    options?: TextMatchOptions
  ) => HTMLElement;

  declare type QueryByBoundAttribute = (
    text: TextMatch,
    options?: TextMatchOptions
  ) => ?HTMLElement;

  declare type AllByBoundAttribute = (
    text: TextMatch,
    options?: TextMatchOptions
  ) => Array<HTMLElement>;

  declare type GetsAndQueries = {|
    getByAltText: GetByBoundAttribute,
    getAllByAltText: AllByBoundAttribute,
    queryByAltText: QueryByBoundAttribute,
    queryAllByAltText: AllByBoundAttribute,

    getByDisplayValue: GetByBoundAttribute,
    getAllByDisplayValue: AllByBoundAttribute,
    queryByDisplayValue: QueryByBoundAttribute,
    queryAllByDisplayValue: AllByBoundAttribute,

    getByLabelText: GetByText,
    getAllByLabelText: AllByText,
    queryByLabelText: QueryByText,
    queryAllByLabelText: AllByText,

    getByPlaceholderText: GetByBoundAttribute,
    getAllByPlaceholderText: AllByBoundAttribute,
    queryByPlaceholderText: QueryByBoundAttribute,
    queryAllByPlaceholderText: AllByBoundAttribute,

    getByRole: GetByBoundAttribute,
    getAllByRole: AllByBoundAttribute,
    queryByRole: QueryByBoundAttribute,
    queryAllByRole: AllByBoundAttribute,

    getBySelectText: GetByBoundAttribute,
    getAllBySelectText: AllByBoundAttribute,
    queryBySelectText: QueryByBoundAttribute,
    queryAllBySelectText: AllByBoundAttribute,

    getByTestId: GetByBoundAttribute,
    getAllByTestId: AllByBoundAttribute,
    queryByTestId: QueryByBoundAttribute,
    queryAllByTestId: AllByBoundAttribute,

    getByText: GetByText,
    getAllByText: AllByText,
    queryByText: QueryByText,
    queryAllByText: AllByText,

    getByTitle: GetByBoundAttribute,
    getAllByTitle: AllByBoundAttribute,
    queryByTitle: QueryByBoundAttribute,
    queryAllByTitle: AllByBoundAttribute,

    getByValue: GetByBoundAttribute,
    getAllByValue: AllByBoundAttribute,
    queryByValue: QueryByBoundAttribute,
    queryAllByValue: AllByBoundAttribute,
  |};

  declare type FireEvent<TInit> = (
    element: HTMLElement,
    eventProperties?: TInit
  ) => boolean;

  declare type RenderResult<Queries = GetsAndQueries> = {
    ...Queries,
    container: HTMLDivElement,
    unmount: () => void,
    baseElement: HTMLElement,
    asFragment: () => DocumentFragment,
    debug: (baseElement?: HTMLElement) => void,
    rerender: (ui: React$Element<*>) => void,
    ...
  };

  declare export type RenderOptionsWithoutCustomQueries = {|
    container?: HTMLElement,
    baseElement?: HTMLElement,
    hydrate?: boolean,
    wrapper?: React.ComponentType,
  |};

  declare export type RenderOptionsWithCustomQueries<
    CustomQueries: { ... }
  > = {|
    queries: CustomQueries,
    container?: HTMLElement,
    baseElement?: HTMLElement,
    hydrate?: boolean,
    wrapper?: React.ComponentType,
  |};

  declare export function render(
    ui: React.ReactElement<any>,
    options?: RenderOptionsWithoutCustomQueries
  ): RenderResult<>;
  declare export function render<
    CustomQueries: { [string]: (...args: Array<any>) => any, ... }
  >(
    ui: React.ReactElement<any>,
    options: RenderOptionsWithCustomQueries<CustomQueries>
  ): RenderResult<CustomQueries>;

  declare export var act: ReactDOMTestUtilsAct;
  declare export function cleanup(): void;
  declare export function wait(
    callback?: () => void,
    options?: {
      timeout?: number,
      interval?: number,
      ...
    }
  ): Promise<void>;
  declare export function waitForDomChange<T>(options?: {
    container?: HTMLElement,
    timeout?: number,
    mutationObserverOptions?: MutationObserverInit,
    ...
  }): Promise<T>;
  declare export function waitForElement<T>(
    callback?: () => T,
    options?: {
      container?: HTMLElement,
      timeout?: number,
      mutationObserverOptions?: MutationObserverInit,
      ...
    }
  ): Promise<T>;
  declare export function within(
    element: HTMLElement,
    queriesToBind?: GetsAndQueries | Array<GetsAndQueries>
  ): GetsAndQueries;

  // Loose custom type
  declare export var createEvent: {|
    [key: string]: (...any[]) => any,
  |};

  declare export var fireEvent: {|
    (element: HTMLElement, event: Event): void,

    copy: FireEvent<Event$Init>,
    cut: FireEvent<Event$Init>,
    paste: FireEvent<Event$Init>,
    compositionEnd: FireEvent<Event$Init>,
    compositionStart: FireEvent<Event$Init>,
    compositionUpdate: FireEvent<Event$Init>,
    keyDown: FireEvent<Event$Init>,
    keyPress: FireEvent<Event$Init>,
    keyUp: FireEvent<Event$Init>,
    focus: FireEvent<Event$Init>,
    blur: FireEvent<Event$Init>,
    change: FireEvent<Event$Init>,
    input: FireEvent<Event$Init>,
    invalid: FireEvent<Event$Init>,
    submit: FireEvent<Event$Init>,
    click: FireEvent<MouseEvent$MouseEventInit>,
    contextMenu: FireEvent<MouseEvent$MouseEventInit>,
    dblClick: FireEvent<MouseEvent$MouseEventInit>,
    doubleClick: FireEvent<MouseEvent$MouseEventInit>,
    drag: FireEvent<MouseEvent$MouseEventInit>,
    dragEnd: FireEvent<MouseEvent$MouseEventInit>,
    dragEnter: FireEvent<MouseEvent$MouseEventInit>,
    dragExit: FireEvent<MouseEvent$MouseEventInit>,
    dragLeave: FireEvent<MouseEvent$MouseEventInit>,
    dragOver: FireEvent<MouseEvent$MouseEventInit>,
    dragStart: FireEvent<MouseEvent$MouseEventInit>,
    drop: FireEvent<MouseEvent$MouseEventInit>,
    mouseDown: FireEvent<MouseEvent$MouseEventInit>,
    mouseEnter: FireEvent<MouseEvent$MouseEventInit>,
    mouseLeave: FireEvent<MouseEvent$MouseEventInit>,
    mouseMove: FireEvent<MouseEvent$MouseEventInit>,
    mouseOut: FireEvent<MouseEvent$MouseEventInit>,
    mouseOver: FireEvent<MouseEvent$MouseEventInit>,
    mouseUp: FireEvent<MouseEvent$MouseEventInit>,
    select: FireEvent<Event$Init>,
    touchCancel: FireEvent<Event$Init>,
    touchEnd: FireEvent<Event$Init>,
    touchMove: FireEvent<Event$Init>,
    touchStart: FireEvent<Event$Init>,
    scroll: FireEvent<Event$Init>,
    wheel: FireEvent<MouseEvent$MouseEventInit>,
    abort: FireEvent<Event$Init>,
    canPlay: FireEvent<Event$Init>,
    canPlayThrough: FireEvent<Event$Init>,
    durationChange: FireEvent<Event$Init>,
    emptied: FireEvent<Event$Init>,
    encrypted: FireEvent<Event$Init>,
    ended: FireEvent<Event$Init>,
    loadedData: FireEvent<Event$Init>,
    loadedMetadata: FireEvent<Event$Init>,
    loadStart: FireEvent<Event$Init>,
    pause: FireEvent<Event$Init>,
    play: FireEvent<Event$Init>,
    playing: FireEvent<Event$Init>,
    progress: FireEvent<Event$Init>,
    rateChange: FireEvent<Event$Init>,
    seeked: FireEvent<Event$Init>,
    seeking: FireEvent<Event$Init>,
    stalled: FireEvent<Event$Init>,
    suspend: FireEvent<Event$Init>,
    timeUpdate: FireEvent<Event$Init>,
    volumeChange: FireEvent<Event$Init>,
    waiting: FireEvent<Event$Init>,
    load: FireEvent<Event$Init>,
    error: FireEvent<Event$Init>,
    animationStart: FireEvent<Event$Init>,
    animationEnd: FireEvent<Event$Init>,
    animationIteration: FireEvent<Event$Init>,
    transitionEnd: FireEvent<Event$Init>,
  |};

  // dom-testing-library re-exports
  declare export function queryByTestId(
    container: HTMLElement,
    id: TextMatch,
    options?: TextMatchOptions
  ): ?HTMLElement;
  declare export function getByTestId(
    container: HTMLElement,
    id: TextMatch,
    options?: TextMatchOptions
  ): HTMLElement;
  declare export function queryByText(
    container: HTMLElement,
    text: TextMatch,
    options?: TextMatchOptions
  ): ?HTMLElement;
  declare export function getByText(
    container: HTMLElement,
    text: TextMatch,
    options?: { selector?: string, ... } & TextMatchOptions
  ): HTMLElement;
  declare export function queryByPlaceholderText(
    container: HTMLElement,
    text: TextMatch,
    options?: TextMatchOptions
  ): ?HTMLElement;
  declare export function getByPlaceholderText(
    container: HTMLElement,
    text: TextMatch,
    options?: TextMatchOptions
  ): HTMLElement;
  declare export function queryByLabelText(
    container: HTMLElement,
    text: TextMatch,
    options?: TextMatchOptions
  ): ?HTMLElement;
  declare export function getByLabelText(
    container: HTMLElement,
    text: TextMatch,
    options?: { selector?: string, ... } & TextMatchOptions
  ): HTMLElement;
  declare export function queryByAltText(
    container: HTMLElement,
    text: TextMatch,
    options?: TextMatchOptions
  ): ?HTMLElement;
  declare export function getByAltText(
    container: HTMLElement,
    text: TextMatch,
    options?: TextMatchOptions
  ): HTMLElement;
}
