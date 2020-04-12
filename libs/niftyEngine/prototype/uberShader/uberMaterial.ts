import { UberProgram } from "./uberProgram";
import * as twgl from "twgl.js"
import { Texture } from "../../gfx/texture";
import { Color } from "../../math/color";
import { GPUDevice } from "../../gfx/gpuDevice";


export class UberMaterial {
    static tmpBindTextures = {
        u_albedoTexture: null as any,
        u_roughnessTexture: null as any,
        u_metallicTexture: null as any,
    }

    static tmpBindValues = {
        u_albedoColor: null as any,
        u_metallic: null as any,
        u_roughness: null as any,
        u_ambientLight: null as any
    }

    // Properties
    albedoTexture: Texture
    metallicTexture: Texture
    roughnessTexture: Texture

    lightingAmount = 1;
    metallic = 0;
    roughness = 0;
    albedoColor = new Color(0, 0, 0, 1)

    constructor(private device: GPUDevice, public program: UberProgram) {

    }

    updateUniforms() {
        UberMaterial.tmpBindTextures.u_albedoTexture = this.albedoTexture.glTexture
        UberMaterial.tmpBindTextures.u_roughnessTexture = this.roughnessTexture.glTexture
        UberMaterial.tmpBindTextures.u_metallicTexture = this.metallicTexture.glTexture
        this.program.setTextures(UberMaterial.tmpBindTextures)

        UberMaterial.tmpBindValues.u_albedoColor = this.albedoColor.v;
        UberMaterial.tmpBindValues.u_metallic = this.metallic;
        UberMaterial.tmpBindValues.u_roughness = this.roughness;
        UberMaterial.tmpBindValues.u_ambientLight = this.lightingAmount;
        twgl.setBlockUniforms(this.program.materialUboInfo, UberMaterial.tmpBindValues);

        twgl.setUniformBlock(this.device.gl, this.program.programInfo, this.program.materialUboInfo);
    }

}