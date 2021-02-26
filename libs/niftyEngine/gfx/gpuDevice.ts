export class GPUDevice {
    gl: WebGL2RenderingContext
    canvasElement: HTMLCanvasElement
    constructor(context?: WebGL2RenderingContext, options: { antialias?: boolean, backend?: string } = {}) {
        if (context) {
            this.gl = context
        } else {
            this.canvasElement = document.createElement("canvas")

            if (options.antialias == undefined) {
                options.antialias = false
            }

            if (options.backend == undefined) {
                options.backend = "webgl2"
            }

            // TODO decide what the best defaults are here (currently set when debugging multiview aliasing issues)
            var glAttribs = {
                alpha: true,
                antialias: options.antialias, // msaa
                stencil: false,
                xrCompatible: true
                //preserveDrawingBuffer: true // this is needed so its not auto cleared
            };
            this.gl = this.canvasElement.getContext(options.backend, glAttribs) as WebGL2RenderingContext
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.enable(this.gl.CULL_FACE);
            console.log("NiftyRenderer v1.0")
        }
    }
}