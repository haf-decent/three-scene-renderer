import * as THREE from "three";
import { SceneRenderer } from "../../dist/esm/index.js";

window.addEventListener("load", () => {
	const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 5000);
	camera.position.set(0, 5, 20);
	camera.lookAt(0, 0, 0);

	const scr = new SceneRenderer({ camera });
	const { scene } = scr;

	// Lights
	const ambient = new THREE.AmbientLight(0xffffff);
	scene.add(ambient);

	const light = new THREE.DirectionalLight(0xffffff, 12);
	light.rotation.x = -Math.PI / 9;
	scene.add(light);

	const box = new THREE.Mesh(
		new THREE.BoxGeometry(4, 4, 4),
		new THREE.MeshStandardMaterial({ color: "red" })
	);
	scene.add(box);

	scr.on("render", () => box.rotation.y -= 0.002);
	scr.startRender();
});
