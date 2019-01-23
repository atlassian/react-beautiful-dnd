// flow-typed signature: b576396beb90443adc85d3b62e7b0d19
// flow-typed version: 256d4f254e/react-redux_v5.x.x/flow_>=v0.89.x

/**
The order of type arguments for connect() is as follows:

connect<Props, OwnProps, StateProps, DispatchProps, State, Dispatch>(…)

In Flow v0.89 only the first two are mandatory to specify. Other 4 can be repaced with the new awesome type placeholder:

connect<Props, OwnProps, _, _, _, _>(…)

But beware, in case of weird type errors somewhere in random places
just type everything and get to a green field and only then try to
remove the definitions you see bogus.

Decrypting the abbreviations:
  WC = Component being wrapped
  S = State
  D = Dispatch
  OP = OwnProps
  SP = StateProps
  DP = DispatchProps
  MP = Merge props
  RSP = Returned state props
  RDP = Returned dispatch props
  RMP = Returned merge props
  CP = Props for returned component
  Com = React Component
  ST = Static properties of Com
  EFO = Extra factory options (used only in connectAdvanced)
*/

declare module "react-redux" {
  // ------------------------------------------------------------
  // Typings for connect()
  // ------------------------------------------------------------

  declare export type Options<S, OP, SP, MP> = {|
    pure?: boolean,
    withRef?: boolean,
    areStatesEqual?: (next: S, prev: S) => boolean,
    areOwnPropsEqual?: (next: OP, prev: OP) => boolean,
    areStatePropsEqual?: (next: SP, prev: SP) => boolean,
    areMergedPropsEqual?: (next: MP, prev: MP) => boolean,
    storeKey?: string,
  |};

  declare type MapStateToProps<-S, -OP, +SP> =
    | ((state: S, ownProps: OP) => SP)
    // If you want to use the factory function but get a strange error
    // like "function is not an object" then just type the factory function
    // like this:
    // const factory: (State, OwnProps) => (State, OwnProps) => StateProps
    // and provide the StateProps type to the SP type parameter.
    | ((state: S, ownProps: OP) => (state: S, ownProps: OP) => SP);

  declare type Bind<D> = <A, R>((...A) => R) => (...A) => $Call<D, R>;

  declare type MapDispatchToPropsFn<D, -OP, +DP> =
    | ((dispatch: D, ownProps: OP) => DP)
    // If you want to use the factory function but get a strange error
    // like "function is not an object" then just type the factory function
    // like this:
    // const factory: (Dispatch, OwnProps) => (Dispatch, OwnProps) => DispatchProps
    // and provide the DispatchProps type to the DP type parameter.
    | ((dispatch: D, ownProps: OP) => (dispatch: D, ownProps: OP) => DP);

  declare class ConnectedComponent<OP, +WC> extends React$Component<OP> {
    static +WrappedComponent: WC;
    getWrappedInstance(): React$ElementRef<WC>;
  }
  // The connection of the Wrapped Component and the Connected Component
  // happens here in `MP: P`. It means that type wise MP belongs to P,
  // so to say MP >= P.
  declare type Connector<P, OP, MP: P> = <WC: React$ComponentType<P>>(
    WC,
  ) => Class<ConnectedComponent<OP, WC>> & WC;

  // No `mergeProps` argument

  // Got error like inexact OwnProps is incompatible with exact object type?
  // Just make the OP parameter for `connect()` an exact object.
  declare type MergeOP<OP, D> = {| ...$Exact<OP>, dispatch: D |};
  declare type MergeOPSP<OP, SP> = {| ...$Exact<OP>, ...SP |};
  declare type MergeOPDP<OP, DP> = {| ...$Exact<OP>, ...DP |};
  declare type MergeOPSPDP<OP, SP, DP> = {| ...$Exact<OP>, ...SP, ...DP |};

  declare export function connect<-P, -OP, -SP, -DP, -S, -D>(
    mapStateToProps?: null | void,
    mapDispatchToProps?: null | void,
    mergeProps?: null | void,
    options?: ?Options<S, OP, {||}, MergeOP<OP, D>>,
  ): Connector<P, OP, MergeOP<OP, D>>;

  declare export function connect<-P, -OP, -SP, -DP, -S, -D>(
    // If you get error here try adding return type to your mapStateToProps function
    mapStateToProps: MapStateToProps<S, OP, SP>,
    mapDispatchToProps?: null | void,
    mergeProps?: null | void,
    options?: ?Options<S, OP, SP, MergeOPSP<OP, SP>>,
  ): Connector<P, OP, MergeOPSP<OP, SP>>;

  // In this case DP is an object of functions which has been bound to dispatch
  // by the given mapDispatchToProps function.
  declare export function connect<-P, -OP, -SP, -DP, S, D>(
    mapStateToProps: null | void,
    mapDispatchToProps: MapDispatchToPropsFn<D, OP, DP>,
    mergeProps?: null | void,
    options?: ?Options<S, OP, {||}, MergeOPDP<OP, DP>>,
  ): Connector<P, OP, MergeOPDP<OP, DP>>;

  // In this case DP is an object of action creators not yet bound to dispatch,
  // this difference is not important in the vanila redux,
  // but in case of usage with redux-thunk, the return type may differ.
  declare export function connect<-P, -OP, -SP, -DP, S, D>(
    mapStateToProps: null | void,
    mapDispatchToProps: DP,
    mergeProps?: null | void,
    options?: ?Options<S, OP, {||}, MergeOPDP<OP, DP>>,
  ): Connector<P, OP, MergeOPDP<OP, $ObjMap<DP, Bind<D>>>>;

  declare export function connect<-P, -OP, -SP, -DP, S, D>(
    // If you get error here try adding return type to your mapStateToProps function
    mapStateToProps: MapStateToProps<S, OP, SP>,
    mapDispatchToProps: MapDispatchToPropsFn<D, OP, DP>,
    mergeProps?: null | void,
    options?: ?Options<S, OP, SP, {| ...OP, ...SP, ...DP |}>,
  ): Connector<P, OP, {| ...OP, ...SP, ...DP |}>;

  declare export function connect<-P, -OP, -SP, -DP, S, D>(
    // If you get error here try adding return type to your mapStateToProps function
    mapStateToProps: MapStateToProps<S, OP, SP>,
    mapDispatchToProps: DP,
    mergeProps?: null | void,
    options?: ?Options<S, OP, SP, MergeOPSPDP<OP, SP, DP>>,
  ): Connector<P, OP, MergeOPSPDP<OP, SP, $ObjMap<DP, Bind<D>>>>;

  // With `mergeProps` argument

  declare type MergeProps<+P, -OP, -SP, -DP> = (
    stateProps: SP,
    dispatchProps: DP,
    ownProps: OP,
  ) => P;

  declare export function connect<-P, -OP, -SP: {||}, -DP: {||}, S, D>(
    mapStateToProps: null | void,
    mapDispatchToProps: null | void,
    // If you get error here try adding return type to you mapStateToProps function
    mergeProps: MergeProps<P, OP, {||}, {| dispatch: D |}>,
    options?: ?Options<S, OP, {||}, P>,
  ): Connector<P, OP, P>;

  declare export function connect<-P, -OP, -SP, -DP: {||}, S, D>(
    mapStateToProps: MapStateToProps<S, OP, SP>,
    mapDispatchToProps: null | void,
    // If you get error here try adding return type to you mapStateToProps function
    mergeProps: MergeProps<P, OP, SP, {| dispatch: D |}>,
    options?: ?Options<S, OP, SP, P>,
  ): Connector<P, OP, P>;

  // In this case DP is an object of functions which has been bound to dispatch
  // by the given mapDispatchToProps function.
  declare export function connect<-P, -OP, -SP: {||}, -DP, S, D>(
    mapStateToProps: null | void,
    mapDispatchToProps: MapDispatchToPropsFn<D, OP, DP>,
    mergeProps: MergeProps<P, OP, {||}, DP>,
    options?: ?Options<S, OP, {||}, P>,
  ): Connector<P, OP, P>;

  // In this case DP is an object of action creators not yet bound to dispatch,
  // this difference is not important in the vanila redux,
  // but in case of usage with redux-thunk, the return type may differ.
  declare export function connect<-P, -OP, -SP: {||}, -DP, S, D>(
    mapStateToProps: null | void,
    mapDispatchToProps: DP,
    mergeProps: MergeProps<P, OP, {||}, $ObjMap<DP, Bind<D>>>,
    options?: ?Options<S, OP, {||}, P>,
  ): Connector<P, OP, P>;

  // In this case DP is an object of functions which has been bound to dispatch
  // by the given mapDispatchToProps function.
  declare export function connect<-P, -OP, -SP, -DP, S, D>(
    mapStateToProps: MapStateToProps<S, OP, SP>,
    mapDispatchToProps: MapDispatchToPropsFn<D, OP, DP>,
    mergeProps: MergeProps<P, OP, SP, DP>,
    options?: ?Options<S, OP, SP, P>,
  ): Connector<P, OP, P>;

  // In this case DP is an object of action creators not yet bound to dispatch,
  // this difference is not important in the vanila redux,
  // but in case of usage with redux-thunk, the return type may differ.
  declare export function connect<-P, -OP, -SP, -DP, S, D>(
    mapStateToProps: MapStateToProps<S, OP, SP>,
    mapDispatchToProps: DP,
    mergeProps: MergeProps<P, OP, SP, $ObjMap<DP, Bind<D>>>,
    options?: ?Options<S, OP, SP, P>,
  ): Connector<P, OP, P>;

  // ------------------------------------------------------------
  // Typings for Provider
  // ------------------------------------------------------------

  declare export class Provider<Store> extends React$Component<{
    store: Store,
    children?: React$Node,
  }> {}

  declare export function createProvider(
    storeKey?: string,
    subKey?: string,
  ): Class<Provider<*>>;

  // ------------------------------------------------------------
  // Typings for connectAdvanced()
  // ------------------------------------------------------------

  declare type ConnectAdvancedOptions = {
    getDisplayName?: (name: string) => string,
    methodName?: string,
    renderCountProp?: string,
    shouldHandleStateChanges?: boolean,
    storeKey?: string,
    withRef?: boolean,
  };

  declare type SelectorFactoryOptions<Com> = {
    getDisplayName: (name: string) => string,
    methodName: string,
    renderCountProp: ?string,
    shouldHandleStateChanges: boolean,
    storeKey: string,
    withRef: boolean,
    displayName: string,
    wrappedComponentName: string,
    WrappedComponent: Com,
  };

  declare type MapStateToPropsEx<S: Object, SP: Object, RSP: Object> = (
    state: S,
    props: SP,
  ) => RSP;

  declare type SelectorFactory<
    Com: React$ComponentType<*>,
    Dispatch,
    S: Object,
    OP: Object,
    EFO: Object,
    CP: Object,
  > = (
    dispatch: Dispatch,
    factoryOptions: SelectorFactoryOptions<Com> & EFO,
  ) => MapStateToPropsEx<S, OP, CP>;

  declare export function connectAdvanced<
    Com: React$ComponentType<*>,
    D,
    S: Object,
    OP: Object,
    CP: Object,
    EFO: Object,
    ST: { [_: $Keys<Com>]: any },
  >(
    selectorFactory: SelectorFactory<Com, D, S, OP, EFO, CP>,
    connectAdvancedOptions: ?(ConnectAdvancedOptions & EFO),
  ): (component: Com) => React$ComponentType<OP> & $Shape<ST>;

  declare export default {
    Provider: typeof Provider,
    createProvider: typeof createProvider,
    connect: typeof connect,
    connectAdvanced: typeof connectAdvanced,
  };
}
