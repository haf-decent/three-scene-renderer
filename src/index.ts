import { Color, Texture, CubeTexture, OrthographicCamera, PerspectiveCamera, Scene, Clock, WebGLRenderer, WebGLRendererParameters } from "three";

type SceneProps = {
	autoUpdate?: boolean,
	background?: Color | Texture | CubeTexture | null,
	environment?: Texture | null,
}

type Props = {
	embedded?: boolean,
	width?: number,
	height?: number,
	scene?: SceneProps,
	clock?: { autoStart?: boolean },
	renderer?: WebGLRendererParameters,
	camera: OrthographicCamera | PerspectiveCamera
}

type RenderProps = {
	scene: Scene,
	renderer: WebGLRenderer,
	camera: OrthographicCamera | PerspectiveCamera,
	delta: number
}

type RenderListener = (props: RenderProps) => void;
type ResizeListener = ({ width, height }: { width: number, height: number }) => void;

export class SceneRenderer {
	embedded: boolean;
	scene: Scene;
	clock: Clock;
	camera: OrthographicCamera | PerspectiveCamera;
	renderer: WebGLRenderer;
	renderParams: RenderProps;
	onRender: RenderListener[];
	onResize: ResizeListener[];
	shouldRender: boolean;
	replaceRender: (() => void) | null;

	constructor({
		embedded = false,
		width = window.innerWidth,
		height = window.innerHeight, 
		scene = {},
		clock: { autoStart = true } = {},
		renderer = {}, 
		camera
	}: Props) {
		this.embedded = embedded;

		this.scene = new Scene();
		Object.entries(scene).forEach(([ prop, val ]) => this.scene[ prop ] = val);
		this.clock = new Clock(autoStart);

		this.camera = camera;

		this.renderer = new WebGLRenderer(renderer);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(width, height);
		if (!renderer.hasOwnProperty("canvas")) document.body.appendChild(this.renderer.domElement);
		this.renderParams = {
			scene: this.scene,
			renderer: this.renderer,
			camera: this.camera,
			delta: 0
		}
		this.onRender = [];

		this.onResize = [];

		this.shouldRender = false;
		this.render = this.render.bind(this);
		this.replaceRender = null;
		if (!embedded) {
			this.resize();
			this.listenResize();
		}
	}

	on(event: "render" | "resize", cb: RenderListener | RenderListener[] | ResizeListener | RenderListener[]) {
		switch(event) {
			case "render":
				if (Array.isArray(cb)) {
					Array.prototype.push.apply(this.onRender, cb);
					return cb.map(callback => () => this.off(event, callback));
				}
				else {
					this.onRender.push(cb as RenderListener);
					return () => this.off(event, cb);
				}
			case "resize":
				if (Array.isArray(cb)) {
					Array.prototype.push.apply(this.onResize, cb);
					return cb.map(callback => () => this.off(event, callback));
				}
				else {
					this.onResize.push(cb as ResizeListener);
					return () => this.off(event, cb);
				}
			default:
				console.warn(`Cannot add listener, event '${event}' does not exist.`);
				return null;
		}
	}

	off(event: "render" | "resize", cb: RenderListener | ResizeListener) {
		let i;
		switch(event) {
			case "render":
				i = this.onRender.indexOf(cb as RenderListener);
				if (i > -1) this.onRender.splice(i, 1);
				else console.warn(`Cannot find listener to remove`);
				break;
			case "resize":
				i = this.onResize.indexOf(cb as ResizeListener);
				if (i > -1) this.onRender.splice(i, 1);
				else console.warn(`Cannot find listener to remove`);
				break;
		}
	}

	startRender() {
		this.shouldRender = true;
		if (!this.clock.running) this.clock.start();
		this.render();
	}
	render() {
		if (!this.shouldRender) return;
		requestAnimationFrame(this.render);

		this.renderParams.delta = this.clock.getDelta();
		this.onRender.forEach(cb => cb(this.renderParams));

		if (this.replaceRender) this.replaceRender();
		else this.renderer.render(this.scene, this.camera);
	}
	renderOnce() {
		this.startRender();
		this.stopRender();
	}
	stopRender() {
		this.shouldRender = false;
		this.clock.stop();
	}

	resize({ width = window.innerWidth, height = window.innerHeight } = {}) {
		(this.camera as PerspectiveCamera).aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);
		this.onResize.forEach(cb => cb({ width, height }));
	}
	listenResize() {
		window.addEventListener("load", () => this.resize());
		window.addEventListener("resize", () => this.resize());
	}
}