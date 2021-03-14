class SceneRenderer {
    constructor({ 
        embedded = false, width = window.innerWidth, height = window.innerHeight, 
        scene = {}, clock: { autoStart = true } = {}, renderer = {}, 
        camera
    }) {
        this.embedded = embedded;

        this.scene = new THREE.Scene();
        Object.entries(scene).forEach(([ prop, val ]) => this.scene[ prop ] = val);
        this.clock = new THREE.Clock(autoStart);

        this.camera = camera;

        this.renderer = new THREE.WebGLRenderer(renderer);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        if (!renderer.canvas) document.body.appendChild(this.renderer.domElement);
        this.renderParams = {
            scene: this.scene,
            renderer: this.renderer,
            camera: this.camera,
            delta: 0
        }
        this.onRender = [];

        this.onResize = [];

        this.shouldRender = false;
        this.replaceRender = null;
        this.resize = this.resize.bind(this);
        this.render = this.render.bind(this);
        if (!embedded) {
            this.resize();
            this.listenResize();
        }
    }

    on(event, cb) {
        switch(event) {
            case 'render':
                if (Array.isArray(cb)) Array.prototype.push.apply(this.onRender, cb);
                else this.onRender.push(cb);
                break;
            case 'resize':
                if (Array.isArray(cb)) Array.prototype.push.apply(this.onResize, cb);
                else this.onResize.push(cb);
                break;
            default:
                console.warn(`Cannot add listener, event '${event}' does not exist.`);
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
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.onResize.forEach(cb => cb({ width, height }));
    }
    listenResize() {
        window.addEventListener('load', this.resize);
        window.addEventListener('resize', this.resize);
    }
}

export { SceneRenderer }
export default SceneRenderer