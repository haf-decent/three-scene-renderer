"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneRenderer = void 0;
var three_1 = require("three");
var SceneRenderer = /** @class */ (function () {
    function SceneRenderer(_a) {
        var _b = _a.embedded, embedded = _b === void 0 ? false : _b, _c = _a.width, width = _c === void 0 ? window.innerWidth : _c, _d = _a.height, height = _d === void 0 ? window.innerHeight : _d, _e = _a.scene, scene = _e === void 0 ? {} : _e, _f = _a.clock, _g = _f === void 0 ? {} : _f, _h = _g.autoStart, autoStart = _h === void 0 ? true : _h, _j = _a.renderer, renderer = _j === void 0 ? {} : _j, camera = _a.camera;
        var _this = this;
        this.embedded = embedded;
        this.scene = new three_1.Scene();
        Object.entries(scene).forEach(function (_a) {
            var prop = _a[0], val = _a[1];
            return _this.scene[prop] = val;
        });
        this.clock = new three_1.Clock(autoStart);
        this.camera = camera;
        this.renderer = new three_1.WebGLRenderer(renderer);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        if (!renderer.hasOwnProperty("canvas"))
            document.body.appendChild(this.renderer.domElement);
        this.renderParams = {
            scene: this.scene,
            renderer: this.renderer,
            camera: this.camera,
            delta: 0
        };
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
    SceneRenderer.prototype.on = function (event, cb) {
        var _this = this;
        switch (event) {
            case "render":
                if (Array.isArray(cb)) {
                    Array.prototype.push.apply(this.onRender, cb);
                    return cb.map(function (callback) { return function () { return _this.off(event, callback); }; });
                }
                else {
                    this.onRender.push(cb);
                    return function () { return _this.off(event, cb); };
                }
            case "resize":
                if (Array.isArray(cb)) {
                    Array.prototype.push.apply(this.onResize, cb);
                    return cb.map(function (callback) { return function () { return _this.off(event, callback); }; });
                }
                else {
                    this.onResize.push(cb);
                    return function () { return _this.off(event, cb); };
                }
            default:
                console.warn("Cannot add listener, event '".concat(event, "' does not exist."));
                return null;
        }
    };
    SceneRenderer.prototype.off = function (event, cb) {
        var i;
        switch (event) {
            case "render":
                i = this.onRender.indexOf(cb);
                if (i > -1)
                    this.onRender.splice(i, 1);
                else
                    console.warn("Cannot find listener to remove");
                break;
            case "resize":
                i = this.onResize.indexOf(cb);
                if (i > -1)
                    this.onRender.splice(i, 1);
                else
                    console.warn("Cannot find listener to remove");
                break;
        }
    };
    SceneRenderer.prototype.startRender = function () {
        this.shouldRender = true;
        if (!this.clock.running)
            this.clock.start();
        this.render();
    };
    SceneRenderer.prototype.render = function () {
        var _this = this;
        if (!this.shouldRender)
            return;
        requestAnimationFrame(this.render);
        this.renderParams.delta = this.clock.getDelta();
        this.onRender.forEach(function (cb) { return cb(_this.renderParams); });
        if (this.replaceRender)
            this.replaceRender();
        else
            this.renderer.render(this.scene, this.camera);
    };
    SceneRenderer.prototype.renderOnce = function () {
        this.startRender();
        this.stopRender();
    };
    SceneRenderer.prototype.stopRender = function () {
        this.shouldRender = false;
        this.clock.stop();
    };
    SceneRenderer.prototype.resize = function (_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.width, width = _c === void 0 ? window.innerWidth : _c, _d = _b.height, height = _d === void 0 ? window.innerHeight : _d;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.onResize.forEach(function (cb) { return cb({ width: width, height: height }); });
    };
    SceneRenderer.prototype.listenResize = function () {
        var _this = this;
        window.addEventListener("load", function () { return _this.resize(); });
        window.addEventListener("resize", function () { return _this.resize(); });
    };
    return SceneRenderer;
}());
exports.SceneRenderer = SceneRenderer;
