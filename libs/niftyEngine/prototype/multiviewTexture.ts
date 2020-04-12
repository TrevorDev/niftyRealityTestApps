
import * as twgl from "twgl.js"
import { GPUDevice } from "../gfx/gpuDevice";

export class MultiviewTextureX {
    public glTexture: WebGLTexture | null = null
    public depthStencilTex: WebGLTexture | null = null
    public frameBuffer: any
    constructor(private device: GPUDevice, public width: number, public height: number, useM = true) {
        var samples = device.gl.getParameter(device.gl.MAX_SAMPLES);
        // console.log("samples: " + samples)
        var is_multiview, is_multisampled = false;
        var ext = device.gl.getExtension('OCULUS_multiview');
        //useM = true
        if (useM && ext) {
            // console.log("OCULUS_multiview extension is supported");
            is_multiview = true;
            is_multisampled = true;
        }
        else {
            // console.log("OCULUS_multiview extension is NOT supported");
            ext = device.gl.getExtension('OVR_multiview2');
            if (ext) {
                // console.log("OVR_multiview2 extension is supported");
                is_multiview = true;
            }
            else {
                alert("Neither OCULUS_multiview nor OVR_multiview2 extension is NOT supported");
                is_multiview = false;
            }
        }


        // console.log("onResize, presenting, multiview = " + is_multiview + ", new size = " + width + "x" + height);

        var gl = device.gl;
        if (ext) {
            // console.log("MaxViews = " + device.gl.getParameter(ext.MAX_VIEWS_OVR));
            this.frameBuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.frameBuffer);
            this.glTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.glTexture);
            gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, width, height, 2);
            if (!is_multisampled)
                ext.framebufferTextureMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this.glTexture, 0, 0, 2);
            else
                ext.framebufferTextureMultisampleMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this.glTexture, 0, samples, 0, 2);
            // console.log("Fbo attachment numviews = " + gl.getFramebufferAttachmentParameter(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, ext.FRAMEBUFFER_ATTACHMENT_TEXTURE_NUM_VIEWS_OVR));
            // console.log("Fbo base view index = " + gl.getFramebufferAttachmentParameter(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, ext.FRAMEBUFFER_ATTACHMENT_TEXTURE_BASE_VIEW_INDEX_OVR));

            this.depthStencilTex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.depthStencilTex);
            gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.DEPTH_COMPONENT24, width, height, 2);
            if (!is_multisampled)
                ext.framebufferTextureMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, this.depthStencilTex, 0, 0, 2);
            else
                ext.framebufferTextureMultisampleMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, this.depthStencilTex, 0, samples, 0, 2);
            // console.log("Fbo attachment numviews = " + gl.getFramebufferAttachmentParameter(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, ext.FRAMEBUFFER_ATTACHMENT_TEXTURE_NUM_VIEWS_OVR));
            // console.log("Fbo base view index = " + gl.getFramebufferAttachmentParameter(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, ext.FRAMEBUFFER_ATTACHMENT_TEXTURE_BASE_VIEW_INDEX_OVR));
            //gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        }

    }
    dispose() { }
}