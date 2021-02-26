interface Framebuffer {
    glFramebuffer: WebGLFramebuffer | null

    // These function may get overwritten (eg. window or xr framebuffer)
    getWidth: Function
    getHeight: Function
}

export class Light {
    worldMatrix: Float32Array
    brightness: number
}

export class AppFrame {
    framebuffer: WebGLFramebuffer
    framebufferWidth: number
    framebufferHeight: number
    anchor: Float32Array
    appFocused: boolean
    xrFrame: XRFrame | null
    xrRefSpace: XRReferenceSpace | null
    glContext: WebGL2RenderingContext
    lights: Array<Light>
}

export class App {
    private currentFrame: AppFrame
    getCurrentFrame() {
        this.currentFrame = this.getFrame()
        return this.currentFrame
    }

    constructor(private getFrame: () => AppFrame) {
        this.currentFrame = getFrame()
    }

    /**
     * Event for the application to tell the os if controller rays have hit the app
     * @param world world matrix of the ray that is casting
     */
    castRay(world: Float32Array) {
        return Infinity
    }

    /**
     * Update loop for the app (called every frame) it is the apps responsibility to pause itself by doing nothing if not active
     * @param delta Deltatime in ms since last update
     * @param curTime Time since os start in ms
     */
    update(delta: number, curTime: number) {

    }

    /**
     * Even fired when the app is close, the application should clean up all it's resources
     */
    dispose() {

    }
}

// To workaround bug where copying from canvas2D during webgl render corrupts webgl framebuffer when oculus multiview is used
export let runCanvasMethod = (fn: Function) => {
    setTimeout(() => {
        fn()
    }, 0);
}