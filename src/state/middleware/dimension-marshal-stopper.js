// @flow
import isDragEnding from './util/is-drag-ending';
import type { Action } from '../../types';
import type { DimensionMarshal } from '../dimension-marshal/dimension-marshal-types';

export default (getMarshal: () => DimensionMarshal) =>
  () => (next: (Action) => mixed) => (action: Action): mixed => {
    if (isDragEnding(action)) {
      const marshal: DimensionMarshal = getMarshal();
      marshal.stopPublishing();
    }

    next(action);
  };
