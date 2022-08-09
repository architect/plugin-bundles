# `plugin-bundles`
Plugin for exposing bundled modules to the browser from your Architect project.

## Install
`npm i @architect/plugin-bundles`

## Usage
In your `app.arc` file:
``` architect
@app
bndl-mock

@http
get /yolo

# Define you plugins pragma
@plugins
# Add the plugin bundles module
architect/plugin-bundles

# Define the bundles pragma
@bundles
# Specify which modules to bundle based off of file path.
# . Hint: You can include organization node modules by quoting the path
# . i.e. hashids "@begin/hashids"
yolo /lib/yolo.mjs
```

Bundles are will now be available at `/_static/bundles/yolo.mjs`
[If you have fingerprinting turned on then you can use `static.json` to look up the fingerprinted file name.](https://arc.codes/docs/en/guides/frontend/static-assets#fingerprint)
