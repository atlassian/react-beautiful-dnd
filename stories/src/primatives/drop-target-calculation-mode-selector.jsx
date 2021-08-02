// @flow
import React, { type SyntheticEvent } from 'react';
import { dropTargetCalculationMode } from '../constants';
import { DropTargetCalculationMode } from '../../../src/view/draggable/draggable-types';

export default function DropTargetCalculationModeSelector({
  onChange,
  ...rest
}: {
  onChange?: (value: DropTargetCalculationMode) => void,
}) {
  return (
    <select
      style={{ margin: '0.5rem' }}
      {...rest}
      onChange={
        onChange
          ? (e: SyntheticEvent) => onChange(e.target.selectedOptions[0].value)
          : undefined
      }
    >
      <option value={dropTargetCalculationMode.box}>
        {dropTargetCalculationMode.box}
      </option>
      <option value={dropTargetCalculationMode.pointer}>
        {dropTargetCalculationMode.pointer}
      </option>
    </select>
  );
}
