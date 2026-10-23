# Startup artwork

Only the lightning and IronLog wordmark appear. A static
HTML/SVG first paint is progressively enhanced without waiting for authentication
or delaying application readiness. The enhancement is unmounted before removal.

- React Bits Metallic Paint: https://reactbits.dev/animations/metallic-paint
  Vendored from https://reactbits.dev/r/MetallicPaint-JS-CSS.json (2026-10-23).
  License retained in vendor/REACT_BITS_LICENSE.md. Local additions notify the
  wrapper after its first image draw and on context loss, preserving the SVG
  when WebGL is unavailable. Prism settings are in start.jsx; color #27ff00.
- Animate UI Shimmering Text: @animate-ui/react 2.2.1, imported by primitive subpath.

Reduced motion is respected by Metallic Paint and Shimmering Text.
No minimum splash duration or extra profile/storage reads are introduced.
