import { SimpleAssetPack } from "../../niftyEngine/prototype/simpleAssetPack"
import { GPUDevice } from "../../niftyEngine/gfx/gpuDevice"

export class UIAssets {
    static assets: SimpleAssetPack
    static async GetAssets(device: GPUDevice) {
        if (!this.assets) {
            this.assets = new SimpleAssetPack()
            await this.assets.load(device)
        }
        return this.assets
    }
}