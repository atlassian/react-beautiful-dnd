// flow-typed signature: f62df6dbce399d55b0f2954c5ac1bd4e
// flow-typed version: c6154227d1/redux_v4.x.x/flow_>=v0.104.x

declare module 'redux' {
  /*

    S = State
    A = Action
    D = Dispatch

  */

  declare export type Action<T> = { type: T, ... }

  declare export type DispatchAPI<A> = (action: A) => A;

  declare export type Dispatch<A: { type: *, ... }> = DispatchAPI<A>;

  declare export type MiddlewareAPI<S, A, D = Dispatch<A>> = {
    dispatch: D,
    getState(): S,
    ...
  };

  declare export type Store<S, A, D = Dispatch<A>> = {
    // rewrite MiddlewareAPI members in order to get nicer error messages (intersections produce long messages)
    dispatch: D,
    getState(): S,
    subscribe(listener: () => void): () => void,
    replaceReducer(nextReducer: Reducer<S, A>): void,
    ...
  };

  declare export type Reducer<S, A> = (state: S | void, action: A) => S;

  declare export type CombinedReducer<S, A> = (
    state: ($Shape<S> & {...}) | void,
    action: A
  ) => S;

  declare export type Middleware<S, A, D = Dispatch<A>> = (
    api: MiddlewareAPI<S, A, D>
  ) => (next: D) => D;

  declare export type StoreCreator<S, A, D = Dispatch<A>> = {
    (reducer: Reducer<S, A>, enhancer?: StoreEnhancer<S, A, D>): Store<S, A, D>,
    (
      reducer: Reducer<S, A>,
      preloadedState: S,
      enhancer?: StoreEnhancer<S, A, D>
    ): Store<S, A, D>,
    ...
  };

  declare export type StoreEnhancer<S, A, D = Dispatch<A>> = (
    next: StoreCreator<S, A, D>
  ) => StoreCreator<S, A, D>;

  declare export function createStore<S, A, D>(
    reducer: Reducer<S, A>,
    enhancer?: StoreEnhancer<S, A, D>
  ): Store<S, A, D>;
  declare export function createStore<S, A, D>(
    reducer: Reducer<S, A>,
    preloadedState?: S,
    enhancer?: StoreEnhancer<S, A, D>
  ): Store<S, A, D>;

  declare export function applyMiddleware<S, A, D>(
    ...middlewares: Array<Middleware<S, A, D>>
  ): StoreEnhancer<S, A, D>;

  declare export type ActionCreator<A, B> = (...args: Array<B>) => A;
  declare export type ActionCreators<K, A> = { [key: K]: ActionCreator<A, any>, ... };

  declare export function bindActionCreators<
    A,
    C: ActionCreator<A, any>,
    D: DispatchAPI<A>
  >(
    actionCreator: C,
    dispatch: D
  ): C;
  declare export function bindActionCreators<
    A,
    K,
    C: ActionCreators<K, A>,
    D: DispatchAPI<A>
  >(
    actionCreators: C,
    dispatch: D
  ): C;

  declare export function combineReducers<O: {...}, A>(
    reducers: O
  ): CombinedReducer<$ObjMap<O, <S>(r: Reducer<S, any>) => S>, A>;

  declare export var compose: $Compose;
}
