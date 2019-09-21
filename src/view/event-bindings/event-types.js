// @flow

export type EventOptions = {|
  passive?: boolean,
  capture?: boolean,
  // sometimes an event might only event want to be bound once
  once?: boolean,
|};

export type EventBinding = {|
  eventName: string,
  fn: Function,
  options?: EventOptions,
|};
