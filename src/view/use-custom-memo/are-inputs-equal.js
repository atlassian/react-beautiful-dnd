// @flow
const isShallowEqual = (newValue: mixed, oldValue: mixed): boolean =>
  newValue === oldValue;

export default function areInputsEqual(
  newInputs: mixed[],
  lastInputs: mixed[],
) {
  return (
    newInputs.length === lastInputs.length &&
    newInputs.every(
      (newArg: mixed, index: number): boolean =>
        isShallowEqual(newArg, lastInputs[index]),
    )
  );
}
