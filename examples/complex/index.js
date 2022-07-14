import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import { SceneRenderer } from "../../dist/esm/index.js";

window.addEventListener("load", () => {
	const toggle = document.getElementById("toggle");

	const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 5000);
	camera.position.set(0, 5, 20);
	camera.lookAt(0, 0, 0);
	
	const scr = new SceneRenderer({ camera, renderer: { antialias: true } });
	const { scene, renderer } = scr;
	renderer.toneMapping = THREE.ReinhardToneMapping;
	
	// Lights
	const ambient = new THREE.AmbientLight(0xffffff);
	scene.add(ambient);
	
	const light = new THREE.DirectionalLight(0xffffff, 1);
	light.rotation.x = -Math.PI / 9;
	scene.add(light);
	
	// Controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.update();
	controls.enablePan = false;
	controls.enableZoom = false;
	
	// Bloom
	const BLOOM_SCENE = 1;
	
	const bloomLayer = new THREE.Layers();
	bloomLayer.set(BLOOM_SCENE);
	
	const params = {
		exposure: 0.8,
		bloomStrength: 4,
		bloomThreshold: 0,
		bloomRadius: 0.5
	};
	
	const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
	const materials = {};
	
	const renderScene = new RenderPass(scene, camera);
	
	const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
	bloomPass.threshold = params.bloomThreshold;
	bloomPass.strength = params.bloomStrength;
	bloomPass.radius = params.bloomRadius;
	
	const bloomComposer = new EffectComposer(renderer);
	bloomComposer.renderToScreen = false;
	bloomComposer.addPass(renderScene);
	bloomComposer.addPass(bloomPass);
	
	const finalPass = new ShaderPass(
		new THREE.ShaderMaterial({
			uniforms: {
				baseTexture: { value: null },
				bloomTexture: { value: bloomComposer.renderTarget2.texture }
			},
			vertexShader: `
				varying vec2 vUv;
	
				void main() {
						vUv = uv;
						gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}
				`,
			fragmentShader: `
				uniform sampler2D baseTexture;
				uniform sampler2D bloomTexture;
	
				varying vec2 vUv;
	
				void main() {
						gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
				}
				`,
			defines: {}
		}),
		"baseTexture"
	);
	finalPass.needsSwap = true;
	
	const finalComposer = new EffectComposer(renderer);
	finalComposer.addPass(renderScene);
	finalComposer.addPass(finalPass);
	
	const renderBloom = () => {
		// render scene with bloom
		scene.traverse(darkenNonBloomed);
		bloomComposer.render();
		scene.traverse(restoreMaterial);
		// render the entire scene, then render bloom scene on top
		finalComposer.render();
	}
	
	const resizeBloom = ({ width, height }) => {
		bloomComposer.setSize(width, height);
		finalComposer.setSize(width, height);
	}
	
	const darkenNonBloomed = obj => {
		if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
			materials[obj.uuid] = obj.material;
			obj.material = darkMaterial;
		}
	}
	
	const restoreMaterial = obj => {
		if (materials[obj.uuid]) {
			obj.material = materials[obj.uuid];
			delete materials[obj.uuid];
		}
	}
	
	// reflections
	const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, { format: THREE.RGBAFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
	const mirrorCubeCamera = new THREE.CubeCamera(1, 100000, cubeRenderTarget);
	scene.add(mirrorCubeCamera);
	
	// middle sphere
	const bloomMat = new THREE.MeshStandardMaterial({ color: "red" });
	const refMat = new THREE.MeshBasicMaterial({
		envMap: cubeRenderTarget.texture,
		transparent: true,
		opacity: 0.9,
		side: THREE.DoubleSide
	});
	const sphere = new THREE.Mesh(new THREE.SphereGeometry(2, 64, 32), bloomMat);
	sphere.layers.enable(BLOOM_SCENE);
	scene.add(sphere);
	
	// boxes
	const boxGeo = new THREE.BoxGeometry(4, 4, 4);
	const boxMat = new THREE.MeshStandardMaterial({ color: "cyan" });
	for (let i = 0; i < 6; i++) {
		const box = new THREE.Mesh(boxGeo, boxMat);
		const angle = Math.PI / 3 * i
		box.position.set(10 * Math.sin(angle), 0, 10 * Math.cos(angle));
		scene.add(box);
	}
	
	// background
	const bgSphere = new THREE.Mesh(
		new THREE.SphereGeometry(200, 64, 32),
		new THREE.MeshBasicMaterial({
			color: "white",
			map: new THREE.TextureLoader().load("./checker.png"),
			side: THREE.BackSide
		})
	);
	bgSphere.visible = false;
	scene.add(bgSphere);
	
	scr.on("resize", resizeBloom);
	scr.on("render", [
		() => mirrorCubeCamera.update(renderer, scene),
		() => controls.update()
	]);
	scr.replaceRender = renderBloom;
	
	// render once initially, and then only render again when controls are active
	scr.renderOnce();
	controls.addEventListener("start", () => scr.startRender());
	controls.addEventListener("end", () => scr.stopRender());
	
	// toggle between bloom and reflection scenes
	let bloomEnabled = true;
	toggle.onclick = () => {
		bloomEnabled = !bloomEnabled;
		if (bloomEnabled) {
			bgSphere.visible = false;
			sphere.material = bloomMat;
			scr.replaceRender = renderBloom;
			light.intensity = 1;
			scr.renderOnce();
		}
		else {
			bgSphere.visible = true;
			sphere.material = refMat;
			scr.replaceRender = null;
			light.intensity = 12;
			scr.renderOnce();
		}
	}
});
