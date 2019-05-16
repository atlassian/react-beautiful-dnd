// @flow
import type { DraggableId } from '../../types';

type Unregister = () => void;

export type Register = (id: DraggableId, focus: () => void) => Unregister;

export type FocusMarshal = {|
  register: Register,
  tryRecordFocus: (tryRecordFor: DraggableId) => void,
  tryRestoreFocusRecorded: () => void,
  tryGiveFocus: (tryGiveFocusTo: DraggableId) => void,
|};
