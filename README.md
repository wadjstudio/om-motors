# OM Motors homepage

Hosted with GitHub Pages at https://om.wadj.online/ from the main branch root. The CNAME file keeps the custom domain attached to future deployments. DNS uses an om CNAME pointing to wadjstudio.github.io.

Premium responsive homepage using the supplied vehicle references. Includes a genuine WebGL concept SUV, drag and keyboard orbit, automatic rotation, five paint finishes, zoom, reset and fullscreen. Motion respects the device's reduced-motion preference.

Run `node server.cjs` from this folder, then open http://127.0.0.1:4173. No build step or package installation is needed. Three.js is bundled locally; optional Google Fonts use the network, with system font fallbacks.

The showcase loads assets/om-generated.glb, generated from the supplied car reference with Microsoft's free TRELLIS.2 Hugging Face demo. The GLB is stored locally and needs no runtime generation service. It contains an AI reconstruction, so unseen surfaces and fine details may differ from the reference. Its source settings are recorded in assets/model-provenance.json. Neutral body surfaces receive a selective paint tint; glass, tires and colored trim retain their original texture. The procedural concept remains a fallback if loading fails.

Files: index.html, style.css, app.js, model-loader.js, assets/, server.cjs.
Three.js documentation: https://threejs.org/docs/ (MIT license).

Reveal film: assets/om-reveal.mp4 is a cropped copy of the supplied OM Motors Reveal Ad.mp4. The bottom 70 pixels were removed (1280×650); the original audio and full duration are retained. The homepage uses native video controls and loads metadata only.
