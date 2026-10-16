import { describe, it } from 'node:test';
import assert from 'node:assert';
import nextConfig from '../next.config.ts';

describe('Hermes Hub Deprecation & Redirect Governance', () => {
  it('[TC-HUB-REDIR-01] Validates 308 permanent redirect from /portfolio to https://sevarchky.my.id', async () => {
    assert.strictEqual(typeof nextConfig.redirects, 'function');
    const redirects = await nextConfig.redirects!();
    
    const rootRedirect = redirects.find((r) => r.source === '/portfolio');
    assert.ok(rootRedirect, 'Missing /portfolio redirect');
    assert.strictEqual(rootRedirect.destination, 'https://sevarchky.my.id');
    assert.strictEqual(rootRedirect.permanent, true);

    const wildcardRedirect = redirects.find((r) => r.source === '/portfolio/:path*');
    assert.ok(wildcardRedirect, 'Missing /portfolio/:path* wildcard redirect');
    assert.strictEqual(wildcardRedirect.destination, 'https://sevarchky.my.id/:path*');
    assert.strictEqual(wildcardRedirect.permanent, true);
  });
});
