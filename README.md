# three-scene-renderer
Helper class for initializing and managing THREEjs scenes & render pipelines.

The goal is to create a simplified interface to THREE by taking care of some of the boilerplate code that most THREE scene's end up using, as well as creating some helper methods for rendering and events.

## Installation
```bash
npm install three-scene-renderer
```

## Usage
Import the `SceneRenderer` class from the module. Supply a camera and customize the scene/renderer as needed.

```js
...
import { SceneRenderer } from "three-scene-renderer";

const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 5000);
camera.position.set(0, 5, 20);
camera.lookAt(0, 0, 0);

// S: Scene, C: Clock, R: Renderer
const scr = new SceneRenderer({
	embedded: false,             // (default) whether renderer.domElement is embedded in parent element
	width: window.innerWidth,    // (default) width of renderer.domElement
	height: window.innerHeight,  // (default) height of renderer.domElement
	scene: {},                   // (default) autoUpdate, background, and environment properties
	clock: { autoStart: true },  // (default)
	renderer: {},                // (default) any valid WebGLRendererParameters
	camera                       // Orthographic or Perspective Camera instance
});

const box = new Mesh(...);
scr.scene.add(box);

scr.on("render", () => box.rotation.y += 0.005);
scr.startRender();
```

## Properties
A new instance creates a new `THREE.Scene` scene, `THREE.WebGLRenderer` renderer, and `THREE.Clock` clock. Outside of those interfaces, the `replaceRender` property is the only one that is changed manually.

### replaceRender
If set, this function will be run __instead__ of the default `WebGLRenderer.render` method. This is useful for rendering scenes with the `EffectComposer` and full-scene post-processing shaders.

## Methods

### on/off
The `on`/`off` methods add/remove handlers to be run during "render" and "resize" events. This is useful for updating things like controls or `CubeCamera`s, or automatically resizing an `EffectComposer`. For `on`, you can pass a single callback or an array of callbacks. The `on` function returns a corresponding function or array of functions for unsubscribing events - equivalent to calling `scr.off(event, callback)`. `off` only accepts individual handler functions.

```js
...

const scr = new SceneRenderer({ camera });

const [ unsubscribeControls, unsubscribeCubeCamera ] = scr.on("render", [
	() => controls.update(),
	function updateCubeCamera() {
		cubeCamera.update(scr.renderer, scr.scene)
	}
]);
const unsubscribeComposerResizer = scr.on("resize", ({ width, height }) => composer.setSize(width, height));

// remove "() => cubeCamera.update(scr.renderer, scr.scene)"
setTimeout(unsubscribeCubeCamera, 5000);
// equivalent to
// setTimeout(() => scr.off("render", updateCubeCamera), 5000);
```

### Render Methods

#### startRender
Begins rendering the scene continuously, until `stopRender` is called.

#### stopRender
Stops rendering the scene.

#### renderOnce
Convenience function for rendering a single frame. Useful if you have a relatively static scene that might only need to update on some user interaction, for example.

### resize
In general, this should only be called manually if the scene is embedded and the parent container resizes.

```js
...

const container = document.getElementById("my-container");
const canvas = container.querySelector("canvas");

const scr = new SceneRenderer({
	camera,
	embedded: true,
	renderer: { canvas } // the WebGLRenderer will be created using this embedded canvas
});

window.addEventListener("resize", () => {
	const { width, height } = container.getBoundingClientRect();
	scr.resize({ width, height });
});
```