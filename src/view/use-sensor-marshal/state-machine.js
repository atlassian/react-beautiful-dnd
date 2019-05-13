// @flow

type Definition = {|
  initial: T,
  states: {
    [value: 'PENDING', transition: New]
  }
|};

type Machine = {|
  transition: (newState: T) => void,
  getValue: () => T,
|};

export default function getMachine(definition: Definition): Machine {}
