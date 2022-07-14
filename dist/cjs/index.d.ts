import { Color, Texture, CubeTexture, OrthographicCamera, PerspectiveCamera, Scene, Clock, WebGLRenderer, WebGLRendererParameters } from "three";
declare type SceneProps = {
    autoUpdate?: boolean;
    background?: Color | Texture | CubeTexture | null;
    environment?: Texture | null;
};
declare type Props = {
    embedded?: boolean;
    width?: number;
    height?: number;
    scene?: SceneProps;
    clock?: {
        autoStart?: boolean;
    };
    renderer?: WebGLRendererParameters;
    camera: OrthographicCamera | PerspectiveCamera;
};
declare type RenderProps = {
    scene: Scene;
    renderer: WebGLRenderer;
    camera: OrthographicCamera | PerspectiveCamera;
    delta: number;
};
declare type RenderListener = (props: RenderProps) => void;
declare type ResizeListener = ({ width, height }: {
    width: number;
    height: number;
}) => void;
export declare class SceneRenderer {
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
    constructor({ embedded, width, height, scene, clock: { autoStart }, renderer, camera }: Props);
    on(event: "render" | "resize", cb: RenderListener | RenderListener[] | ResizeListener | RenderListener[]): (() => void)[] | (() => void) | null;
    off(event: "render" | "resize", cb: RenderListener | ResizeListener): void;
    startRender(): void;
    render(): void;
    renderOnce(): void;
    stopRender(): void;
    resize({ width, height }?: {
        width?: number | undefined;
        height?: number | undefined;
    }): void;
    listenResize(): void;
}
export {};
