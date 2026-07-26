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

// Expo modules use class names at runtime (registerWebModule checks them).
// Metro's default minifier mangles class names in production, breaking those
// checks and causing "Module implementation must be a class" errors.
// Preserving class/function names fixes this with minimal bundle size impact.
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  keep_classnames: true,
  keep_fnames: true,
};

module.exports = config;
