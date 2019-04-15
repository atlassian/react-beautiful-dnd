// @flow
import { getMarshalStub } from '../../../../utils/dimension-marshal';
import { type AppContextValue } from '../../../../../src/view/context/app-context';

const value: AppContextValue = {
  marshal: getMarshalStub(),
  style: '1',
  canLift: () => true,
  isMovementAllowed: () => true,
};

export default value;
