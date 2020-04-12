import { GPUDevice } from "./gpuDevice";
import { Texture } from "./texture";
import { Framebuffer } from "./framebuffer";

export class RenderWindow {
    framebuffers = new Array<Framebuffer>()
    dimensions = { x: 0, y: 0 }
    canvasElement: HTMLCanvasElement
    constructor(public device: GPUDevice, fullscreen = true) {
        this.canvasElement = device.canvasElement
        document.body.appendChild(this.canvasElement)

        if (fullscreen) {
            document.documentElement.style["overflow"] = "hidden"
            document.documentElement.style.overflow = "hidden"
            document.documentElement.style.width = "100%"
            document.documentElement.style.height = "100%"
            document.documentElement.style.margin = "0"
            document.documentElement.style.padding = "0"
            document.body.style.overflow = "hidden"
            document.body.style.width = "100%"
            document.body.style.height = "100%"
            document.body.style.margin = "0"
            document.body.style.padding = "0"
            this.canvasElement.style.width = "100%"
            this.canvasElement.style.height = "100%"
        }


        this.framebuffers.push(new Framebuffer())
        this.framebuffers[0].getHeight = () => {
            return this.device.canvasElement.height
        }
        this.framebuffers[0].getWidth = () => {
            return this.device.canvasElement.width
        }

        this.updateDimensions()
    }

    updateDimensions() {
        this.dimensions.x = (this.device.gl.canvas as HTMLCanvasElement).clientWidth
        this.dimensions.y = (this.device.gl.canvas as HTMLCanvasElement).clientHeight

        this.canvasElement.width = 1920
        this.canvasElement.height = 1080
    }

    onScreenRefreshLoop(fn: Function) {
        var loop = () => {
            fn()
            requestAnimationFrame(loop)
        }
        requestAnimationFrame(loop)
    }

    getNextFramebuffer() {
        return this.framebuffers[0]
    }
}