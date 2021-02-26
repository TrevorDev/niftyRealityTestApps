import { Vector3 } from "./vector3";
import { Matrix4 } from "./matrix4";

var m = new Matrix4()
var m2 = new Matrix4()
export class Ray {
    constructor(public origin: Vector3 = new Vector3(0, 0, 0), public direction = new Vector3(0, 0, -1)) {

    }

    applyMatrixToRef(mat: Matrix4, res: Ray) {
        // rotate origin by matrix (pos, rot, scale)
        this.origin.applyMatrixToRef(mat, res.origin)
        // Rotate direction by matrix (rot, scale)
        this.direction.transformDirectionToRef(mat, res.direction)
    }

    setFromCameraScreenspace(screenX: number, screenY: number, camWorldMatrix: Matrix4, camProjectionMatrix: Matrix4) {
        camWorldMatrix.decompose(this.origin)

        // Create direction with x/y in screenspace between -0.5 and 0.5 and z = -0.5 (forward)
        this.direction.set((screenX - 0.5) * 2, (screenY - 0.5) * 2, -0.5)
        // this.direction.x *=2
        // this.direction.y *=2
        // console.log(this.direction.x,this.direction.y)
        //  this.direction.normalizeToRef(this.direction)

        // Inverse the projection matrix to adjust x/y direction, then rotate it by cameras world rotation matrix
        camProjectionMatrix.inverseToRef(m)
        // m2.copyFrom(camWorldMatrix)
        // m2.setPosition(0,0,0)
        // m.multiplyToRef(m2, m)

        // Trsnsform to final direction
        this.direction.applyMatrixToRef(m, this.direction)
        this.direction.normalizeToRef(this.direction)
    }
}