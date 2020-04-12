import { Framebuffer } from "../gfx/framebuffer";
import { GPUDevice } from "../gfx/gpuDevice";
import { Texture } from "../gfx/texture";

export class MultiviewFramebuffer {
    static create(device: GPUDevice, width: number, height: number, useM = true) {
        var framebuffer = new Framebuffer()

        var samples = device.gl.getParameter(device.gl.MAX_SAMPLES);
        var is_multiview, is_multisampled = false;
        var ext = device.gl.getExtension('OCULUS_multiview');
        var useM = true
        if (useM && ext) {
            is_multiview = true;

            // TODO enabling this caused depth compositing to break?
            // https://developer.oculus.com/documentation/oculus-browser/browser-multiview/?locale=en_US
            //  is_multisampled = true;
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
            framebuffer.glFramebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer.glFramebuffer);

            var colorTex = new Texture(device)
            colorTex.glTexture = gl.createTexture();
            colorTex.width = width
            colorTex.height = height
            framebuffer.color = colorTex
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, colorTex.glTexture);
            gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, width, height, 2);
            if (!is_multisampled)
                ext.framebufferTextureMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, colorTex.glTexture, 0, 0, 2);
            else
                ext.framebufferTextureMultisampleMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, colorTex.glTexture, 0, samples, 0, 2);
            // console.log("Fbo attachment numviews = " + gl.getFramebufferAttachmentParameter(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, ext.FRAMEBUFFER_ATTACHMENT_TEXTURE_NUM_VIEWS_OVR));
            // console.log("Fbo base view index = " + gl.getFramebufferAttachmentParameter(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, ext.FRAMEBUFFER_ATTACHMENT_TEXTURE_BASE_VIEW_INDEX_OVR));

            var depthStencilTex = new Texture(device)
            depthStencilTex.width = width
            depthStencilTex.height = height
            framebuffer.depthStencil = depthStencilTex
            depthStencilTex.glTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, depthStencilTex.glTexture);
            gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.DEPTH32F_STENCIL8, width, height, 2);

            // This is required to read back depth values
            gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_COMPARE_MODE, gl.NONE)
            gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST)

            if (!is_multisampled)
                ext.framebufferTextureMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, depthStencilTex.glTexture, 0, 0, 2);
            else
                ext.framebufferTextureMultisampleMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, depthStencilTex.glTexture, 0, samples, 0, 2);
            // console.log("Fbo attachment numviews = " + gl.getFramebufferAttachmentParameter(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, ext.FRAMEBUFFER_ATTACHMENT_TEXTURE_NUM_VIEWS_OVR));
            // console.log("Fbo base view index = " + gl.getFramebufferAttachmentParameter(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, ext.FRAMEBUFFER_ATTACHMENT_TEXTURE_BASE_VIEW_INDEX_OVR));
            //gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        }
        return framebuffer;

    }
}