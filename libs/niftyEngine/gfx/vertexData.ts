import * as twgl from "twgl.js"
import { GPUDevice } from "./gpuDevice";

export class VertexData {
    public gpuBufferInfo: twgl.BufferInfo
    constructor(device: GPUDevice, private cpuData: {
        a_position: Array<number>
        a_normal: Array<number>
        a_color?: Array<number>
        a_texcoord: Array<number>
        indices: Array<number>
    }) {
        if (cpuData.a_normal.length == 0) {
            delete cpuData.a_normal
        }
        if (cpuData.a_texcoord.length == 0) {
            delete cpuData.a_texcoord
        }
        if (cpuData.a_color && cpuData.a_color.length == 0) {
            delete cpuData.a_color
        }
        if (cpuData.indices.length == 0) {
            var points = cpuData.a_position.length / 3;
            var tris = points / 3
            for (var i = 0; i < tris; i++) {
                cpuData.indices.push(i * 3)
                cpuData.indices.push(i * 3 + 1)
                cpuData.indices.push(i * 3 + 2)
            }
        }
        this.gpuBufferInfo = twgl.createBufferInfoFromArrays(device.gl, cpuData as any);
    }

    getPositions() {
        return this.cpuData.a_position
    }
    getNormals() {
        return this.cpuData.a_normal
    }
    getTexCoords() {
        return this.cpuData.a_texcoord
    }
    getIndices() {
        return this.cpuData.indices
    }

    dispose() {
        // TODO
    }
}