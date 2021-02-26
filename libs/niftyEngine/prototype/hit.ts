import { Ray } from "../math/ray";
import { Vector3 } from "../math/vector3";
import { Matrix4 } from "../math/matrix4";
import { Triangle } from "../math/triangle";
import { TransformNode } from "../sceneGraph/transformNode";
import { Mesh } from "../sceneGraph/mesh";
import { Quaternion } from "../math/quaternion";

export class HitResult {
    // This is the distance to the hit ponint multiplied by the rays direction's length
    hitDistance: null | number
    // The object that was hit
    hitObject: null | TransformNode
    // Normal is not calculated by default, to force results to calculate set this to a vector
    hitNormal: null | Vector3 = null

    /**
     * For triangle A,B,C txcoord.x = %AB and txcoord.y = txcoord.x = %AC
     * When hitting a mesh, the actual texcoord will be looked up from it's attibutes based on above
     */
    hitTexcoord = new Vector3() // TODO make vec2
    constructor() {
        this.reset()
    }
    reset() {
        this.hitDistance = null;
        this.hitObject = null;
    }
    copyFrom(h: HitResult) {
        this.hitDistance = h.hitDistance
        this.hitObject = h.hitObject;
        this.hitTexcoord.copyFrom(h.hitTexcoord)
    }
}

// TODO cleanup and document better, hittest for camera
export class Hit {
    static _tempTri = new Triangle()
    static _tempRay = new Ray()
    static _tempMat = new Matrix4()
    static _tempVecA = new Vector3()
    static _tempVecB = new Vector3()
    static _tempQuat = new Quaternion()
    static _tempVecC = new Vector3()
    static _tmpHit = new HitResult()
    static _tmpHitNoraml = new Vector3()
    static _tmpHitB = new HitResult()

    /**
     * Detects if a ray intersects a triangle
     * @param ray to check
     * @param tri triangle points
     * @param normal if specified will only return true if ray points towards the normal
     * @param res result of the hit
     */
    static rayIntersectsTriangle(ray: Ray, tri: Triangle, normal: null | Vector3, res: HitResult) {
        // See https://github.com/TrevorDev/outLine/blob/master/public/custom/moreSpace/collision.js
        //when line collides with plane:
        //from + x*line = face.a + y*planeX + z*planeY
        //x*line + y*-planeX + z*-planeY = face.a - from
        //x y z = right

        if (normal) {
            // check if ray is pointing towards the normal of the triangle
            ray.direction.normalizeToRef(this._tempVecA)
            normal.normalizeToRef(normal)
            var dot = normal.dot(this._tempVecA)
            if (dot > 0) {
                res.hitDistance = null;
                return;
            }
        }

        var direction = ray.direction;
        var originToPlaneMainPoint = this._tempVecA
        var planeX = this._tempVecB
        var planeY = this._tempVecC

        tri.points[0].subtractToRef(ray.origin, originToPlaneMainPoint)
        tri.points[0].subtractToRef(tri.points[1], planeX)
        tri.points[0].subtractToRef(tri.points[2], planeY)

        // 3 equations 3 unknowns solve
        var det = direction.x * ((planeX.y * planeY.z) - (planeX.z * planeY.y)) - planeX.x * ((direction.y * planeY.z) - (direction.z * planeY.y)) + planeY.x * ((direction.y * planeX.z) - (direction.z * planeX.y));
        var detX = originToPlaneMainPoint.x * ((planeX.y * planeY.z) - (planeX.z * planeY.y)) - planeX.x * ((originToPlaneMainPoint.y * planeY.z) - (originToPlaneMainPoint.z * planeY.y)) + planeY.x * ((originToPlaneMainPoint.y * planeX.z) - (originToPlaneMainPoint.z * planeX.y));
        var detY = direction.x * ((originToPlaneMainPoint.y * planeY.z) - (originToPlaneMainPoint.z * planeY.y)) - originToPlaneMainPoint.x * ((direction.y * planeY.z) - (direction.z * planeY.y)) + planeY.x * ((direction.y * originToPlaneMainPoint.z) - (direction.z * originToPlaneMainPoint.y));
        var detZ = direction.x * ((planeX.y * originToPlaneMainPoint.z) - (planeX.z * originToPlaneMainPoint.y)) - planeX.x * ((direction.y * originToPlaneMainPoint.z) - (direction.z * originToPlaneMainPoint.y)) + originToPlaneMainPoint.x * ((direction.y * planeX.z) - (direction.z * planeX.y));

        if (det != 0) {
            var x = detX / det; // ratio of direction
            var y = detY / det; // ratio of lineA direction
            var z = detZ / det; // ratio of lineB direction
            //debugger
            // If inifinite plane needs support
            // if(infiniteLength || (x>=0&&x<=1&&y>=0&&y<=1&&z>=0&&z<=1&&(y+z)<=1)){
            if ((x >= 0 && y >= 0 && y <= 1 && z >= 0 && z <= 1 && (y + z) <= 1)) {
                res.hitDistance = x;

                /**
                 * For triangle A,B,C txcoord.x = %AB and txcoord.y = txcoord.x = %AC
                 */
                res.hitTexcoord.x = y
                res.hitTexcoord.y = z

                if (res.hitNormal) {
                    if (normal) {
                        res.hitNormal.copyFrom(normal)
                    } else {
                        planeX.normalizeToRef()
                        planeY.normalizeToRef()
                        // Compute normal of the hit tri
                        // Normal must be transformed to worls space like in rayIntersectsMesh 
                        planeX.crossToRef(planeY, res.hitNormal)
                        res.hitNormal.normalizeToRef()
                    }
                }
                return;
            }
        }
        res.hitDistance = null;
        return;
    }

    /**
     * This is not recursive
     * Ray direction should be normalized
     * Ray is in world space, node is in any space, ray is converted to node space before intersection, normal is transformed back to world space
     * @param ray 
     * @param node 
     */
    static rayIntersectsMesh(ray: Ray, node: TransformNode, res: HitResult) {
        res.reset()

        var mesh = node as Mesh<any>
        if (mesh && mesh.vertData) {
            // Convert ray to node space
            node.computeWorldMatrix(true)
            node.worldMatrix.inverseToRef(Hit._tempMat)
            ray.applyMatrixToRef(Hit._tempMat, Hit._tempRay)

            // Set inverse transpose of world matrix in Hit._tempMat
            // To be used to convert normal to world space
            // TODO does this need to set translation to 0,0,0 before inverse?
            Hit._tempMat.transposeToRef(Hit._tempMat)

            // Iterate over triangles in mesh
            var p = mesh.vertData.getPositions()
            var ind = mesh.vertData.getIndices()
            var triCount = mesh.vertData.getIndices().length / 3;
            var hitTri = -1
            for (var i = 0; i < triCount; i++) {
                for (var j = 0; j < 3; j++) {
                    Hit._tempTri.points[j].x = p[(ind[(i * 3) + j] * 3) + 0]
                    Hit._tempTri.points[j].y = p[(ind[(i * 3) + j] * 3) + 1]
                    Hit._tempTri.points[j].z = p[(ind[(i * 3) + j] * 3) + 2]

                }

                // Normal computations can be skipped if normal is not passed in
                if (res.hitNormal) {
                    this._tmpHit.hitNormal = this._tmpHitNoraml
                } else {
                    this._tmpHit.hitNormal = null
                }

                this.rayIntersectsTriangle(this._tempRay, Hit._tempTri, null, this._tmpHit)
                if (this._tmpHit.hitDistance != null && (res.hitDistance == null || res.hitDistance > this._tmpHit.hitDistance)) {
                    if (this._tmpHit.hitNormal && res.hitNormal) {
                        // Convert normal to world space, see below
                        // https://stackoverflow.com/questions/35092885/transform-normal-and-tangent-from-object-space-to-world-space
                        // https://www.scratchapixel.com/lessons/mathematics-physics-for-computer-graphics/geometry/transforming-normals
                        this._tmpHit.hitNormal.applyMatrixToRef(Hit._tempMat, res.hitNormal)
                        res.hitNormal.normalizeToRef()
                    }
                    res.copyFrom(this._tmpHit)
                    hitTri = i;
                }
            }

            if (res.hitDistance != null) {

                // Compute intersection point in world space
                this._tempVecA.copyFrom(this._tempRay.direction)
                this._tempVecA.scaleInPlace(res.hitDistance)
                this._tempVecA.addToRef(this._tempRay.origin, this._tempVecA)
                this._tempVecA.applyMatrixToRef(node.worldMatrix, this._tempVecA)

                // calculate distance in world space
                ray.origin.subtractToRef(this._tempVecA, this._tempVecA)
                res.hitDistance = this._tempVecA.length()
                res.hitObject = node

                // calculate texcoords from result of triangle hittest
                var tx = mesh.vertData.getTexCoords()
                Hit._tempTri.points[0].x = tx[(ind[(hitTri * 3) + 0] * 2) + 0]
                Hit._tempTri.points[0].y = tx[(ind[(hitTri * 3) + 0] * 2) + 1]

                Hit._tempTri.points[1].x = tx[(ind[(hitTri * 3) + 1] * 2) + 0]
                Hit._tempTri.points[1].y = tx[(ind[(hitTri * 3) + 1] * 2) + 1]

                Hit._tempTri.points[2].x = tx[(ind[(hitTri * 3) + 2] * 2) + 0]
                Hit._tempTri.points[2].y = tx[(ind[(hitTri * 3) + 2] * 2) + 1]

                var xx = (res.hitTexcoord.x * Hit._tempTri.points[1].x) + (res.hitTexcoord.y * Hit._tempTri.points[2].x) + ((1 - res.hitTexcoord.x - res.hitTexcoord.y) * Hit._tempTri.points[0].x)
                var yy = (res.hitTexcoord.x * Hit._tempTri.points[1].y) + (res.hitTexcoord.y * Hit._tempTri.points[2].y) + ((1 - res.hitTexcoord.x - res.hitTexcoord.y) * Hit._tempTri.points[0].y)

                res.hitTexcoord.x = xx
                res.hitTexcoord.y = yy

                // Done!
            }
        }

        return null
    }

    // Ray and triangle are in same space
    static rayIntersectsMeshes(ray: Ray, nodes: Array<TransformNode>, res: HitResult) {
        res.reset()
        Hit._tmpHitB.reset()

        for (var n of nodes) {
            Hit.rayIntersectsMesh(ray, n, Hit._tmpHitB);
            if (res.hitDistance == null || (Hit._tmpHitB.hitDistance != null && Hit._tmpHitB.hitDistance < res.hitDistance)) {
                res.copyFrom(Hit._tmpHitB)
            }
        }
    }

    static vectorToBoxFromPoint(point: Vector3, box: TransformNode, res: Vector3) {
        // Convert point into box space
        box.worldMatrix.inverseToRef(this._tempMat)
        point.applyMatrixToRef(this._tempMat, res)

        // Min and max of box
        this._tempVecA.set(1 / 2, 1 / 2, 1 / 2)
        this._tempVecB.set(-1 / 2, -1 / 2, -1 / 2)

        // Clamp to get point within box in box space to get closest point on the box
        res.clampToRef(this._tempVecB, this._tempVecA, this._tempVecC)

        // Move closest box point to world space 
        this._tempVecC.applyMatrixToRef(box.worldMatrix, res)

        // Find vector from closest point on the box to the input point
        point.subtractToRef(res, res)
    }

    static aMin = new Vector3()
    static aMax = new Vector3()
    static bMin = new Vector3()
    static bMax = new Vector3()
    static d1 = new Vector3()
    static d2 = new Vector3()
    static aabb(a: TransformNode, b: TransformNode, res: Vector3) {
        this.aMin.copyFrom(b.scale)
        this.aMin.scaleToRef(-0.5)
        this.aMin.addToRef(b.position)

        this.aMax.copyFrom(b.scale)
        this.aMax.scaleToRef(0.5)
        this.aMax.addToRef(b.position)

        this.bMin.copyFrom(a.scale)
        this.bMin.scaleToRef(-0.5)
        this.bMin.addToRef(a.position)

        this.bMax.copyFrom(a.scale)
        this.bMax.scaleToRef(0.5)
        this.bMax.addToRef(a.position)

        this.aMax.subtractToRef(this.bMin, this.d1)
        this.bMax.subtractToRef(this.aMin, this.d2)

        res.set(0, 0, 0)
        if ((this.d1.x > 0 && this.d2.x > 0) && (this.d1.y > 0 && this.d2.y > 0) && (this.d1.z > 0 && this.d2.z > 0)) {
            var x = this.d1.x < this.d2.x ? this.d1.x : -this.d2.x
            var y = this.d1.y < this.d2.y ? this.d1.y : -this.d2.y
            var z = this.d1.z < this.d2.z ? this.d1.z : -this.d2.z

            if (Math.abs(x) < Math.abs(y)) {
                if (Math.abs(x) < Math.abs(z)) {
                    res.x = x
                } else {
                    res.z = z
                }
            } else {
                if (Math.abs(y) < Math.abs(z)) {
                    res.y = y
                } else {
                    res.z = z
                }
            }
        }
    }
}