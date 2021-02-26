import { PointerBehavior } from "../Behavior/pointerBehavior";
import { Mesh } from "../../niftyEngine/sceneGraph/mesh";
import { UberMaterial } from "../../niftyEngine/prototype/uberShader/uberMaterial";
import { GPUDevice } from "../../niftyEngine/gfx/gpuDevice";
import { UIAssets } from "./uiAssets";
import { CanvasTexture } from "../../niftyEngine/prototype/canvasTexture";

export class Button {
    pointerEvent = new PointerBehavior()
    mesh: Mesh<UberMaterial>
    canvasTexture: CanvasTexture
    constructor() {

    }

    static async CreateWithText(device: GPUDevice, text: string) {
        var assets = await UIAssets.GetAssets(device)
        var ret = new Button()
        ret.mesh = new Mesh<UberMaterial>(assets.vertexAttributes.plane, assets.createMaterial(device))
        ret.canvasTexture = new CanvasTexture(device, document.createElement('canvas'))

        ret.mesh.material.albedoTexture = ret.canvasTexture.texture

        ret.canvasTexture.canvas.width = 512 * 2
        ret.canvasTexture.canvas.height = 128 * 2
        ret.mesh.scale.x *= ret.canvasTexture.canvas.width / ret.canvasTexture.canvas.height



        ret.pointerEvent.onHoverChanged = (hovered) => {
            if (!hovered) {
                var size = 50 * 2
                ret.canvasTexture.context.fillStyle = '#2c3e50';
                ret.canvasTexture.context.fillRect(0, 0, ret.canvasTexture.canvas.width, ret.canvasTexture.canvas.height)

                ret.canvasTexture.context.fillStyle = '#ecf0f1';
                ret.canvasTexture.context.font = size + 'px serif';
                var dim = ret.canvasTexture.context.measureText("M")
                ret.canvasTexture.context.fillText(text, 10, (ret.canvasTexture.canvas.height / 2) + (dim.width / 2));
                ret.canvasTexture.update()
            } else {
                var size = 50 * 2
                ret.canvasTexture.context.fillStyle = '#5c7e70';
                ret.canvasTexture.context.fillRect(0, 0, ret.canvasTexture.canvas.width, ret.canvasTexture.canvas.height)

                ret.canvasTexture.context.fillStyle = '#ecf0f1';
                ret.canvasTexture.context.font = size + 'px serif';
                var dim = ret.canvasTexture.context.measureText("M")
                ret.canvasTexture.context.fillText(text, 10, (ret.canvasTexture.canvas.height / 2) + (dim.width / 2));
                ret.canvasTexture.update()
            }
        }
        ret.pointerEvent.onHoverChanged(false)


        return ret
    }
}