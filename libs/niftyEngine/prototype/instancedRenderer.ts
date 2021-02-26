import { InstancedUberProgram } from "./uberShader/instancedUberProgram"
import { GPUDevice } from "../gfx/gpuDevice"
import { TransformNode } from "../sceneGraph/transformNode"
import { DefaultVertexData } from "./defaultVertexData"
import * as twgl from "twgl.js"
import { XRHead } from "./xr/xrHead"
import { VertexData } from "../gfx/vertexData"
import { Color } from "../math/color"
import { Mesh } from "../sceneGraph/mesh"
import { Matrix4 } from "../math/matrix4"
import { Light } from "../sceneGraph/light"

export class InstancedMaterial {
    color = new Color()
}

export class InstancedRenderer {
    program: InstancedUberProgram
    vertexArrayInfo: twgl.VertexArrayInfo

    vertexData: VertexData

    instanceWorlds: Float32Array
    instanceColors: Float32Array

    inactiveMeshes = new Array<Mesh<InstancedMaterial>>()

    createInstance() {
        if (this.inactiveMeshes.length > 0) {
            var m = this.inactiveMeshes.pop()!
            m.material.color.set(0, 0, 0, 1)
            m.worldMatrix.copyFrom(new Matrix4())
            m.worldMatrix.decompose(m.position, m.rotation, m.scale)
            return m
        } else {
            return null
        }
    }

    destroyInstance(mesh: Mesh<InstancedMaterial>) {
        this.inactiveMeshes.push(mesh)
        mesh.scale.setScalar(0)
    }

    constructor(private device: GPUDevice, public numInstances: number) {
        // Initialize program
        this.program = new InstancedUberProgram(this.device)
        this.program.updateDefines({ LIGHT_COUNT: 1, COLOR_ATTRIBUTE: 0, MULTIVIEW_COUNT: 2 })
        this.program.compile()
        this.program.createUniforms()

        // Create world matrix of all to render
        this.instanceWorlds = new Float32Array(this.numInstances * 16);
        this.instanceColors = new Float32Array(this.numInstances * 4);
        var instanceData = {
            instanceWorld: {
                numComponents: this.instanceWorlds.length / this.numInstances,
                data: this.instanceWorlds,
                drawType: device.gl.STREAM_DRAW,
                divisor: 1,
            },
            instanceColor: {
                numComponents: this.instanceColors.length / this.numInstances,
                data: this.instanceColors,
                drawType: device.gl.STREAM_DRAW, // https://www.reddit.com/r/opengl/comments/57i9cl/examples_of_when_to_use_gl_dynamic_draw/
                divisor: 1,
            }
        }
        this.vertexData = DefaultVertexData.createCubeVertexData(this.device, instanceData)


        for (var i = 0; i < this.numInstances; i++) {
            var mat = new InstancedMaterial()
            mat.color.v = new Float32Array(this.instanceColors.buffer, i * instanceData.instanceColor.numComponents * 4, instanceData.instanceColor.numComponents);
            var mesh = new Mesh<InstancedMaterial>(this.vertexData, mat)

            mesh.worldMatrix.m = new Float32Array(this.instanceWorlds.buffer, i * instanceData.instanceWorld.numComponents * 4, instanceData.instanceWorld.numComponents);
            mesh.scale.scaleInPlace(0)
            mesh.computeWorldMatrix()
            this.inactiveMeshes.push(mesh)
        }

        this.vertexArrayInfo = twgl.createVertexArrayInfo(this.device.gl, this.program.programInfo, this.vertexData.gpuBufferInfo);
    }

    render(camera: XRHead, lights: Array<Light>) {
        // Set program
        this.device.gl.useProgram(this.program.programInfo.program);

        // Set light info
        this.program.updateFromCamera(camera.cameras)

        this.program.updateForLights(lights)

        //Update instance data (this is expensive if number of instances is high)
        twgl.setAttribInfoBufferFromArray(this.device.gl, this.vertexData.gpuBufferInfo.attribs!.instanceWorld, this.instanceWorlds)
        twgl.setAttribInfoBufferFromArray(this.device.gl, this.vertexData.gpuBufferInfo.attribs!.instanceColor, this.instanceColors)

        // Bind vertex buffers
        twgl.setBuffersAndAttributes(this.device.gl, this.program.programInfo, this.vertexArrayInfo);
        twgl.drawBufferInfo(this.device.gl, this.vertexArrayInfo, this.device.gl.TRIANGLES, this.vertexArrayInfo.numElements, 0, this.numInstances);

        // Unbind to allow future shaders to renderer
        this.device.gl.bindVertexArray(null)
    }

    dispose() {

    }
}