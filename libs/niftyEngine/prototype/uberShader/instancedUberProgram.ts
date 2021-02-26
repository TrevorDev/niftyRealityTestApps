import * as twgl from "twgl.js"
import { Matrix4 } from "../../math/matrix4"
import { GPUDevice } from "../../gfx/gpuDevice"
import { Camera } from "../../sceneGraph/camera"
import { Light } from "../../sceneGraph/light"
import { Vector3 } from "../../math/vector3"
import { UberMaterial } from "./uberMaterial"
import { Mesh } from "../../sceneGraph/mesh"
import { Shader } from "../../gfx/shader"
import { VertexData } from "../../gfx/vertexData"

export class InstancedUberProgram {
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
  }

  updateFromCamera(cameras: Array<Camera>) {
    // Populate uniform buffers for camera matrix info
    cameras.forEach((c, i) => {
      c.projection.copyToArrayBufferView(this.viewUboInfo[i].uniforms.u_projection)
      c.view.copyToArrayBufferView(this.viewUboInfo[i].uniforms.u_view)

      // Set world position
      c.worldMatrix.decompose(InstancedUberProgram.tmpVec)
      InstancedUberProgram.tmpVec.copyToArrayBufferView(this.viewUboInfo[i].uniforms.u_camPos);

      twgl.setUniformBlock(this.device.gl, this.programInfo, this.viewUboInfo[i]);
    })
  }

  updateForLights(lights: Array<Light>) {
    for (var i = 0; i < lights.length; i++) {
      var light = lights[i]
      light.worldMatrix.decompose(InstancedUberProgram.tmpVec)
      InstancedUberProgram.tmpVecB.set(0, 0, -1)
      InstancedUberProgram.tmpVecB.transformDirectionToRef(light.worldMatrix, InstancedUberProgram.tmpVecB)
      if (light.type == Light.name) {
        InstancedUberProgram.lightData.u_lightColor = InstancedUberProgram.defaultLightColor
        InstancedUberProgram.lightData.u_lightWorldPos = [InstancedUberProgram.tmpVec.x, InstancedUberProgram.tmpVec.y, InstancedUberProgram.tmpVec.z]
        InstancedUberProgram.lightData.u_lightWorldDirection = [InstancedUberProgram.tmpVecB.x, InstancedUberProgram.tmpVecB.y, InstancedUberProgram.tmpVecB.z]
        InstancedUberProgram.lightData.u_brightness = 100
        twgl.setBlockUniforms(this.lightUboInfo[i], InstancedUberProgram.lightData);
      }

      twgl.setUniformBlock(this.device.gl, this.programInfo, this.lightUboInfo[i]);
    }
  }

  setTextures(textures: { [key: string]: WebGLTexture }) {
    twgl.setUniforms(this.programInfo, textures);
  }


  updateAndDrawInstanced(vertexData: VertexData, instanceWorlds: Float32Array, numInstances: number, vertexArrayInfo: any) {

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
    this.programInfo = twgl.createProgramInfo(this.device.gl, [definesString + InstancedUberProgram.vertShader.str, definesString + InstancedUberProgram.fragShader.str])
    this.createUniforms()
  }

  dispose() {
    // TODO
  }

  static vertShader = new Shader(`
    // EXTENSIONS
    #ifdef MULTIVIEW_COUNT
      #extension GL_OVR_multiview2 : require
      layout (num_views = MULTIVIEW_COUNT) in;
    #endif

    // PRECISION
    precision mediump float;

    uniform Lights {
      mediump vec3 u_lightWorldPos;
      mediump vec3 u_lightWorldDirection;
      mediump vec4 u_lightColor;
      float u_brightness;
    } lights[LIGHT_COUNT];

    // UNIFORMS
    #ifdef MULTIVIEW_COUNT
      uniform Views {
        mat4 u_view;
        mat4 u_projection;
        vec3 u_camPos;
      } views[MULTIVIEW_COUNT];
    #else
      uniform Views {
        mat4 u_view;
        mat4 u_projection;
        vec3 u_camPos;
      } views[1];
    #endif

    in mat4 instanceWorld;
    in vec4 instanceColor;

    out vec4 v_color;
    out vec3 v_normal;
    
    in vec3 a_position;
    in vec3 a_normal;
    in vec2 a_texcoord;

    // MAIN
    void main() {
      #ifdef MULTIVIEW_COUNT
        mat4 u_view = gl_ViewID_OVR == 0u ? (views[0].u_view) :  (views[1].u_view);
        mat4 u_projection = gl_ViewID_OVR == 0u ? views[0].u_projection :  views[1].u_projection;
      #else
        mat4 u_view = views[0].u_view;
        mat4 u_projection = views[0].u_projection;
      #endif

      v_color = instanceColor;
      v_normal = mat3(instanceWorld) * a_normal;

      vec3 v_worldPosition = vec3(instanceWorld * vec4(a_position, 1));
      gl_Position = u_projection * u_view * vec4(v_worldPosition, 1);
    }
  `)

  // From https://learnopengl.com/PBR/Lighting
  static fragShader = new Shader(`
    #ifdef MULTIVIEW_COUNT
      #extension GL_OVR_multiview2 : require
    #endif
    // PRECISION  
    precision mediump float;

    uniform Lights {
      mediump vec3 u_lightWorldPos;
      mediump vec3 u_lightWorldDirection;
      mediump vec4 u_lightColor;
      float u_brightness;
    } lights[LIGHT_COUNT];
    
    in vec4 v_color;
    in vec3 v_normal;

    // Result
    out vec4 result;
    
   
    // MAIN
    void main() {
        result = v_color;

        for(int i = 0; i < LIGHT_COUNT; ++i) 
        {
          // Flat light (calculate angle between surface normal and light direction and apply to material)
          vec3 normal = normalize(v_normal);
          vec3 lightDir = normalize(lights[0].u_lightWorldDirection)*-1.0;
          float lightAngle = max(dot(lightDir, normal),0.0);
          result.rgb += lightAngle*0.2;
        }
    }
  `)
}