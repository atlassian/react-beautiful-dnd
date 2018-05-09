// @flow
import type { Store, State, Action } from '../../types';
import type { DimensionMarshal } from '../dimension-marshal/dimension-marshal-types';

export default (getMarshal: () => DimensionMarshal) =>
  () => (next: (Action) => mixed) => (action: Action): mixed => {
    if (action.type === 'CLEAN' || action.type === 'DROP_ANIMATE' || action.type === 'DROP_COMPLETE') {
      console.log('telling the marshal to stop');
      const marshal: DimensionMarshal = getMarshal();
      marshal.stopPublishing();
    }

    next(action);
  };
