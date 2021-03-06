import { Texture } from "../gfx/texture";
import { GPUDevice } from "../gfx/gpuDevice";

export class VideoTexture {
    texture: Texture
    videoElement: HTMLVideoElement
    constructor(public device: GPUDevice, src = "https://raw.githubusercontent.com/TrevorDev/typescriptStart/niftyRender/public/big_buck_bunny.mp4") {
        this.texture = Texture.createForVideoTexture(device);
        if (src.length > 0) {
            this.videoElement = document.createElement('video');
            this.videoElement.preload = "auto"
            this.videoElement.crossOrigin = "anonymous"
            this.videoElement.controls = false
            this.videoElement.autoplay = false
            this.videoElement.volume = 0.5
            this.videoElement.src = src
        }
    }

    update() {
        if (this.videoElement.currentTime > 0) {
            this.device.gl.bindTexture(this.device.gl.TEXTURE_2D, this.texture.glTexture);
            this.device.gl.texImage2D(this.device.gl.TEXTURE_2D, 0, this.device.gl.RGBA,
                this.device.gl.RGBA, this.device.gl.UNSIGNED_BYTE, this.videoElement)
            // On oculus quest binding texture seems to currupt the bound multiview framebuffer due to what i think is a bug
            // Rebinding fixes the issue but it must be set to null first to avoid the bind cache
            this.device.gl.bindFramebuffer(this.device.gl.DRAW_FRAMEBUFFER, null)
        }
    }

    dispose() {
        this.texture.dispose()
        this.videoElement.pause();
        this.videoElement.removeAttribute('src')
        this.videoElement.load();
        (this.videoElement as any) = null;
    }
}