import * as twgl from "twgl.js"
import { Matrix4 } from "./matrix4";
import { Quaternion } from "./quaternion";
import { PMathTemp } from "./privateMathTemp";

export class Vector3 {
    static _tmp0 = new Vector3()
    static _tmp1 = new Vector3()

    v: twgl.v3.Vec3
    constructor(x = 0, y = 0, z = 0) {
        this.v = twgl.v3.create(x, y, z)
    }

    set x(val: number) {
        this.v[0] = val;
    }
    set y(val: number) {
        this.v[1] = val;
    }
    set z(val: number) {
        this.v[2] = val;
    }

    get x() {
        return this.v[0];
    }
    get y() {
        return this.v[1];
    }
    get z() {
        return this.v[2];
    }

    set(x: number, y: number, z: number) {
        this.x = x
        this.y = y
        this.z = z
        return this
    }

    equals(v: Vector3) {
        return this.x == v.x && this.y == v.y && this.z == v.z
    }

    setScalar(x: number) {
        this.set(x, x, x)
    }

    scaleInPlace(scaleVal: number) {
        this.x *= scaleVal
        this.y *= scaleVal
        this.z *= scaleVal
    }

    scaleToRef(scaleVal: number, res: Vector3 = this) {
        res.x = this.x * scaleVal
        res.y = this.y * scaleVal
        res.z = this.z * scaleVal
    }

    addToRef(a: Vector3, res: Vector3 = this) {
        res.x = this.x + a.x
        res.y = this.y + a.y
        res.z = this.z + a.z
    }

    copyFrom(from: Vector3) {
        this.set(from.x, from.y, from.z)
    }

    rotateByQuaternionToRef(q: Quaternion, res: Vector3) {
        PMathTemp.m1.compose(PMathTemp.vZero, q, PMathTemp.vOne)
        this.applyMatrixToRef(PMathTemp.m1, res)
    }

    /**
     * Applies a matrix including positing components (use transformDirectionToRef to only apply rotation)
     * @param m 
     * @param res 
     */
    applyMatrixToRef(m: Matrix4, res: Vector3) {
        var x = this.x, y = this.y, z = this.z;
        var e = m.m;

        var w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

        res.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
        res.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
        res.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
    }

    /**
     * Only rotate direction by matrix's rotation & (scale? TODO confirm this) but ignore position
     * @param m 
     * @param res 
     */
    transformDirectionToRef(m: Matrix4, res: Vector3) {
        // TODO should this be normalizing?
        var x = this.x, y = this.y, z = this.z;
        var e = m.m;

        res.x = e[0] * x + e[4] * y + e[8] * z;
        res.y = e[1] * x + e[5] * y + e[9] * z;
        res.z = e[2] * x + e[6] * y + e[10] * z;

        res.normalizeToRef(res)
    }

    subtractToRef(sub: Vector3, res: Vector3 = this) {
        res.x = this.x - sub.x
        res.y = this.y - sub.y
        res.z = this.z - sub.z
    }
    normalizeToRef(res: Vector3 = this) {
        var len = this.length()
        res.x = this.x / len
        res.y = this.y / len
        res.z = this.z / len
    }

    multiplyToRef(b: Vector3, res = this) {
        res.x = this.x * b.x
        res.y = this.y * b.y
        res.z = this.z * b.z
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    dot(v: Vector3) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    crossToRef(a: Vector3, res: Vector3) {

        var ax = this.x, ay = this.y, az = this.z;
        var bx = a.x, by = a.y, bz = a.z;

        res.x = ay * bz - az * by;
        res.y = az * bx - ax * bz;
        res.z = ax * by - ay * bx;
    }

    toJSON() {
        return { x: this.x, y: this.y, z: this.z }
    }

    copyToArrayBufferView(copyTo: ArrayBufferView) {
        (copyTo as any)[0] = this.x;
        (copyTo as any)[1] = this.y;
        (copyTo as any)[2] = this.z;
    }

    clone() {
        return new Vector3(this.x, this.y, this.z)
    }

    clampToRef(min: Vector3, max: Vector3, ref: Vector3) {
        ref.x = Math.min(Math.max(this.x, min.x), max.x)
        ref.y = Math.min(Math.max(this.y, min.y), max.y)
        ref.z = Math.min(Math.max(this.z, min.z), max.z)
    }

    projectOntoVectorToRef(onto: Vector3, res: Vector3 = this) {
        Vector3._tmp0.copyFrom(onto)
        Vector3._tmp0.normalizeToRef()
        var dot = Vector3._tmp0.dot(this)
        Vector3._tmp0.scaleToRef(dot, res)
        return dot
    }

    projectOntoPlaneToRef(planeNormal: Vector3, res: Vector3 = this) {
        var dot = this.projectOntoVectorToRef(planeNormal, Vector3._tmp0)
        res.copyFrom(this)
        res.subtractToRef(Vector3._tmp0)
        return dot
    }
}

