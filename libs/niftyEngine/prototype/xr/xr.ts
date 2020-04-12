// import { GPUDevice } from "../../gpu/gpuDevice"
// import { MultiviewTexture } from "../multiviewTexture"
// import { Texture } from "../../gpu/texture"
// import { Matrix4 } from "../../math/matrix4"
// import { Vector3 } from "../../math/vector3"

// export enum XRState {
//     IN_XR,
//     NOT_IN_XR
// }

// export class XR {
//     textures = new Array<Texture>()
//     state = XRState.NOT_IN_XR
//     multiviewTexture: MultiviewTexture
//     leftControllerSource: XRInputSource | null = null
//     rightControllerSource: XRInputSource | null = null
//     currentXRFrame?: XRFrame

//     xr = navigator.xr!
//     session: XRSession | null = null
//     refSpace?: XRReferenceSpace

//     get leftController() {
//         if (this.leftControllerSource == null) {
//             return null;
//         }
//         return this.leftControllerSource
//     }
//     get rightController() {
//         if (this.rightControllerSource == null) {
//             return null;
//         }
//         return this.rightControllerSource
//     }
//     constructor(private gpuDevice: GPUDevice) {
//         this.multiviewTexture = new MultiviewTexture(gpuDevice, 1920 / 2, 1080)
//         this.textures.push(new Texture(gpuDevice))
//     }

//     getNextTexture() {
//         return this.textures[0]
//     }

//     async canStart() {
//         if (!this.xr) {
//             return false
//         }
//         var supported = await this.xr.isSessionSupported("immersive-vr")
//         if (!supported) {
//             return false
//         }
//         return true
//     }

//     update(frame?: XRFrame) {
//         this.currentXRFrame = frame
//         if (this.currentXRFrame) {
//             // Update gl layer texture
//             var layer = this.currentXRFrame.session.renderState.baseLayer;
//             if (layer && layer.framebuffer != null) {
//                 this.textures[0].frameBuffer = layer.framebuffer
//             }

//             // Update controller values
//             this.rightControllerSource = null
//             this.leftControllerSource = null
//             for (let source of this.currentXRFrame.session.inputSources) {
//                 if (source.gamepad) {
//                     if (source.handedness == "right") {
//                         this.rightControllerSource = source
//                     }
//                     if (source.handedness == "left") {
//                         this.leftControllerSource = source
//                     }
//                     // TODO use pose in controller instead of gamepad.pose
//                     //   let pose = frame.getPose(source.gripSpace, refSpace);
//                     //   ProcessGamepad(source.gamepad, source.handedness, pose);
//                 }
//             }
//         }

//     }

//     async start() {
//         this.session = await this.xr.requestSession('immersive-vr', {
//             requiredFeatures: ['local-floor']
//         })
//         let glLayer = new XRWebGLLayer(this.session, this.gpuDevice.gl);
//         // It's heighly reccommended that you set the near and far planes to
//         // something appropriate for your scene so the projection matricies
//         // WebVR produces have a well scaled depth buffer.
//         this.session.updateRenderState({ baseLayer: glLayer, depthFar: 1000, depthNear: 0.1 });
//         this.refSpace = await this.session.requestReferenceSpace('local-floor')
//         this.state = XRState.IN_XR
//         this.multiviewTexture = new MultiviewTexture(this.gpuDevice, glLayer.framebufferWidth / 2, glLayer.framebufferHeight)
//         this.state = XRState.IN_XR
//     }
// }