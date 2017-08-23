// flow-typed signature: a1fceaefab821f37dbb2f68fae2a79eb
// flow-typed version: d7a8d069fa/enzyme_v2.3.x/flow_>=v0.28.x <=v0.52.x

declare module "enzyme" {
  declare type PredicateFunction<T: Wrapper> = (
    wrapper: T,
    index: number
  ) => boolean;
  declare type NodeOrNodes = React$Element<any> | Array<React$Element<any>>;
  declare type EnzymeSelector = string | ReactClass<any> | Object;

  // CheerioWrapper is a type alias for an actual cheerio instance
  // TODO: Reference correct type from cheerio's type declarations
  declare type CheerioWrapper = any;

  declare class Wrapper {
    find(selector: EnzymeSelector): this,
    findWhere(predicate: PredicateFunction<this>): this,
    filter(selector: EnzymeSelector): this,
    filterWhere(predicate: PredicateFunction<this>): this,
    contains(nodeOrNodes: NodeOrNodes): boolean,
    containsMatchingElement(node: React$Element<any>): boolean,
    containsAllMatchingElements(nodes: NodeOrNodes): boolean,
    containsAnyMatchingElements(nodes: NodeOrNodes): boolean,
    dive(option?: { context?: Object }): this,
    exists(): boolean,
    matchesElement(node: React$Element<any>): boolean,
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
    unmount(): this,
    text(): string,
    html(): string,
    get(index: number): React$Element<any>,
    getNode(): React$Element<any>,
    getNodes(): Array<React$Element<any>>,
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
    setState(state: {}, callback?: Function): this,
    setProps(props: {}): this,
    setContext(context: Object): this,
    instance(): React$Component<*, *, *>,
    update(): this,
    debug(): string,
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

  declare export class ReactWrapper extends Wrapper {
    constructor(nodes: NodeOrNodes, root: any, options?: ?Object): ReactWrapper,
    mount(): this,
    ref(refName: string): this,
    detach(): void
  }

  declare export class ShallowWrapper extends Wrapper {
    equals(node: React$Element<any>): boolean,
    shallow(options?: { context?: Object }): ShallowWrapper
  }

  declare export function shallow(
    node: React$Element<any>,
    options?: { context?: Object }
  ): ShallowWrapper;
  declare export function mount(
    node: React$Element<any>,
    options?: {
      context?: Object,
      attachTo?: HTMLElement,
      childContextTypes?: Object
    }
  ): ReactWrapper;
  declare export function render(
    node: React$Element<any>,
    options?: { context?: Object }
  ): CheerioWrapper;
}
