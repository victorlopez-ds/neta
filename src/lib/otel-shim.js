/**
 * No-op shim for @opentelemetry/api.
 *
 * @supabase/supabase-js imports this package via a dynamic `import()`, which
 * webpack and Vite silently ignore when the package is missing, but Metro
 * treats as a hard resolution error. This empty module satisfies the import
 * without pulling in the full OpenTelemetry SDK (which isn't needed in a
 * client-side app).
 */
module.exports = {};
