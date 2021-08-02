// @flow
import { DropTargetCalculationMode } from '../../src/view/draggable/draggable-types';

export const grid: number = 8;
export const borderRadius: number = 2;
export const dropTargetCalculationMode: { [dropTargetCalculationMode: DropTargetCalculationMode]: DropTargetCalculationMode } = {
    box: 'box',
    pointer: 'pointer',
};