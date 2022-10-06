@app
bundles-with-esbuild-error

@http
get /

@plugins
architect/plugin-bundles
  src ../../../

@bundles
my-styles /lib/styles.css
