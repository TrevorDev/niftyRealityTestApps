import { TransformNode } from "../niftyEngine/sceneGraph/transformNode";
import { Ray } from "../niftyEngine/math/ray";
import { Button } from "../niftyEngine/prototype/input/button";
import { Stage } from "./stage";
import { Vector3 } from "../niftyEngine/math/vector3";
import { Mesh } from "../niftyEngine/sceneGraph/mesh";
import { AppFrame } from "../niftyReality/app";
export class XRJoystickState {
    public x = 0;
    public y = 0;
}
export class XRController extends TransformNode {
    private ray = new Ray()
    primaryButton = new Button()
    backButton = new Button()
    primaryJoystick = new XRJoystickState()
    lastPos = new Vector3()
    velocity = new Vector3()

    rayHitMesh: Mesh<any>
    meshes: Array<Mesh<any>>;
    hoveredTaskbar = false
    hoveredApp: any = null

    getRay() {
        this.ray.origin.copyFrom(this.position)
        this.ray.direction.set(0, 0, -1)
        this.ray.direction.rotateByQuaternionToRef(this.rotation, this.ray.direction)
        return this.ray
    }

    constructor(public hand: string, private stage: Stage) {
        super()
    }

    update(delta: number, frame: AppFrame, xrSource: any) {
        // Get last position
        this.velocity.copyFrom(this.position)

        this.primaryButton.update()
        this.backButton.update()

        if (xrSource) {
            if (frame.xrFrame && frame.xrRefSpace) {
                if (xrSource.hand) {
                    var i = 0;
                    if (this.meshes) {
                        for (var key of xrSource.hand) {
                            if (this.meshes[i]) {
                                var handPose = (frame.xrFrame as any).getJointPose(key, frame.xrRefSpace)
                                if (handPose) {
                                    this.meshes[i].worldMatrix.copyFromArrayBufferView(handPose.transform.matrix)
                                    this.meshes[i].worldMatrix.decompose(this.meshes[i].position, this.meshes[i].rotation, undefined)
                                }

                            }
                            i++;
                        }
                    }
                } else if (xrSource.gamepad) {
                    var pose = frame.xrFrame.getPose(xrSource.targetRaySpace, frame.xrRefSpace)
                    if (pose && xrSource.gamepad && xrSource.gamepad.buttons && xrSource.gamepad.buttons[0] != undefined && xrSource.gamepad.buttons[5] != undefined && xrSource.gamepad.axes && xrSource.gamepad.axes[2] != undefined && xrSource.gamepad.axes[3] != undefined) {
                        this.worldMatrix.copyFromArrayBufferView(pose.transform.matrix)
                        this.worldMatrix.decompose(this.position, this.rotation, this.scale)

                        this.primaryButton.setValue(xrSource.gamepad.buttons[0].value)
                        this.backButton.setValue(xrSource.gamepad.buttons[5].value)

                        this.primaryJoystick.x = xrSource.gamepad.axes[2]
                        this.primaryJoystick.y = xrSource.gamepad.axes[3]
                    }
                }

            }
        }



        this.computeWorldMatrix()
        this.stage.anchorMatrix.inverseToRef(Stage.tmpMatrixB)
        Stage.tmpMatrixB.multiplyToRef(this.worldMatrix, this.worldMatrix)
        this.worldMatrix.decompose(this.position, this.rotation, this.scale)
        this.computeWorldMatrix()

        // Get distance from last position to new position
        this.position.subtractToRef(this.velocity, this.velocity)
        this.velocity.scaleToRef(1 / (delta / 1000))
    }
}