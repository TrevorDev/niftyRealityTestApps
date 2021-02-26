import { Vector3 } from "../math/vector3";
import { Quaternion } from "../math/quaternion";

export class V3Pool {
    static pool = new Array<Vector3>()
    static get(x?: number, y?: number, z?: number) {
        if (this.pool.length <= 0) {
            return new Vector3(x, y, z)
        } else {
            var ret = this.pool.pop()!
            ret.set(x ? x : 0, y ? y : 0, z ? z : 0);
            return ret
        }
    }
    static push(v: Vector3) {
        this.pool.push(v)
    }
}