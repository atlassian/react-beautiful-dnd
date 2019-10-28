// @flow
import type { Placeholder } from '../../../../../src/types';
import { getPreset } from '../../../../util/dimension';

export const preset = getPreset();
export const placeholder: Placeholder = preset.inHome1.placeholder;
