import { Vector3 } from "../niftyEngine/math/vector3"
import { Color } from "../niftyEngine/math/color"

export class VoxelFile {
    size = 0.03
    voxels = new Array<{ position: Vector3, color: Color }>()
}

export class Bootup {
    worldGlb?: string
}

export class Filesystem {
    storage: Storage
    constructor(private folder = "") {
        this.storage = window.localStorage
    }

    saveVoxelFile(file: VoxelFile) {
        this.storage.voxelFile = JSON.stringify(file)
        console.log(this.storage)
    }

    getVoxelFile() {
        if (!this.storage.voxelFile) {
            return null
        } else {
            return JSON.parse(this.storage.voxelFile) as VoxelFile
        }
    }

    getFile(name: string) {
        if (!this.storage[this.folder + name]) {
            return null
        } else {
            return JSON.parse(this.storage[this.folder + name])
        }
    }
    saveFile(name: string, file: any) {
        this.storage[this.folder + name] = JSON.stringify(file)
    }
}