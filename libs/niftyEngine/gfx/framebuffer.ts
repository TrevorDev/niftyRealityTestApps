import { Texture } from "./texture";

export class Framebuffer {
    color: Texture
    depthStencil: Texture | null = null
    glFramebuffer: WebGLFramebuffer | null = null

    // These function may get overwritten (eg. window or xr framebuffer)
    getWidth() {
        return this.color.width
    }
    getHeight() {
        return this.color.height
    }
}