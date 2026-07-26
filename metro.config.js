// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// @supabase/supabase-js v2.45+ has an optional dynamic import for
// @opentelemetry/api that Metro cannot resolve (it's not installed and not
// needed). Redirect it to a tiny no-op shim so the bundler doesn't crash.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@opentelemetry/api': require.resolve('./src/lib/otel-shim.js'),
};

module.exports = config;
