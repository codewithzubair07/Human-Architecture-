<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Smooth Interactive Video/Model Scrubbing

When implementing cursor-interactive or scrub-controlled background videos (e.g., 3D-like models served in video formats):
1. **Seek-Locks via Events**: Do not set `video.currentTime` blindly in a `requestAnimationFrame` loop or throttle with simple timers. Instead, use a synchronous `isSeeking` lock variable. Set it to `true` when setting `currentTime` and reset it to `false` inside a `seeked` event listener on the video. Add a `150ms` lock bypass timeout to ensure it never hangs.
2. **Linear Interpolation (LERP)**: Use a LERP factor between `0.06` and `0.1` (ideally `0.08`) for a highly responsive, organic, and tight catch-up feel.
3. **Background Isolation (Multiply Blending)**: Apply CSS `mix-blend-multiply` to light-background video layers. This filters out the light vignette/backdrop of the video frame, making it transparent and rendering only the high-contrast model itself cleanly over the page background.
4. **Collision Scaling**: Use CSS transform scaling and translations (e.g., `scale(0.88) translate(2%, 4%)` with `transform-origin: right bottom`) to shrink the model and push it away from header elements/navigation links to prevent collision.
5. **No Layout Shift**: Wrap typewriter or dynamic text blocks in containers with reserved height/min-height limits (e.g., `min-h-[2.85em]`) to prevent layout shifts.

