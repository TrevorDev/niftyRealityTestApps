import { GPUDevice } from "./gpuDevice";
import * as twgl from "twgl.js"
import { Color } from "../math/color";

export class Texture {
    width = -1
    height = -1
    public glTexture: WebGLTexture | null = null

    static createFromColor(device: GPUDevice, color: Color) {
        return Texture.createFromeSource(device, [Math.floor(255 * color.r), Math.floor(255 * color.g), Math.floor(255 * color.b), Math.floor(255 * color.a)]);
    }
    static createFromeSource(device: GPUDevice, src: Array<number> | TexImageSource | string, options?: twgl.TextureOptions) {
        // TODO add constructor that sets framebuffer
        var r = new Texture(device)
        if (!options) {
            options = {}
        }
        if (!options.src) {
            options.src = src
        }
        r.glTexture = twgl.createTexture(device.gl, options);
        return r
    }

    static async createFromeURL(device: GPUDevice, src: string, options?: twgl.TextureOptions) {
        var image = new Image();
        image.src = src;  // MUST BE SAME DOMAIN!!!
        await new Promise((res) => {
            image.onload = function () {
                res()
            };
        });
        return this.createFromeSource(device, image, options)
    }

    // const level = 0;
    // const internalFormat = gl.RGBA;
    // const width = 1;
    // const height = 1;
    // const border = 0;
    // const srcFormat = gl.RGBA;
    // const srcType = gl.UNSIGNED_BYTE;
    // const pixel = new Uint8Array([0, 0, 255, 25

    static createForVideoTexture(device: GPUDevice) {
        var r = new Texture(device)
        r.glTexture = twgl.createTexture(device.gl, {
            level: 0,
            width: 1,
            height: 1,
            format: device.gl.RGBA,
            min: device.gl.LINEAR,
            mag: device.gl.LINEAR,
            src: [0, 0, 0, 255],
        });
        return r
    }

    constructor(device: GPUDevice) {
        // this.glTexture = twgl.createTexture(device.gl, {
        //     min: device.gl.NEAREST,
        //     mag: device.gl.NEAREST,
        //     src: [
        //         255, 255, 255, 255,
        //         192, 192, 192, 255,
        //         192, 192, 192, 255,
        //         255, 255, 255, 255,
        //     ],
        // });
    }

    dispose() { }
}