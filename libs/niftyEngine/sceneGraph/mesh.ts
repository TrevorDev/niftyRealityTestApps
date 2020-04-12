import { TransformNode } from "./transformNode";
import { VertexData } from "../gfx/vertexData";

export class Mesh<MaterialType> extends TransformNode {
    constructor(public vertData: VertexData, public material: MaterialType) {
        super()
    }
}