// @flow
import createDimensionMarshal from '../../../../src/state/dimension-marshal/dimension-marshal';
import { getPreset } from '../../../util/dimension';
import type {
  Callbacks,
  DimensionMarshal,
} from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import { getCallbacksStub } from '../../../util/dimension-marshal';
import { critical, defaultRequest, justCritical } from './util';
import createRegistry from '../../../../src/state/registry/create-registry';
import type { Registry } from '../../../../src/state/registry/registry-types';
import { populate, type DimensionWatcher } from '../../../util/registry';

const preset = getPreset();

describe('force scrolling a droppable', () => {
  it('should scroll the droppable', () => {
    const registry: Registry = createRegistry();
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    const watcher: DimensionWatcher = populate(registry);

    // initial lift
    marshal.startPublishing(defaultRequest);
    expect(watcher.droppable.scroll).not.toHaveBeenCalled();

    // scroll
    marshal.scrollDroppable(critical.droppable.id, { x: 10, y: 20 });
    expect(watcher.droppable.scroll).toHaveBeenCalledWith(
      critical.droppable.id,
      { x: 10, y: 20 },
    );
  });

  it('should throw if the droppable cannot be found', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry, justCritical);

    // initial lift
    marshal.startPublishing(defaultRequest);

    // scroll
    expect(() => {
      marshal.scrollDroppable(preset.foreign.descriptor.id, { x: 10, y: 20 });
    }).toThrow();
  });

  it('should not scroll the droppable if no collection is occurring', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    const watcher: DimensionWatcher = populate(registry);

    marshal.scrollDroppable(critical.droppable.id, { x: 10, y: 20 });
    expect(watcher.droppable.scroll).not.toHaveBeenCalled();
  });
});

describe('responding to scroll changes', () => {
  it('should let consumers know', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    const watcher: DimensionWatcher = populate(registry);

    // initial lift
    marshal.startPublishing(defaultRequest);
    expect(watcher.droppable.scroll).not.toHaveBeenCalled();

    marshal.updateDroppableScroll(critical.droppable.id, { x: 10, y: 20 });
    expect(callbacks.updateDroppableScroll).toHaveBeenCalledWith({
      id: critical.droppable.id,
      newScroll: { x: 10, y: 20 },
    });
  });

  it('should throw if the droppable cannot be found', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry, justCritical);

    // initial lift
    marshal.startPublishing(defaultRequest);
    expect(callbacks.updateDroppableScroll).not.toHaveBeenCalled();

    expect(() => {
      marshal.updateDroppableScroll(preset.foreign.descriptor.id, {
        x: 10,
        y: 20,
      });
    }).toThrow(
      'Invariant failed: Cannot update the scroll on Droppable foreign as it is not registered',
    );
  });

  it('should not let consumers know if know drag is occurring', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry, justCritical);

    marshal.updateDroppableScroll(critical.droppable.id, { x: 10, y: 20 });
    expect(callbacks.updateDroppableScroll).not.toHaveBeenCalled();
  });
});

describe('is enabled changes', () => {
  it('should let consumers know', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry);

    // initial lift
    marshal.startPublishing(defaultRequest);
    expect(callbacks.updateDroppableIsEnabled).not.toHaveBeenCalled();

    marshal.updateDroppableIsEnabled(critical.droppable.id, false);
    expect(callbacks.updateDroppableIsEnabled).toHaveBeenCalledWith({
      id: critical.droppable.id,
      isEnabled: false,
    });
  });

  it('should throw if the droppable cannot be found', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry, justCritical);

    // initial lift
    marshal.startPublishing(defaultRequest);
    expect(callbacks.updateDroppableIsEnabled).not.toHaveBeenCalled();

    expect(() =>
      marshal.updateDroppableIsEnabled(preset.foreign.descriptor.id, false),
    ).toThrow(
      'Invariant failed: Cannot update is enabled flag of Droppable foreign as it is not registered',
    );
  });

  it('should not let consumers know if no collection is occurring', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry, justCritical);

    marshal.updateDroppableIsEnabled(critical.droppable.id, false);
    expect(callbacks.updateDroppableIsEnabled).not.toHaveBeenCalled();
  });
});
