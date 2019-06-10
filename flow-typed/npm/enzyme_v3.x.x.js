// flow-typed signature: f6bad512110ebc6da85b1ddda297fe3d
// flow-typed version: f04d291d8b/enzyme_v3.x.x/flow_>=v0.53.x

declare module "enzyme" {
  declare type PredicateFunction<T: Wrapper<*>> = (
    wrapper: T,
    index: number
  ) => boolean;
  declare type UntypedSelector = string | {[key: string]: number|string|boolean};
  declare type EnzymeSelector = UntypedSelector | React$ElementType;

  // CheerioWrapper is a type alias for an actual cheerio instance
  // TODO: Reference correct type from cheerio's type declarations
  declare type CheerioWrapper = any;

  declare class Wrapper<RootComponent> {
    equals(node: React$Element<any>): boolean,
    find(selector: UntypedSelector): this,
    find<T: React$ElementType>(selector: T): ReactWrapper<T>,
    findWhere(predicate: PredicateFunction<this>): this,
    filter(selector: UntypedSelector): this,
    filter<T: React$ElementType>(selector: T): ReactWrapper<T>,
    filterWhere(predicate: PredicateFunction<this>): this,
    hostNodes(): this,
    contains(nodes: React$Node): boolean,
    containsMatchingElement(node: React$Node): boolean,
    containsAllMatchingElements(nodes: React$Node): boolean,
    containsAnyMatchingElements(nodes: React$Node): boolean,
    dive(option?: { context?: Object }): this,
    exists(selector?: EnzymeSelector): boolean,
    isEmptyRender(): boolean,
    matchesElement(node: React$Node): boolean,
    hasClass(className: string): boolean,
    is(selector: EnzymeSelector): boolean,
    isEmpty(): boolean,
    not(selector: EnzymeSelector): this,
    children(selector?: UntypedSelector): this,
    children<T: React$ElementType>(selector: T): ReactWrapper<T>,
    childAt(index: number): this,
    parents(selector?: UntypedSelector): this,
    parents<T: React$ElementType>(selector: T): ReactWrapper<T>,
    parent(): this,
    closest(selector: UntypedSelector): this,
    closest<T: React$ElementType>(selector: T): ReactWrapper<T>,
    render(): CheerioWrapper,
    renderProp(propName: string): (...args: Array<any>) => this,
    unmount(): this,
    text(): string,
    html(): string,
    get(index: number): React$Node,
    getDOMNode(): HTMLElement | HTMLInputElement,
    at(index: number): this,
    first(): this,
    last(): this,
    state(key?: string): any,
    context(key?: string): any,
    props(): Object,
    prop(key: string): any,
    key(): string,
    simulate(event: string, ...args: Array<any>): this,
    simulateError(error: Error): this,
    slice(begin?: number, end?: number): this,
    setState(state: {}, callback?: () => void): this,
    setProps(props: {}, callback?: () => void): this,
    setContext(context: Object): this,
    instance(): React$ElementRef<RootComponent>,
    update(): this,
    debug(options?: Object): string,
    type(): string | Function | null,
    name(): string,
    forEach(fn: (node: this, index: number) => mixed): this,
    map<T>(fn: (node: this, index: number) => T): Array<T>,
    reduce<T>(
      fn: (value: T, node: this, index: number) => T,
      initialValue?: T
    ): Array<T>,
    reduceRight<T>(
      fn: (value: T, node: this, index: number) => T,
      initialValue?: T
    ): Array<T>,
    some(selector: EnzymeSelector): boolean,
    someWhere(predicate: PredicateFunction<this>): boolean,
    every(selector: EnzymeSelector): boolean,
    everyWhere(predicate: PredicateFunction<this>): boolean,
    length: number
  }

  declare class ReactWrapper<T> extends Wrapper<T> {
    constructor(nodes: React$Element<T>, root: any, options?: ?Object): ReactWrapper<T>,
    mount(): this,
    ref(refName: string): this,
    detach(): void
  }

  declare class ShallowWrapper<T> extends Wrapper<T> {
    constructor(
      nodes: React$Element<T>,
      root: any,
      options?: ?Object
    ): ShallowWrapper<T>,
    equals(node: React$Node): boolean,
    shallow(options?: { context?: Object }): ShallowWrapper<T>,
    getElement(): React$Node,
    getElements(): Array<React$Node>
  }

  declare function shallow<T>(
    node: React$Element<T>,
    options?: { context?: Object, disableLifecycleMethods?: boolean }
  ): ShallowWrapper<T>;
  declare function mount<T>(
    node: React$Element<T>,
    options?: {
      context?: Object,
      attachTo?: HTMLElement,
      childContextTypes?: Object
    }
  ): ReactWrapper<T>;
  declare function render<T>(
    node: React$Element<T>,
    options?: { context?: Object }
  ): CheerioWrapper;

  declare module.exports: {
    configure(options: {
      Adapter?: any,
      disableLifecycleMethods?: boolean
    }): void,
    render: typeof render,
    mount: typeof mount,
    shallow: typeof shallow,
    ShallowWrapper: typeof ShallowWrapper,
    ReactWrapper: typeof ReactWrapper
  };
}
