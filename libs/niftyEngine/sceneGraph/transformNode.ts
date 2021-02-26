import { Entity } from "./entity"
import { Vector3 } from "../math/vector3"
import { Quaternion } from "../math/quaternion"
import { Matrix4 } from "../math/matrix4"

export class TransformNode extends Entity {
    position = new Vector3()
    rotation = new Quaternion()
    scale = new Vector3(1, 1, 1)
    worldMatrix = new Matrix4()
    localMatrix = new Matrix4()

    computeLocalMatrix() {
        this.localMatrix.compose(this.position, this.rotation, this.scale)
    }

    static computeWorldMatrixForTree(root: TransformNode) {
        TransformNode.depthFirstIterate(root, (node) => {
            node.computeWorldMatrix(false)
        })
    }

    static depthFirstIterate(root: TransformNode, fn: (node: TransformNode) => void) {
        fn(root)
        for (var c of root.getChildren()) {
            this.depthFirstIterate(c, fn)
        }
    }

    computeWorldMatrix(computeParentsFirst = true) {
        this.computeLocalMatrix()
        if (this._parent) {
            if (computeParentsFirst) {
                this._parent.computeWorldMatrix()
            }
            this._parent.worldMatrix.multiplyToRef(this.localMatrix, this.worldMatrix)
        } else {
            this.worldMatrix.copyFrom(this.localMatrix)
        }
    }

    private _children = new Array<TransformNode>()
    private _parent: null | TransformNode = null

    getParent() {
        return this._parent
    }
    getChildren() {
        return this._children
    }

    addChild(node: TransformNode) {
        if (node._parent) {
            node._parent.removeChild(node)
        }
        node._parent = this
        this._children.push(node)
    }
    removeChild(node: TransformNode) {
        var ind = this._children.indexOf(node)
        if (ind >= 0) {
            node._parent = null
            this._children.splice(ind, 1)
        }
    }

    // forwardToRef(result: Ray) {
    //     result.origin.copyFrom(this.position)
    //     result.direction.set(0, 0, -1);
    //     result.direction.rotateByQuaternionToRef(this.rotation, result.direction)
    // }

    /**
     * Sets the local matrix of the transform such that the computed world matrix will match the one given
     * @param worldMatrix world matrix to set
     */
    setLocalMatrixFromWorldMatrix(worldMatrix: Matrix4) {
        var parent = this.getParent()
        if (parent) {
            var m = new Matrix4()
            parent.worldMatrix.inverseToRef(m)
            m.multiplyToRef(worldMatrix, m)

            m.decompose(this.position, this.rotation, this.scale)
            this.computeWorldMatrix()
        } else {
            this.localMatrix.copyFrom(worldMatrix)
            this.localMatrix.decompose(this.position, this.rotation, this.scale)
        }
    }

    /**
     * Sets the local matrix of the transform and then decomposes it into pos, rot and scale
     * @param matrix matrix to set as local matrix, if not set the current local matrix is used
     */
    setLocalMatrix(matrix?: Matrix4) {
        if (matrix) {
            this.localMatrix.copyFrom(matrix)
        }

        this.localMatrix.decompose(this.position, this.rotation, this.scale)
    }
}