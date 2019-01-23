// flow-typed signature: 8bfb6d6a1f5b5fe7a50440d49e500f2f
// flow-typed version: 2bcb80d5bf/enzyme_v3.x.x/flow_>=v0.53.x

import * as React from "react";

declare module "enzyme" {
  declare type PredicateFunction<T: Wrapper> = (
    wrapper: T,
    index: number
  ) => boolean;
  declare type NodeOrNodes = React.Node | Array<React.Node>;
  declare type EnzymeSelector = string | Class<React.Component<*, *>> | Object;

  // CheerioWrapper is a type alias for an actual cheerio instance
  // TODO: Reference correct type from cheerio's type declarations
  declare type CheerioWrapper = any;

  declare class Wrapper {
    find(selector: EnzymeSelector): this,
    findWhere(predicate: PredicateFunction<this>): this,
    filter(selector: EnzymeSelector): this,
    filterWhere(predicate: PredicateFunction<this>): this,
    hostNodes(): this,
    contains(nodeOrNodes: NodeOrNodes): boolean,
    containsMatchingElement(node: React.Node): boolean,
    containsAllMatchingElements(nodes: NodeOrNodes): boolean,
    containsAnyMatchingElements(nodes: NodeOrNodes): boolean,
    dive(option?: { context?: Object }): this,
    exists(selector?: EnzymeSelector): boolean,
    isEmptyRender(): boolean,
    matchesElement(node: React.Node): boolean,
    hasClass(className: string): boolean,
    is(selector: EnzymeSelector): boolean,
    isEmpty(): boolean,
    not(selector: EnzymeSelector): this,
    children(selector?: EnzymeSelector): this,
    childAt(index: number): this,
    parents(selector?: EnzymeSelector): this,
    parent(): this,
    closest(selector: EnzymeSelector): this,
    render(): CheerioWrapper,
    renderProp(propName: string): (...args: Array<any>) => this,
    unmount(): this,
    text(): string,
    html(): string,
    get(index: number): React.Node,
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
    slice(begin?: number, end?: number): this,
    setState(state: {}, callback?: Function): this,
    setProps(props: {}, callback?: Function): this,
    setContext(context: Object): this,
    instance(): React.Component<*, *>,
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

  declare class ReactWrapper extends Wrapper {
    constructor(nodes: NodeOrNodes, root: any, options?: ?Object): ReactWrapper,
    mount(): this,
    ref(refName: string): this,
    detach(): void
  }

  declare class ShallowWrapper extends Wrapper {
    constructor(
      nodes: NodeOrNodes,
      root: any,
      options?: ?Object
    ): ShallowWrapper,
    equals(node: React.Node): boolean,
    shallow(options?: { context?: Object }): ShallowWrapper,
    getElement(): React.Node,
    getElements(): Array<React.Node>
  }

  declare function shallow(
    node: React.Node,
    options?: { context?: Object, disableLifecycleMethods?: boolean }
  ): ShallowWrapper;
  declare function mount(
    node: React.Node,
    options?: {
      context?: Object,
      attachTo?: HTMLElement,
      childContextTypes?: Object
    }
  ): ReactWrapper;
  declare function render(
    node: React.Node,
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
