import { DefaultVertexData } from "./defaultVertexData"
import { GPUDevice } from "../gfx/gpuDevice"
import { CustomProgram } from "../gfx/customProgram"
import { VertexData } from "../gfx/vertexData"
import { Shader } from "../gfx/shader"
import { Framebuffer } from "../gfx/framebuffer"
import { XRHead } from "./xr/xrHead"

export class MultiviewBlit {
  public quad: VertexData
  public fullScreenQuadProg: CustomProgram
  public brightness = 1;
  constructor(device: GPUDevice) {
    this.quad = new VertexData(device, {
      a_position: [0.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,

        0.0, 1.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 1.0, 0.0,

        0.0, 0.0, 1.0,
        1.0, 0.0, 1.0,
        0.0, 1.0, 1.0,

        0.0, 1.0, 1.0,
        1.0, 0.0, 1.0,
        1.0, 1.0, 1.0,],
      a_normal: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      a_texcoord: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    })
    this.fullScreenQuadProg = new CustomProgram(device, MultiviewBlit.quadVertShader, MultiviewBlit.multiviewBlitToTextureFragShader)
  }

  blit(framebuffer: Framebuffer) {
    this.fullScreenQuadProg.load()
    //this.fullScreenQuadProg.updateUniforms({ debug: this.singleViewDebug });
    this.fullScreenQuadProg.setTextures({ imgs: framebuffer.color, depthTex: framebuffer.depthStencil! })
    this.fullScreenQuadProg.updateUniforms({ brightness: this.brightness, near: XRHead.NEAR_Z, far: XRHead.FAR_Z })
    this.fullScreenQuadProg.draw(this.quad)
  }

  static quadVertShader = new Shader(`
    #version 300 es
    
    in vec4 a_position;
    in vec3 a_normal;
    in vec2 a_texcoord;
    
    
    out mediump vec3 tx;
    
    void main() {
      // const float eye_offset_x[12] = float[12] (
      //     0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      //     1.0, 1.0, 1.0, 1.0, 1.0, 1.0
      // );
    
      tx = a_position.xyz;
    
      const vec2 pos_scale = vec2(0.5, 1.0);
      gl_Position = vec4(((a_position.xy)*pos_scale * 2.0) - 1.0 + vec2(a_position.z, 0), 0.0, 1.0);
    }
          
    `)

  static multiviewBlitToTextureFragShader = new Shader(`
        #version 300 es
        precision mediump float;
    
        uniform float debug;
        uniform float brightness;
        uniform mediump sampler2DArray imgs;

        // SSAO
        uniform float near;
        uniform float far;
        uniform mediump sampler2DArray depthTex;
        
        in vec4 v_position;
        in vec3 tx;
        
        out vec4 theColor;

        // SSAO start http://theorangeduck.com/page/pure-depth-ssao -------------------------------- MAKES PERF TOO BAD
        float sampleDepth(vec3 tx){
          return 2.0 * near * far / (far + near - (2.0 * texture(depthTex, tx).r - 1.0) * (far - near));
        }
        vec3 normalFromDepth(float depth, vec3 texcoords) 
        {
          
          vec3 offset1 = vec3(0.0,0.001,0.);
          vec3 offset2 = vec3(0.001,0.0,0.);
          
          float depth1 = sampleDepth(texcoords + offset1);
          float depth2 = sampleDepth(texcoords + offset2);
          
          
          vec3 p1 = vec3(offset1.xy, depth1 - depth);
          vec3 p2 = vec3(offset2.xy, depth2 - depth);
          
          vec3 normal = cross(p1, p2);
          normal.z = -normal.z;
          
          return normalize(normal);
        }
        vec3 reflection(vec3 v1,vec3 v2)
        {
            vec3 result= 2.0 * dot(v2, v1) * v2;
            result=v1-result;
            return result;
        }

        float PHI = 1.61803398874989484820459;  // Φ = Golden Ratio   

        float gold_noise(vec2 co, float seed){
         return fract(sin(dot(co.xy,vec2(12.9898*seed,78.233+seed))) * 43758.5453*seed);
        }
        float ssao(vec3 tx){
          const float total_strength = 1.0;
          const float base = 0.2;
          
          const float area = 0.0075;
          const float falloff = 0.000001;
          
          const float radius = 0.009;

          vec3 sample_sphere[16] = vec3[]( 
                                          vec3( 0.5381, 0.1856,-0.4319),
                                          vec3( 0.1379, 0.2486, 0.4430),
                                          vec3( 0.3371, 0.5679,-0.0057),
                                          vec3(-0.6999,-0.0451,-0.0019),
                                          vec3( 0.0689,-0.1598,-0.8547),
                                          vec3( 0.0560, 0.0069,-0.1843),
                                          vec3(-0.0146, 0.1402, 0.0762),
                                          vec3( 0.0100,-0.1924,-0.0344),
                                          vec3(-0.3577,-0.5301,-0.4358),
                                          vec3(-0.3169, 0.1063, 0.0158),
                                          vec3( 0.0103,-0.5869, 0.0046),
                                          vec3(-0.0897,-0.4940, 0.3287),
                                          vec3( 0.7119,-0.0154,-0.0918),
                                          vec3(-0.0533, 0.0596,-0.5411),
                                          vec3( 0.0352,-0.0631, 0.5460),
                                          vec3(-0.4776, 0.2847,-0.0271)
                                        );
          vec3 random = normalize(vec3(gold_noise(tx.xy, 3.),gold_noise(tx.xy, 2.),gold_noise(tx.xy, 1.)));
          float depth = sampleDepth(tx);
          vec3 position = vec3(tx.x,tx.y,depth);
          vec3 normal = normalFromDepth(depth, tx);
          float radius_depth = radius/depth;
          float occlusion = 0.0;

          int iterations = 16;
          for (int j = 0; j < iterations; ++j)
          {
          vec3 ray = radius_depth * reflection(sample_sphere[j], random);
          vec3 hemiRay = position + sign(dot(ray,normal)) * ray;

          float occDepth = sampleDepth(vec3(clamp(hemiRay.xy,0.0,1.0), tx.z));
          float difference = depth - occDepth;

          occlusion += step(falloff, difference) * (1.0-smoothstep(falloff, area, difference));
          }

          float ao = 1.0 - total_strength  * occlusion  / 16.;
          float final = clamp(ao + base,0.0,1.0);

          return  clamp((occlusion  / 16.),0.0,1.0)*0.3;          
        }
        // SSAO end --------------------------------------------------------

        void main() {
          theColor = texture(imgs, tx);
         // theColor.rgb -= 0.3*vec3(ssao(tx));
          theColor.rgb *= brightness;
        }
          
    `)
}