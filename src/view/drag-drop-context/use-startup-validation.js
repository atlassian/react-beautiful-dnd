// @flow
import React, { useEffect } from 'react';
import { peerDependencies } from '../../../package.json';
import checkReactVersion from './check-react-version';
import checkDoctype from './check-doctype';

export default function useStartupValidation() {
  // Only need to run these when mounting
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    checkReactVersion(peerDependencies.react, React.version);
    checkDoctype(document);
  }, []);
}
