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
      registry.clean();
    };
  }, [registry]);

  return registry;
}
