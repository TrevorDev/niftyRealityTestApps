import { Light } from "../niftyEngine/sceneGraph/light";
import { XRHead } from "../niftyEngine/prototype/xr/xrHead";
import { TransformNode } from "../niftyEngine/sceneGraph/transformNode";
import { GPUDevice } from "../niftyEngine/gfx/gpuDevice";
import { UberMaterial } from "../niftyEngine/prototype/uberShader/uberMaterial";
import { Mesh } from "../niftyEngine/sceneGraph/mesh";
import { AppFrame } from "../niftyReality/app";
import { Matrix4 } from "../niftyEngine/math/matrix4";
import { Ray } from "../niftyEngine/math/ray";
import { XRController } from "./xrController";

export class Stage {
    static tmpMatrixA = new Matrix4()
    static tmpMatrixB = new Matrix4()

    lights = new Array<Light>();
    camera = new XRHead()
    nodes = new Array<TransformNode>()
    currentFrame: AppFrame
    anchorMatrix = new Matrix4()

    leftController = new XRController("left", this)
    rightController = new XRController("right", this)
    controllers = [this.leftController, this.rightController]

    constructor(public device: GPUDevice) {
        this.lights.push(new Light())
        this.lights[0].position.set(1, 2, 1)
        this.lights[0].position.scaleInPlace(10)
        this.lights[0].brightness = 1000
        this.lights[0].rotation.fromEuler(Math.PI / 4, -Math.PI / 4, 0)
    }
    rayInAppSpaceFromWorldRayMatrixToRef(matrix: Float32Array, ray: Ray) {
        ray.origin.set(0, 0, 0)
        ray.direction.set(0, 0, -1)

        // Create ray matrix from float32Array
        Stage.tmpMatrixA.copyFromArrayBufferView(matrix)

        // Transform ray maatrix into app space
        this.anchorMatrix.inverseToRef(Stage.tmpMatrixB)
        Stage.tmpMatrixB.multiplyToRef(Stage.tmpMatrixA, Stage.tmpMatrixA)

        ray.applyMatrixToRef(Stage.tmpMatrixA, ray)
    }
    // TODO delta should be inside frame
    updateFromFrame(frame: AppFrame, delta: number = 0) {
        this.currentFrame = frame

        if (frame.xrFrame) {
            // Detect hands/controllers
            for (let source of frame.xrFrame.session.inputSources) {
                var tmpSource: any = source
                if (tmpSource.hand) {
                    if (tmpSource.handedness == "left") {
                        this.leftController.update(delta, frame, source)
                    }
                    if (tmpSource.handedness == "right") {
                        this.rightController.update(delta, frame, source)
                    }
                } else if (source.gamepad) {
                    if (source.handedness == "left") {
                        this.leftController.update(delta, frame, source)
                    }
                    if (source.handedness == "right") {
                        this.rightController.update(delta, frame, source)
                    }
                    // TODO use pose in controller instead of gamepad.pose
                    //   let pose = frame.getPose(source.gripSpace, refSpace);
                    //   ProcessGamepad(source.gamepad, source.handedness, pose);
                }

            }

            var xrPose = frame.xrFrame.getViewerPose(frame.xrRefSpace!)
            if (xrPose) {
                this.camera.updateFromFrameData(xrPose)
                this.camera.updateViewMatrixForCameras()
            }
        } else {
            this.camera.position.y = 1.6;
            this.camera.position.z = 2
            this.camera.updateViewMatrixForCameras()
        }

        // Moving everything to apps space avoid matrix multiply to all app meshes
        // Move camera into app space, TODO may need to update local mat/pos/rot/scale also?
        this.anchorMatrix.copyFromArrayBufferView(frame.anchor)
        this.camera.leftEye.view.multiplyToRef(this.anchorMatrix, this.camera.leftEye.view)
        this.camera.rightEye.view.multiplyToRef(this.anchorMatrix, this.camera.rightEye.view)
        this.camera.leftEye.view.inverseToRef(this.camera.leftEye.worldMatrix)
        this.camera.rightEye.view.inverseToRef(this.camera.rightEye.worldMatrix)

        if (this.currentFrame.lights[0]) {
            // Get world matrix
            this.lights[0].worldMatrix.copyFromArrayBufferView(this.currentFrame.lights[0].worldMatrix)

            // Move to app space
            this.anchorMatrix.inverseToRef(Stage.tmpMatrixB)
            Stage.tmpMatrixB.multiplyToRef(this.lights[0].worldMatrix, this.lights[0].worldMatrix)

            // Set light values
            this.lights[0].localMatrix.copyFrom(this.lights[0].worldMatrix)
            this.lights[0].localMatrix.decompose(this.lights[0].position, this.lights[0].rotation, this.lights[0].scale)
            this.lights[0].brightness = this.currentFrame.lights[0].brightness
        }
    }

    render() {
        if (!this.currentFrame) {
            return
        }
        this.device.gl.bindFramebuffer(this.device.gl.DRAW_FRAMEBUFFER, this.currentFrame.framebuffer)
        this.device.gl.viewport(0, 0, this.currentFrame.framebufferWidth, this.currentFrame.framebufferHeight);
        // this.device.gl.clearColor(0, 0, 0, 0)
        // this.device.gl.clear(this.device.gl.COLOR_BUFFER_BIT | this.device.gl.DEPTH_BUFFER_BIT | this.device.gl.STENCIL_BUFFER_BIT);

        for (var l of this.lights) {
            l.computeWorldMatrix()
        }

        var activeProgram: any = null
        for (var m of this.nodes) {
            TransformNode.depthFirstIterate(m, (node) => {
                node.computeWorldMatrix(false)

                var mesh = node as Mesh<UberMaterial>;
                if (mesh.material && mesh.vertData) {
                    var material = mesh.material

                    // Load material program
                    if (material.program != activeProgram) {
                        material.program.load()
                        material.program.updateFromCamera(this.camera.cameras)
                        material.program.updateForLights(this.lights)
                        activeProgram = material.program
                    }

                    // Load material instance specific data
                    material.updateUniforms()
                    material.program.updateAndDrawForMesh(mesh)
                }

            })
        }
    }
}