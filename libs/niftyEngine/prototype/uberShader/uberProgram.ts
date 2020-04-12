import * as twgl from "twgl.js"
import { Matrix4 } from "../../math/matrix4"
import { GPUDevice } from "../../gfx/gpuDevice"
import { Camera } from "../../sceneGraph/camera"
import { Light } from "../../sceneGraph/light"
import { Vector3 } from "../../math/vector3"
import { Texture } from "../../gfx/texture"
import { UberMaterial } from "./uberMaterial"
import { Mesh } from "../../sceneGraph/mesh"
import { Shader } from "../../gfx/shader"

export class UberProgram {
  private static lightData = {
    u_lightColor: new Array<number>(),
    u_lightWorldPos: new Array<number>(),
    u_brightness: 0
  }
  private static defaultLightColor = [1, 1, 1, 1]
  private static tmpMat = new Matrix4()
  private static tmpVec = new Vector3()
  private defines: { [key: string]: number } = {}
  programInfo: twgl.ProgramInfo

  // Uniforms
  viewUboInfo: Array<twgl.UniformBlockInfo> = []
  lightUboInfo: twgl.UniformBlockInfo
  materialUboInfo: twgl.UniformBlockInfo
  modelUboInfo: twgl.UniformBlockInfo
  constructor(private device: GPUDevice) {

  };

  load() {
    this.device.gl.useProgram(this.programInfo.program);
  }
  createUniforms() {
    this.lightUboInfo = twgl.createUniformBlockInfo(this.device.gl, this.programInfo, "Lights[0]");
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
    cameras.forEach((c, i) => {
      c.projection.copyToArrayBufferView(this.viewUboInfo[i].uniforms.u_projection)
      c.view.copyToArrayBufferView(this.viewUboInfo[i].uniforms.u_view)

      // Set world position
      c.worldMatrix.decompose(UberProgram.tmpVec)
      UberProgram.tmpVec.copyToArrayBufferView(this.viewUboInfo[i].uniforms.u_camPos);

      twgl.setUniformBlock(this.device.gl, this.programInfo, this.viewUboInfo[i]);
    })
  }
  updateForLights(lights: Array<Light>) {
    // TODO fix all this
    var light = lights[0]
    light.worldMatrix.decompose(UberProgram.tmpVec)
    if (light.type == Light.name) {
      UberProgram.lightData.u_lightColor = UberProgram.defaultLightColor
      UberProgram.lightData.u_lightWorldPos = [UberProgram.tmpVec.x, UberProgram.tmpVec.y, UberProgram.tmpVec.z]
      UberProgram.lightData.u_brightness = 100
      twgl.setBlockUniforms(this.lightUboInfo, UberProgram.lightData.u_lightColor);
    } else {
      // twgl.setBlockUniforms(this.lightUboInfo, {
      //     u_lightColor: [light.color.v[0], light.color.v[1], light.color.v[2], 1],
      //     u_lightWorldPos: [tmp.x, tmp.y, tmp.z],
      //     u_brightness: light.intensity
      //   });
    }

    twgl.setUniformBlock(this.device.gl, this.programInfo, this.lightUboInfo);
  }

  setTextures(textures: { [key: string]: WebGLTexture }) {
    twgl.setUniforms(this.programInfo, textures);
  }
  updateAndDrawForMesh(mesh: Mesh<UberMaterial>) {
    //this.device.gl.cullFace(this.device.gl.FRONT_FACE)

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

  static vertShader = new Shader(`
    // EXTENSIONS
    #ifdef MULTIVIEW_COUNT
      #extension GL_OVR_multiview2 : require
      layout (num_views = MULTIVIEW_COUNT) in;
    #endif

    // PRECISION
    precision mediump float;

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
    

    uniform Lights {
      mediump vec3 u_lightWorldPos;
      mediump vec4 u_lightColor;
      float u_brightness;
    } lights[LIGHT_COUNT];

    uniform Model {
      mat4 u_world;
    } foo;

    // ATTRIBUTES
    #if COLOR_ATTRIBUTE
      in vec3 a_color;
      out vec3 v_color;
    #endif
    
    in vec3 a_position;
    in vec3 a_normal;
    in vec2 a_texcoord;

    // VARYING 
    out vec3 v_worldPosition;
    out vec2 v_texCoord;
    out vec3 v_normal;
    

    
    // FUNCTIONS

    // MAIN
    void main() {
      #ifdef MULTIVIEW_COUNT
        mat4 u_view = gl_ViewID_OVR == 0u ? (views[0].u_view) :  (views[1].u_view);
        mat4 u_projection = gl_ViewID_OVR == 0u ? views[0].u_projection :  views[1].u_projection;
      #else
        mat4 u_view = views[0].u_view;
        mat4 u_projection = views[0].u_projection;
      #endif

      v_texCoord = a_texcoord;
      v_worldPosition = vec3(foo.u_world * vec4(a_position, 1));
      v_normal = mat3(foo.u_world) * a_normal;
      #if COLOR_ATTRIBUTE
        v_color = a_color;
      #endif
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
    
    // CONST
    const float PI = 3.14159265359;

    // VARYING 
    in vec3 v_worldPosition;
    in vec2 v_texCoord;
    in vec3 v_normal;
    #if COLOR_ATTRIBUTE
    in vec3 v_color;
    #endif
    
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

    uniform Lights {
      vec3 u_lightWorldPos;
      vec4 u_lightColor;
      float u_brightness;
    } lights[LIGHT_COUNT];
    
    uniform sampler2D u_albedoTexture;
    uniform sampler2D u_metallicTexture;
    uniform sampler2D u_roughnessTexture;
    
    uniform Material {
      vec4 u_albedoColor;
      float u_metallic;
      float u_roughness;
      float u_ambientLight;
    } prop;
    
    // Result
    out vec4 result;
    
    // FUNCTIONS
    
    // ----------------------------------------------------------------------------
    float DistributionGGX(vec3 N, vec3 H, float roughness)
    {
        float a = roughness*roughness;
        float a2 = a*a;
        float NdotH = max(dot(N, H), 0.0);
        float NdotH2 = NdotH*NdotH;
    
        float nom   = a2;
        float denom = (NdotH2 * (a2 - 1.0) + 1.0);
        denom = PI * denom * denom + 0.001;// 0.001 to prevent divide by zero.
    
        return nom / denom;
    }
    // ----------------------------------------------------------------------------
    float GeometrySchlickGGX(float NdotV, float roughness)
    {
        float r = (roughness + 1.0);
        float k = (r*r) / 8.0;

        float nom   = NdotV;
        float denom = NdotV * (1.0 - k) + k;

        return nom / denom;
    }
    // ----------------------------------------------------------------------------
    float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
    {
        float NdotV = max(dot(N, V), 0.0);
        float NdotL = max(dot(N, L), 0.0);
        float ggx2 = GeometrySchlickGGX(NdotV, roughness);
        float ggx1 = GeometrySchlickGGX(NdotL, roughness);

        return ggx1 * ggx2;
    }
    // ----------------------------------------------------------------------------
    vec3 fresnelSchlick(float cosTheta, vec3 F0)
    {
        return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
    }
    // MAIN
    void main() {

      vec3 albedo     = pow(texture(u_albedoTexture, v_texCoord).rgb, vec3(2.2));
      albedo += prop.u_albedoColor.rgb;
      #if COLOR_ATTRIBUTE
      albedo += v_color;
      #endif

      #if ALBEDO_ONLY
        result = vec4(albedo, 1);
        return;
      #endif
      
      float metallic  = texture(u_metallicTexture, v_texCoord).r;
      metallic += prop.u_metallic;

      float roughness = texture(u_roughnessTexture, v_texCoord).r;
      roughness += prop.u_roughness;

      // float ao        = texture(aoMap, v_texCoord).r;
      float ao = 0.0;

      // vec3 N = getNormalFromMap();
      vec3 worldNormal = normalize(v_normal);
      
      #ifdef MULTIVIEW_COUNT
       vec3 camPos = gl_ViewID_OVR == 0u ? (views[0].u_camPos) :  (views[1].u_camPos);
      #else
        vec3 camPos = views[0].u_camPos;
      #endif
      vec3 towardsCamera = normalize(camPos - v_worldPosition);

      // calculate reflectance at normal incidence; if dia-electric (like plastic) use F0 
      // of 0.04 and if it's a metal, use the albedo color as F0 (metallic workflow)    
      vec3 F0 = vec3(0.04); 
      F0 = mix(F0, albedo, metallic);

      // reflectance equation
      vec3 Lo = vec3(0.0);
      // for(int i = 0; i < LIGHT_COUNT; ++i) 
      // {
          // calculate per-light radiance
          vec3 towardsLight = normalize(lights[0].u_lightWorldPos - v_worldPosition);
          vec3 H = normalize(towardsCamera + towardsLight);
          float distance = length(lights[0].u_lightWorldPos - v_worldPosition);
          float attenuation = lights[0].u_brightness / (distance * distance);
          vec3 radiance = lights[0].u_lightColor.rgb * attenuation;

          // Cook-Torrance BRDF
          float NDF = DistributionGGX(worldNormal, H, roughness);   
          float G   = GeometrySmith(worldNormal, towardsCamera, towardsLight, roughness);      
          vec3 F    = fresnelSchlick(max(dot(H, towardsCamera), 0.0), F0);
            
          vec3 nominator    = NDF * G * F; 
          float denominator = 4. * max(dot(worldNormal, towardsCamera), 0.0) * max(dot(worldNormal, towardsLight), 0.0) + 0.001; // 0.001 to prevent divide by zero.
          vec3 specular = nominator / denominator;
          
          // kS is equal to Fresnel
          vec3 kS = F;
          // for energy conservation, the diffuse and specular light can't
          // be above 1.0 (unless the surface emits light); to preserve this
          // relationship the diffuse component (kD) should equal 1.0 - kS.
          vec3 kD = vec3(1.0) - kS;
          // multiply kD by the inverse metalness such that only non-metals 
          // have diffuse lighting, or a linear blend if partly metal (pure metals
          // have no diffuse light).
          kD *= 1.0 - metallic;	  

          // scale light by NdotL
          float NdotL = max(dot(worldNormal, towardsLight), 0.0);        

          // add to outgoing radiance Lo
          Lo += (kD * albedo / PI + specular) * radiance * NdotL;  // note that we already multiplied the BRDF by the Fresnel (kS) so we won't multiply by kS again
      // }   
      
      // ambient lighting (note that the next IBL tutorial will replace 
      // this ambient lighting with environment lighting).
      vec3 ambient = vec3(0.3) * albedo * ao;
      
      vec3 color = ambient + Lo;

      // HDR tonemapping
      color = color / (color + vec3(1.0));
      // gamma correct
      color = pow(color, vec3(1.0/2.2)); 

      result = vec4(color, 1.0);
    }
  `)
}