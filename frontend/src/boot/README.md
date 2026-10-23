# Startup artwork

Only the Prism lightning and shimmering IronLog wordmark appear. The HTML first
paints black, with no static logo or wordmark fallback. The complete stage stays
hidden until Metallic Paint has loaded and processed the lightning asset and
rendered its first image frame. There is no loading bar or artificial delay.
Application readiness dismisses the overlay even if the artwork is not ready or
cannot render. Context loss hides the artwork rather than replacing its logo.

- React Bits Metallic Paint: https://reactbits.dev/animations/metallic-paint
  Vendored from https://reactbits.dev/r/MetallicPaint-JS-CSS.json (2026-10-23).
  License retained in vendor/REACT_BITS_LICENSE.md. Local callbacks notify the
  wrapper after its first image draw and on context loss. Prism settings are in
  start.jsx; color #27ff00.
- Animate UI Shimmering Text: @animate-ui/react 2.2.1, imported by primitive subpath.

Reduced motion is respected by both effects. Dismissal unmounts React and releases
the shader resources. No profile/storage reads are introduced by the artwork.
