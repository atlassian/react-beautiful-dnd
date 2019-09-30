// @flow
export type AppCallbacks = {|
  isDragging: () => boolean,
  tryAbort: () => void,
|};

export type SetAppCallbacks = (callbacks: AppCallbacks) => void;

export type ErrorMode = 'recover' | 'abort';
