// import { GPUDevice } from "../gpu/gpuDevice";
// import { MeshComponent } from "./componentObject/components/mesh/meshComponent";
// import { Texture } from "../gpu/texture";
// import { MultiviewTexture } from "./multiviewTexture";
// import { TransformObject } from "./componentObject/baseObjects/transformObject";
// import { TransformComponent } from "./componentObject/components/transform/transformComponent";
// import { MaterialComponent } from "./componentObject/components/material/materialComponent";
// import { LightObject } from "./componentObject/baseObjects/lightObject";
// import { XRHead } from "./xr/xrHead";
// import { InstanceGroup } from "./instanceGroup";
// import { CameraObject } from "./componentObject/baseObjects/cameraObject";

// export class Renderer {
//     constructor(public device: GPUDevice) {

//     }
//     renderScene(cameras: Array<CameraObject>, nodes: Array<TransformObject>, lights: Array<LightObject>, instanceGroups: Array<InstanceGroup>) {
//         lights.forEach((l) => {
//             l.transform.computeWorldMatrix()
//         })

//         nodes.forEach((m) => {

//             TransformComponent.depthFirstIterate(m.transform, (node) => {
//                 TransformComponent.computeWorldMatrixForTree(node)
//                 // debugger
//                 var material = node.object.getComponent<MaterialComponent>(MaterialComponent.type)
//                 var mesh = node.object.getComponent<MeshComponent>(MeshComponent.type)
//                 if (material && mesh && mesh.visible && !mesh.isInstance) {
//                     // TODO undo this when going from camera length > 1 to length of 1
//                     // Update material defines
//                     if (cameras.length > 1 && material.material.getDefines()["MULTIVIEW_COUNT"] != cameras.length) {
//                         (material.material).updateDefines({ MULTIVIEW_COUNT: cameras.length })
//                     }

//                     // Load material program
//                     material.material.load()
//                     material.material.updateFromCamera(cameras)
//                     material.material.updateForLights(lights)

//                     // Load material instance specific data
//                     material.material.updateUniforms()
//                     material.material.updateAndDrawForMesh(mesh)

//                 }
//             })
//         })

//         // Allow instanced objectects to be added to scene to update their world matrix, then draw them all in one go here
//         instanceGroups.forEach((ig) => {
//             // Load material program
//             ig.material.load()
//             ig.material.updateFromCamera(cameras)
//             ig.material.updateForLights(lights)

//             // Load material instance specific data
//             ig.material.updateUniforms()
//             ig.material.updateAndDrawInstanced(ig)
//         })
//     }

//     setRenderTexture(texture: Texture) {
//         this.device.gl.bindFramebuffer(this.device.gl.DRAW_FRAMEBUFFER, texture.frameBuffer)
//     }
//     setRenderMultiviewTexture(texture: MultiviewTexture) {
//         this.device.gl.bindFramebuffer(this.device.gl.DRAW_FRAMEBUFFER, texture.frameBuffer)
//     }

//     setViewport(x: number, y: number, width: number, height: number) {
//         //  this.device.gl.scissor(x, y, width, height)
//         this.device.gl.viewport(x, y, width, height);
//     }

//     clear() {
//         this.device.gl.clear(this.device.gl.COLOR_BUFFER_BIT | this.device.gl.DEPTH_BUFFER_BIT | this.device.gl.STENCIL_BUFFER_BIT);
//     }
// }