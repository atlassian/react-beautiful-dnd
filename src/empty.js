// @flow
export function noop(): void {}

export function identity<T>(value: T): T {
  return value;
}
