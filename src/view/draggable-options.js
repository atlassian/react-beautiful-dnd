// @flow
import invariant from 'tiny-invariant';

export type DraggableOptions = {|
  canDragInteractiveElements: boolean,
  shouldRespectForcePress: boolean,
  isEnabled: boolean,
|};

export function serialize(options: DraggableOptions): string {
  return JSON.stringify(options);
}

export function deserialize(raw: string): DraggableOptions {
  // this might throw too
  const parsed: Object = JSON.parse(raw);

  const proposed: DraggableOptions = {
    canDragInteractiveElements: parsed.canDragInteractiveElements,
    shouldRespectForcePress: parsed.shouldRespectForcePress,
    isEnabled: parsed.isEnabled,
  };

  // Some extra validation for non production environments
  if (process.env.NODE_ENV !== 'production') {
    const parsedKeys: string[] = Object.keys(parsed);
    const proposedKeys: string[] = Object.keys(proposed);

    const arrange = (keys: string[]): string => keys.sort().join('');

    invariant(
      arrange(parsedKeys) === arrange(proposedKeys),
      `Expected ${arrange(parsedKeys)} to equal ${arrange(proposedKeys)}`,
    );
    proposedKeys.forEach((key: string) => {
      invariant(
        proposed[key] != null,
        `Expected parsed object to have key "${key}"`,
      );
    });
  }

  return proposed;
}
