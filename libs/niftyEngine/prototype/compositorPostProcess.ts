import { DefaultVertexData } from "./defaultVertexData"
import { GPUDevice } from "../gfx/gpuDevice"
import { CustomProgram } from "../gfx/customProgram"
import { VertexData } from "../gfx/vertexData"
import { Shader } from "../gfx/shader"
import { Framebuffer } from "../gfx/framebuffer"

export class CompositorPostProcess {
  public quad: VertexData
  public fullScreenQuadProg: CustomProgram
  constructor(device: GPUDevice) {
    this.quad = DefaultVertexData.postProcessingQuad(device)
    this.fullScreenQuadProg = new CustomProgram(device, CompositorPostProcess.quadVertShader, CompositorPostProcess.multiviewBlitToTextureFragShader)
  }

  blit(fb: Framebuffer) {

    this.fullScreenQuadProg.load()
    //this.fullScreenQuadProg.updateUniforms({ dep: d });
    this.fullScreenQuadProg.setTextures({ imgs: fb.color, depthx: fb.depthStencil! })
    this.fullScreenQuadProg.draw(this.quad)
  }

  static quadVertShader = new Shader(`
    #version 300 es
    #extension GL_OVR_multiview2 : require
    #extension GL_EXT_frag_depth : enable
    layout (num_views = 2) in;
    
    in vec4 a_position;
    out mediump vec3 tx;
    
    void main() {  
      tx = (a_position.xyz/a_position.w) * 0.5 + 0.5;
      // tx.xy += vec2(1,1);
      // tx.xy *= vec2(0.5,0.5);
    
      gl_Position = a_position;
    }
          
    `)

  static multiviewBlitToTextureFragShader = new Shader(`
        #version 300 es
        #extension GL_OVR_multiview2 : require
        precision mediump float;
        uniform mediump sampler2DArray imgs;
        uniform mediump sampler2DArray depthx;
        
        in vec4 v_position;
        in vec3 tx;
        
        layout(location=0) out vec4 theColor;
        
        void main() {
          float depthVal = texture(depthx, vec3(tx.xy, gl_ViewID_OVR == 0u ? 0 :1)).r;
          theColor = texture(imgs, vec3(tx.xy, gl_ViewID_OVR == 0u ? 0 :1));
          gl_FragDepth  =  depthVal; 
        }
          
    `)
}