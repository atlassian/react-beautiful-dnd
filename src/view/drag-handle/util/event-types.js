// @flow

export type EventOptions = {|
  passive?: boolean,
  capture?: boolean,
|}

export type EventBinding = {|
  eventName: string,
  fn: Function,
  options?: EventOptions,
|}
