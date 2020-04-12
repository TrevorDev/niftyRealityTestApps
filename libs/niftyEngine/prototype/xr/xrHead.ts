import { Matrix4 } from "../../math/matrix4";
import { Vector3 } from "../../math/vector3";
import { TransformNode } from "../../sceneGraph/transformNode";
import { Camera } from "../../sceneGraph/camera";

export class XRHead extends TransformNode {
    leftEye: Camera
    rightEye: Camera
    cameras: Array<Camera>
    tmpMat = new Matrix4()
    tmpMatB = new Matrix4()
    constructor() {
        super()
        this.leftEye = new Camera()
        this.rightEye = new Camera();
        this.cameras = [this.leftEye, this.rightEye];

        this.cameras.forEach((e) => {
            //  console.log(e)
            e.projection.setProjection(30 * Math.PI / 180, 1, 0.2, 150)
            this.addChild(e)
        })
    }

    updateFromFrameData(xrPose: any) {
        var l = xrPose.views[0]
        var r = xrPose.views[1]

        // TODO set transform from avg of left and right eyes
        this.position.set(l.transform.position.x, l.transform.position.y, l.transform.position.z)
        this.rotation.set(l.transform.orientation.x, l.transform.orientation.y, l.transform.orientation.z, l.transform.orientation.w)
        this.computeWorldMatrix()


        this.leftEye.projection.copyFromArrayBufferView(l.projectionMatrix)
        this.rightEye.projection.copyFromArrayBufferView(r.projectionMatrix)

        // LEFT EYE ------------------------------------------------------------------------------------------------------------
        // compute device space matrix of eye
        this.tmpMat.copyFromArrayBufferView(l.transform.inverse.matrix)
        this.tmpMat.inverseToRef(this.tmpMat)

        // compute eye relative to head
        this.localMatrix.inverseToRef(this.tmpMatB)
        this.tmpMatB.multiplyToRef(this.tmpMat, this.tmpMatB)

        // Set view
        this.leftEye.localMatrix.copyFrom(this.tmpMatB)
        this.leftEye.localMatrix.decompose(this.leftEye.position, this.leftEye.rotation, this.leftEye.scale)
        this.leftEye.computeWorldMatrix()
        this.leftEye.worldMatrix.inverseToRef(this.leftEye.view)

        // RIGHT EYE ------------------------------------------------------------------------------------------------------------
        // compute device space matrix of eye
        this.tmpMat.copyFromArrayBufferView(r.transform.inverse.matrix)
        this.tmpMat.inverseToRef(this.tmpMat)

        // compute eye relative to head
        this.localMatrix.inverseToRef(this.tmpMatB)
        this.tmpMatB.multiplyToRef(this.tmpMat, this.tmpMatB)

        // Set view
        this.rightEye.localMatrix.copyFrom(this.tmpMatB)
        this.rightEye.localMatrix.decompose(this.rightEye.position, this.rightEye.rotation, this.rightEye.scale)
        this.rightEye.computeWorldMatrix()
        this.rightEye.worldMatrix.inverseToRef(this.rightEye.view)
    }

    updateViewMatrixForCameras() {
        this.leftEye.computeWorldMatrix()
        this.leftEye.worldMatrix.inverseToRef(this.leftEye.view)

        this.rightEye.computeWorldMatrix()
        this.rightEye.worldMatrix.inverseToRef(this.rightEye.view)
    }
}