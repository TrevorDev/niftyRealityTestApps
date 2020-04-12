interface Framebuffer {
    glFramebuffer: WebGLFramebuffer | null

    // These function may get overwritten (eg. window or xr framebuffer)
    getWidth: Function
    getHeight: Function
}

export class App {
    private currentFrame: {
        framebuffer: WebGLFramebuffer,
        framebufferWidth: number,
        framebufferHeight: number,
        anchor: Float32Array
    }
    getCurrentFrame() {
        this.currentFrame.framebuffer = this.getFrameBuffer().glFramebuffer!
        this.currentFrame.framebufferWidth = this.getFrameBuffer().getWidth()
        this.currentFrame.framebufferHeight = this.getFrameBuffer().getHeight()
        this.currentFrame.anchor = this.anchor
        return this.currentFrame
    }

    constructor(private anchor: Float32Array, private getFrameBuffer: () => Framebuffer) {
        this.currentFrame = {
            framebuffer: getFrameBuffer(),
            framebufferWidth: getFrameBuffer().getWidth(),
            framebufferHeight: getFrameBuffer().getHeight(),
            anchor: anchor
        }
    }

    /**
     * Event for the application to tell the os if controller rays have hit the app
     * @param castingController controller that requesting a ray cast
     * @param result result of the raycast that should be populated based on the raycast
     */
    // castRay(castingController: XRController, result: HitResult) {
    //     result.reset()
    // }

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