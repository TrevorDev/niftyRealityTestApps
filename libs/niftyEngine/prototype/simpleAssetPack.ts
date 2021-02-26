import { Texture } from "../gfx/texture";
import { UberProgram } from "./uberShader/uberProgram";
import { VertexData } from "../gfx/vertexData";
import { UberMaterial } from "./uberShader/uberMaterial";
import { GPUDevice } from "../gfx/gpuDevice";
import { Color } from "../math/color";
import { DefaultVertexData } from "./defaultVertexData";
import { ColorScheme } from "./colorSchemes/colorScheme";

export class SimpleAssetPack {
    device: GPUDevice
    textures: { default: Texture; };
    programs: { default: UberProgram; };
    vertexAttributes: { cube: VertexData; plane: VertexData; verticlePlane: VertexData; sphere: VertexData; };
    materials: {
        background: UberMaterial;
        default: UberMaterial;
        focus: UberMaterial;
        dark: UberMaterial;
        light: UberMaterial;
        red: UberMaterial;
        orange: UberMaterial;
        yellow: UberMaterial;
        green: UberMaterial;
        blue: UberMaterial;
        purple: UberMaterial;
        white: UberMaterial;
        gray: UberMaterial;
        black: UberMaterial;
    };

    constructor() {

    }
    async load(device: GPUDevice) {
        this.device = device
        this.programs = {
            default: new UberProgram(device)
        }
        this.programs.default.updateDefines({ LIGHT_COUNT: 1, COLOR_ATTRIBUTE: 0, MULTIVIEW_COUNT: 2 })
        this.programs.default.compile()
        this.programs.default.createUniforms()

        this.textures = {
            default: Texture.createFromeSource(device, [
                0, 0, 0, 255
            ])
        }
        this.materials = {
            background: new UberMaterial(device, this.programs.default),
            default: new UberMaterial(device, this.programs.default),
            focus: new UberMaterial(device, this.programs.default),
            dark: new UberMaterial(device, this.programs.default),
            light: new UberMaterial(device, this.programs.default),
            red: new UberMaterial(device, this.programs.default),
            orange: new UberMaterial(device, this.programs.default),
            yellow: new UberMaterial(device, this.programs.default),
            green: new UberMaterial(device, this.programs.default),
            blue: new UberMaterial(device, this.programs.default),
            purple: new UberMaterial(device, this.programs.default),
            white: new UberMaterial(device, this.programs.default),
            gray: new UberMaterial(device, this.programs.default),
            black: new UberMaterial(device, this.programs.default)
        }
        for (var key in this.materials) {
            (this.materials as any)[key].albedoTexture = this.textures.default;
            (this.materials as any)[key].metallicTexture = this.textures.default;
            (this.materials as any)[key].roughnessTexture = this.textures.default;
        }
        this.materials.background.albedoColor = ColorScheme.background
        this.materials.default.albedoColor = ColorScheme.default
        this.materials.focus.albedoColor = ColorScheme.focus
        this.materials.dark.albedoColor = ColorScheme.dark
        this.materials.light.albedoColor = ColorScheme.light
        this.materials.red.albedoColor = ColorScheme.red
        this.materials.orange.albedoColor = ColorScheme.orange
        this.materials.yellow.albedoColor = ColorScheme.yellow
        this.materials.green.albedoColor = ColorScheme.green
        this.materials.blue.albedoColor = ColorScheme.blue
        this.materials.purple.albedoColor = ColorScheme.purple
        this.materials.white.albedoColor = ColorScheme.white
        this.materials.gray.albedoColor = ColorScheme.gray
        this.materials.black.albedoColor = ColorScheme.black

        this.vertexAttributes = {
            cube: DefaultVertexData.createCubeVertexData(device),
            plane: DefaultVertexData.createVerticlePlaneVertexData(device),
            verticlePlane: DefaultVertexData.createVerticlePlaneVertexData(device),
            sphere: DefaultVertexData.createSphereVertexData(device)
        }

    }

    createMaterial(device: GPUDevice) {
        var mat = new UberMaterial(device, this.programs.default)
        mat.albedoTexture = this.textures.default;
        mat.metallicTexture = this.textures.default;
        mat.roughnessTexture = this.textures.default;
        return mat;
    }

    dispose() {
        for (let x of Object.values(this.textures)) {
            x.dispose()
        }
        for (let x of Object.values(this.vertexAttributes)) {
            x.dispose()
        }
        for (let x of Object.values(this.programs)) {
            x.dispose()
        }
    }
}