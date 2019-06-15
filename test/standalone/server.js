// @flow
import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import uuidv4 from 'uuid/v4';
import { resolve } from 'path';
import Sample from './app';
import { resetServerContext } from '../../src';

const getNonce = () => Buffer.from(uuidv4()).toString('base64');

function getSample(policy?: string, nonce?: string) {
  resetServerContext();
  let meta = '';
  if (nonce) {
    meta += `<meta id="csp-nonce" property="csp-nonce" content="${nonce}" />`;
  }
  if (policy) {
    meta += `<meta http-equiv="Content-Security-Policy" content="${policy}"></meta>`;
  }
  return `<!doctype html><head>${meta}<head><html><body><div id="root">${renderToString(
    <Sample nonce={nonce} />,
  )}</div><script src="/client.js"></script></body></html>`;
}

export default (port: string, outputPath: string, fs: any) => {
  const server = express();

  server.get('/client.js', (req, res) => {
    res.header('content-type', 'text/javascript');
    res.end(fs.readFileSync(resolve(outputPath, 'client.js')));
  });

  function render(res: any, policy?: string, nonce?: string) {
    if (policy) {
      res.header('Content-Security-Policy', policy);
    }
    res.header('content-type', 'text/html');
    res.end(getSample(policy, nonce));
  }

  server.get('/', (req, res) => {
    render(res);
  });

  server.get('/unsafe-inline', (req, res) => {
    render(res, "style-src 'unsafe-inline'");
  });

  server.get('/nonce', (req, res) => {
    const nonce = getNonce();
    render(res, `style-src 'nonce-${nonce}'`, nonce);
  });

  server.get('/wrong-nonce', (req, res) => {
    const nonce = getNonce();
    const wrongNonce = getNonce();
    render(res, `style-src 'nonce-${nonce}'`, wrongNonce);
  });

  server.listen(port);
};
