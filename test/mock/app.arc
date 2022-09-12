@app
bndl-mock

@static
fingerprint true

@http
get /

@plugins
architect/plugin-bundles
  src ../../

@bundles
yolo /lib/yolo.mjs
some-ts /lib/some.ts
node-internals /lib/node-things.js
