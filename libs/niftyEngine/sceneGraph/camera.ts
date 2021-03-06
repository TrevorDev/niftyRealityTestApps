import { TransformNode } from "./transformNode"
import { Matrix4 } from "../math/matrix4"

export class Camera extends TransformNode {
    projection = new Matrix4()
    view = new Matrix4()

    copyFrom(cam: Camera) {
        this.worldMatrix.copyFrom(cam.worldMatrix)
        this.projection.copyFrom(cam.projection)
        this.view.copyFrom(cam.view)
    }
}