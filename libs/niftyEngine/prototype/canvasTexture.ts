import { Texture } from "../gfx/texture";
import { GPUDevice } from "../gfx/gpuDevice";

export class CanvasTexture {
    texture: Texture
    context: CanvasRenderingContext2D
    constructor(public device: GPUDevice, public canvas: HTMLCanvasElement) {
        this.texture = Texture.createFromeSource(device, [0, 0, 0, 255], {
            width: 1,
            height: 1,
            format: device.gl.RGBA,
            min: device.gl.LINEAR_MIPMAP_LINEAR,
            mag: device.gl.LINEAR,
            src: [0, 0, 0, 255],
        });
        this.context = canvas.getContext("2d")!
    }

    update() {
        this.device.gl.bindTexture(this.device.gl.TEXTURE_2D, this.texture.glTexture);
        this.device.gl.texImage2D(this.device.gl.TEXTURE_2D, 0, this.device.gl.RGBA, this.device.gl.RGBA, this.device.gl.UNSIGNED_BYTE, this.canvas)
        this.device.gl.generateMipmap(this.device.gl.TEXTURE_2D)
        // On oculus quest binding texture seems to currupt the bound multiview framebuffer due to what i think is a bug
        // Rebinding fixes the issue but it must be set to null first to avoid the bind cache
        this.device.gl.bindFramebuffer(this.device.gl.DRAW_FRAMEBUFFER, null)
    }
}