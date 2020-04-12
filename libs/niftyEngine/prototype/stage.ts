// import { RenderWindow } from "../gpu/renderWindow";
// import { GPUDevice } from "../gpu/gpuDevice";
// import { DefaultVertexData } from "./defaultVertexData";
// import { Renderer } from "./renderer";
// import { CustomProgram } from "../gpu/customProgram";
// import { XR, XRState } from "./xr/xr";
// import { Loop } from "./loop";
// import { TransformObject } from "./componentObject/baseObjects/transformObject";
// import { CameraObject } from "./componentObject/baseObjects/cameraObject";
// import { LightObject } from "./componentObject/baseObjects/lightObject";
// import { XRHead } from "./xr/xrHead";
// import { MultiviewBlit } from "./multiviewBlit";
// import { InstanceGroup } from "./instanceGroup";

// export class Stage {
//     // Debug flags
//     singleViewDebug = false;

//     // Initialize device and window
//     device: GPUDevice
//     xr: XR
//     window: RenderWindow
//     renderer: Renderer
//     xrStage: TransformObject
//     xrHead: XRHead
//     lights = new Array<LightObject>()
//     instanceGroups = new Array<InstanceGroup>()
//     private nodes = new Array<TransformObject>()
//     currentLoop: null | Loop
//     gameLoop: Function
//     renderLoop: ((deltaTime: number, curTime: number) => void) | null = null

//     addNode(node: TransformObject) {
//         this.nodes.push(node)
//     }
//     removeNode(node: TransformObject) {
//         var index = this.nodes.indexOf(node)
//         if (index >= 0) {
//             this.nodes.splice(index, 1);
//         }
//     }


//     constructor() {
//         // Initialize Renderer
//         this.device = new GPUDevice()
//         this.xr = new XR(this.device);
//         this.window = new RenderWindow(this.device, true)
//         this.renderer = new Renderer(this.device)

//         // Lights and camera
//         this.xrStage = new TransformObject();
//         this.addNode(this.xrStage)

//         this.xrHead = new XRHead()
//         // Move up head to start above ground before updated by xrFrame
//         this.xrHead.transform.position.y = 1.6
//         this.xrStage.transform.addChild(this.xrHead.transform)
//         this.xrStage.transform.computeWorldMatrix()



//         this.lights.push(new LightObject())
//         this.lights[0].transform.position.z = 5;
//         this.lights[0].transform.position.x = 10;
//         this.lights[0].transform.position.y = 10;

//         // Custom blit operation used to draw multiview frame into single frame required for webVR
//         // TODO remove this after webXR allows submit multiview frames
//         var mvb = new MultiviewBlit(this.device)

//         var time = (new Date()).getTime()
//         this.gameLoop = (xrTime: any, xrFrame?: XRFrame) => {
//             var newTime = (new Date()).getTime()
//             var deltaTime = (newTime - time) / 1000;
//             time = newTime;

//             // Update camera
//             if (this.xr.state == XRState.IN_XR) {
//                 this.xr.update(xrFrame)
//                 if (xrFrame) {
//                     var xrPose = xrFrame.getViewerPose(this.xr.refSpace)
//                     if (xrPose) {
//                         this.xrHead.updateFromFrameData(xrPose)
//                     }
//                 }
//             }

//             if (this.renderLoop) {
//                 this.renderLoop(deltaTime, time / 1000)
//             }

//             var gl = this.device.gl
//             // Render next action to to multiview texture
//             this.renderer.setRenderMultiviewTexture(this.xr.multiviewTexture)
//             gl.disable(gl.SCISSOR_TEST);

//             // Setup viewport and clear
//             this.renderer.setViewport(0, 0, this.xr.multiviewTexture.width, this.xr.multiviewTexture.height)
//             this.device.gl.clearColor(0.2, 0.4, 0.4, 1)
//             this.renderer.clear()

//             // Render scene
//             this.xrHead.updateViewMatrixForCameras()
//             this.renderer.renderScene(this.xrHead.cameras, this.nodes, this.lights, this.instanceGroups)
//             gl.invalidateFramebuffer(gl.FRAMEBUFFER, [gl.DEPTH_ATTACHMENT]);
//             gl.disable(gl.SCISSOR_TEST);
//             // Blit back to screen
//             if (this.xr.state == XRState.IN_XR) {
//                 this.renderer.setRenderTexture(this.xr.getNextTexture())
//                 // When presenting render a stereo view.
//                 if (this.xr.currentXRFrame && this.xr.currentXRFrame.session && this.xr.currentXRFrame.session.renderState.baseLayer) {
//                     this.renderer.setViewport(0, 0, this.xr.currentXRFrame.session.renderState.baseLayer.framebufferWidth, this.xr.currentXRFrame.session.renderState.baseLayer.framebufferHeight)
//                 } else {
//                     console.log("XR Frame is unexpected missing")
//                 }
//             } else {
//                 this.renderer.setRenderTexture(this.window.getNextTexture())
//                 // When presenting render a stereo view.
//                 this.renderer.setViewport(0, 0, this.device.canvasElement.width, this.device.canvasElement.height)
//             }
//             // TODO is this clear needed?
//             this.device.gl.clearColor(1.0, 0.4, 0.4, 1)
//             this.renderer.clear()

//             mvb.blit(this.xr.multiviewTexture)
//         }


//         this.currentLoop = new Loop(requestAnimationFrame, this.gameLoop)
//     }

//     async enterVR() {
//         var clickToggle = false
//         if (this.singleViewDebug) {
//             return;
//         }
//         clickToggle = !clickToggle
//         if (!clickToggle) {
//             if (this.currentLoop) {
//                 await this.currentLoop.stop()
//             }
//             this.currentLoop = new Loop(requestAnimationFrame, this.gameLoop)

//         } else {
//             if (this.currentLoop) {
//                 await this.currentLoop.stop()
//             }
//             this.currentLoop = null
//             console.log("Trying to enter XR")
//             if (await this.xr.canStart()) {
//                 console.log("STARTING XR")
//                 await this.xr.start()
//                 console.log("XR Started")

//                 this.currentLoop = new Loop((x: any) => { this.xr.session!.requestAnimationFrame(x) }, this.gameLoop)
//             }
//         }
//     }
// }