// @flow
import { getPreset } from '../../../utils/dimension';
import type {
  DimensionMap,
  LiftRequest,
  Critical,
} from '../../../../src/types';

const preset = getPreset();

export const withExpectedAdvancedUsageWarning = (fn: Function) => {
  jest.spyOn(console, 'warn').mockImplementation(() => { });
  fn();
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Advanced usage warning'));
  console.warn.mockRestore();
};

export const defaultRequest: LiftRequest = {
  draggableId: preset.inHome1.descriptor.id,
  scrollOptions: {
    shouldPublishImmediately: false,
  },
};

export const critical: Critical = {
  draggable: preset.inHome1.descriptor,
  droppable: preset.home.descriptor,
};

export const justCritical: DimensionMap = {
  draggables: {
    [preset.inHome1.descriptor.id]: preset.inHome1,
  },
  droppables: {
    [preset.home.descriptor.id]: preset.home,
  },
};
