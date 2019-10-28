// @flow
import { invariant } from '../../invariant';
import type { Props } from './droppable-types';
import { warning } from '../../dev-warning';
import checkIsValidInnerRef from '../check-is-valid-inner-ref';
import useDevSetupWarning from '../use-dev-setup-warning';

type Args = {|
  props: Props,
  getDroppableRef: () => ?HTMLElement,
  getPlaceholderRef: () => ?HTMLElement,
|};

type CheckFn = (args: Args) => void;

function isBoolean(value: mixed): boolean {
  return typeof value === 'boolean';
}

function runChecks(args: Args, checks: CheckFn[]) {
  checks.forEach((check: CheckFn) => check(args));
}

const shared: CheckFn[] = [
  function required({ props }: Args) {
    invariant(props.droppableId, 'A Droppable requires a droppableId prop');
    invariant(
      typeof props.droppableId === 'string',
      `A Droppable requires a [string] droppableId. Provided: [${typeof props.droppableId}]`,
    );
  },
  function boolean({ props }: Args) {
    invariant(
      isBoolean(props.isDropDisabled),
      'isDropDisabled must be a boolean',
    );
    invariant(
      isBoolean(props.isCombineEnabled),
      'isCombineEnabled must be a boolean',
    );
    invariant(
      isBoolean(props.ignoreContainerClipping),
      'ignoreContainerClipping must be a boolean',
    );
  },
  function ref({ getDroppableRef }: Args) {
    checkIsValidInnerRef(getDroppableRef());
  },
];

const standard: CheckFn[] = [
  function placeholder({ props, getPlaceholderRef }: Args) {
    if (!props.placeholder) {
      return;
    }

    const ref: ?HTMLElement = getPlaceholderRef();

    if (ref) {
      return;
    }

    warning(`
      Droppable setup issue [droppableId: "${props.droppableId}"]:
      DroppableProvided > placeholder could not be found.

      Please be sure to add the {provided.placeholder} React Node as a child of your Droppable.
      More information: https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/api/droppable.md
    `);
  },
];

const virtual: CheckFn[] = [
  function hasClone({ props }: Args) {
    invariant(
      props.renderClone,
      'Must provide a clone render function (renderClone) for virtual lists',
    );
  },
  function hasNoPlaceholder({ getPlaceholderRef }: Args) {
    invariant(
      !getPlaceholderRef(),
      'Expected virtual list to not have a placeholder',
    );
  },
];

export default function useValidation(args: Args) {
  useDevSetupWarning(() => {
    // wrapping entire block for better minification
    runChecks(args, shared);

    if (args.props.mode === 'standard') {
      runChecks(args, standard);
    }

    if (args.props.mode === 'virtual') {
      runChecks(args, virtual);
    }
  });
}
