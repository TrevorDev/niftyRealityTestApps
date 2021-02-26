import * as twgl from "twgl.js"
import { Matrix4 } from "../../math/matrix4"
import { GPUDevice } from "../../gfx/gpuDevice"
import { Camera } from "../../sceneGraph/camera"
import { Light } from "../../sceneGraph/light"
import { Vector3 } from "../../math/vector3"
import { Texture } from "../../gfx/texture"
import { UberMaterial, UberMaterialSide } from "./uberMaterial"
import { Mesh } from "../../sceneGraph/mesh"
import { Shader } from "../../gfx/shader"
import frag from './uberProgramFrag.glsl';
import vert from './uberProgramVert.glsl';
// var frag = require('./uberProgramFrag.glsl')
// var vert = require('./uberProgramVert.glsl')

export class UberProgram {
  private static lightData = {
    u_lightColor: new Array<number>(),
    u_lightWorldPos: new Array<number>(),
    u_lightWorldDirection: new Array<number>(),
    u_brightness: 0
  }
  private static defaultLightColor = [1, 1, 1, 1]
  private static tmpMat = new Matrix4()
  private static tmpVec = new Vector3()
  private static tmpVecB = new Vector3()
  private defines: { [key: string]: number } = {}
  programInfo: twgl.ProgramInfo

  // Uniforms
  viewUboInfo: Array<twgl.UniformBlockInfo> = []
  lightUboInfo: Array<twgl.UniformBlockInfo> = []
  materialUboInfo: twgl.UniformBlockInfo
  modelUboInfo: twgl.UniformBlockInfo
  constructor(private device: GPUDevice) {

  };

  load() {
    this.device.gl.useProgram(this.programInfo.program);
  }
  createUniforms() {
    var lightCount = this.getDefines()["LIGHT_COUNT"] ? this.getDefines()["LIGHT_COUNT"] : 1;
    for (var i = 0; i < lightCount; i++) {
      this.lightUboInfo[i] = twgl.createUniformBlockInfo(this.device.gl, this.programInfo, "Lights[" + i + "]");
    }
    var viewCount = this.getDefines()["MULTIVIEW_COUNT"] ? this.getDefines()["MULTIVIEW_COUNT"] : 1;
    for (var i = 0; i < viewCount; i++) {
      this.viewUboInfo[i] = twgl.createUniformBlockInfo(this.device.gl, this.programInfo, "Views[" + i + "]");
    }

    this.materialUboInfo = twgl.createUniformBlockInfo(this.device.gl, this.programInfo, "Material");

    this.modelUboInfo = twgl.createUniformBlockInfo(this.device.gl, this.programInfo, "Model");

    // Initialize model buffer (TODO does this need to be done here?)
    var m4 = twgl.m4
    const world = m4.translation([0, 0, 0]);

    twgl.setBlockUniforms(this.modelUboInfo, {
      u_world: world
    });
    twgl.setUniformBlock(this.device.gl, this.programInfo, this.modelUboInfo);
  }

  updateFromCamera(cameras: Array<Camera>) {
    // Populate uniform buffers for camera matrix info
    var i = 0;
    for (var c of cameras) {
      c.projection.copyToArrayBufferView(this.viewUboInfo[i].uniforms.u_projection)
      c.view.copyToArrayBufferView(this.viewUboInfo[i].uniforms.u_view)

      // Set world position
      c.worldMatrix.decompose(UberProgram.tmpVec)
      UberProgram.tmpVec.copyToArrayBufferView(this.viewUboInfo[i].uniforms.u_camPos);

      twgl.setUniformBlock(this.device.gl, this.programInfo, this.viewUboInfo[i]);
      i++;
    }
  }
  updateForLights(lights: Array<Light>) {
    for (var i = 0; i < lights.length; i++) {
      var light = lights[i]
      light.worldMatrix.decompose(UberProgram.tmpVec)
      UberProgram.tmpVecB.set(0, 0, -1)
      UberProgram.tmpVecB.transformDirectionToRef(light.worldMatrix, UberProgram.tmpVecB)
      if (light.type == Light.name) {
        UberProgram.lightData.u_lightColor = UberProgram.defaultLightColor
        UberProgram.lightData.u_lightWorldPos = [UberProgram.tmpVec.x, UberProgram.tmpVec.y, UberProgram.tmpVec.z]
        UberProgram.lightData.u_lightWorldDirection = [UberProgram.tmpVecB.x, UberProgram.tmpVecB.y, UberProgram.tmpVecB.z]
        UberProgram.lightData.u_brightness = light.brightness
        twgl.setBlockUniforms(this.lightUboInfo[i], UberProgram.lightData);
      }

      twgl.setUniformBlock(this.device.gl, this.programInfo, this.lightUboInfo[i]);
    }
  }

  setTextures(textures: { [key: string]: WebGLTexture }) {
    twgl.setUniforms(this.programInfo, textures);
  }
  updateAndDrawForMesh(mesh: Mesh<UberMaterial>) {
    if (mesh.material.side == UberMaterialSide.DOUBLE_SIDE) {
      this.device.gl.disable(this.device.gl.CULL_FACE);
    } else {
      this.device.gl.enable(this.device.gl.CULL_FACE);
    }


    twgl.setBuffersAndAttributes(this.device.gl, this.programInfo, mesh.vertData.gpuBufferInfo); // Set object vert data

    // Set world matrix and inverse transpose
    mesh.worldMatrix.copyToArrayBufferView(this.modelUboInfo.uniforms.u_world)
    twgl.setUniformBlock(this.device.gl, this.programInfo, this.modelUboInfo);

    twgl.bindUniformBlock(this.device.gl, this.programInfo, this.modelUboInfo);  // model position
    twgl.drawBufferInfo(this.device.gl, mesh.vertData.gpuBufferInfo);
  }

  /**
   * Returns the state of the current defines
   * DO NOT MODIFY THIS
   */
  getDefines() {
    return this.defines;
  }

  /**
   * Updates values of the passed in defines in the materials defines
   * To unset a define define it to 0
   * @param def defines to overwrite
   */
  updateDefines(def: { [key: string]: number }) {
    for (var key in def) {
      if (this.defines[key] != def[key]) {
        this.defines[key] = def[key];
      }
    }
  }

  compile() {
    // Genearate defines string
    var definesString = "#version 300 es\n"
    for (var key in this.defines) {
      definesString += "#define " + key + " " + this.defines[key] + "\n"
    }

    // Add defines string to shader and compile program
    this.programInfo = twgl.createProgramInfo(this.device.gl, [definesString + UberProgram.vertShader.str, definesString + UberProgram.fragShader.str])
    this.createUniforms()
  }

  dispose() {
    // TODO
  }

  static vertShader = new Shader(vert)

  // From https://learnopengl.com/PBR/Lighting
  static fragShader = new Shader(frag)
}