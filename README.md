`plugin-bundles
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

In your lambda handler you now have access to a map with the path to bundled and fingerprinted modules

``` javascript
import map from '@architect/bundles/map.mjs'`
```
Map will look like this
``` javascript
export default {
  "/_bundles/yolo.mjs": "/_bundles/yolo-232bd6a.mjs",
}
````

In your browser code you can now request modules from  `/_bundles/` and the response will be the bundled and fingerprinted file.

You can use the map to look up the fingerprinted name.
``` javascript
import map from '@architect/bundles/map.mjs'`
const fingerprintedPath = map['/_bundles/yolo.mjs'] 
// fingerprintedPath would be: /_bundles/yolo-232bd6a.mjs
```