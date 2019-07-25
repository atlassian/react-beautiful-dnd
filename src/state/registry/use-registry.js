// @flow
import { useEffect } from 'react';
import { useMemo } from 'use-memo-one';
import type { Registry } from './registry-types';
import createRegistry from './create-registry';

export default function useRegistry(): Registry {
  const registry: Registry = useMemo(createRegistry, []);

  useEffect(() => {
    return function unmount() {
      // clean up the registry to avoid any leaks
      // doing it after an animation frame so that other things unmounting
      // can continue to interact with the registry
      requestAnimationFrame(registry.clean);
    };
  }, [registry]);

  return registry;
}
