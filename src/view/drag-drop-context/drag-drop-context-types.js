// @flow
export type AppCallbacks = {|
  isDragging: () => boolean,
  tryAbort: () => void,
|};

export type SetAppCallbacks = (callbacks: AppCallbacks) => void;
