@app
bundles-with-esbuild-config

@http
get /

@plugins
architect/plugin-bundles
  src ../../../

@bundles
node-internals /lib/node-things.js
