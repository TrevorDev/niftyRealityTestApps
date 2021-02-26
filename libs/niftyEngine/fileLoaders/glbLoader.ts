import { GPUDevice } from "../gfx/gpuDevice";
import { TransformNode } from "../sceneGraph/transformNode";
import { Mesh } from "../sceneGraph/mesh";
import { Texture } from "../gfx/texture";
import { Color } from "../math/color";
import { UberProgram } from "../prototype/uberShader/uberProgram";
import { VertexData } from "../gfx/vertexData";
import { UberMaterial, UberMaterialSide } from "../prototype/uberShader/uberMaterial";

// TODO this needs to be rewritten
export class GLBLoader {
    static defaultTexture: Texture
    static BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
    static BINARY_EXTENSION_HEADER_LENGTH = 12;
    static BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };
    static WEBGL_TYPE_SIZES: any = {
        'SCALAR': 1,
        'VEC2': 2,
        'VEC3': 3,
        'VEC4': 4,
        'MAT2': 4,
        'MAT3': 9,
        'MAT4': 16
    };

    static WEBGL_CONSTANTS = {
        FLOAT: 5126,
        //FLOAT_MAT2: 35674,
        FLOAT_MAT3: 35675,
        FLOAT_MAT4: 35676,
        FLOAT_VEC2: 35664,
        FLOAT_VEC3: 35665,
        FLOAT_VEC4: 35666,
        LINEAR: 9729,
        REPEAT: 10497,
        SAMPLER_2D: 35678,
        POINTS: 0,
        LINES: 1,
        LINE_LOOP: 2,
        LINE_STRIP: 3,
        TRIANGLES: 4,
        TRIANGLE_STRIP: 5,
        TRIANGLE_FAN: 6,
        UNSIGNED_BYTE: 5121,
        UNSIGNED_SHORT: 5123
    };

    static WEBGL_COMPONENT_TYPES: any = {
        5120: Int8Array,
        5121: Uint8Array,
        5122: Int16Array,
        5123: Uint16Array,
        5125: Uint32Array,
        5126: Float32Array
    };

    /**
     * Loads glb from url
     * @param filePath url of glb
     */
    static async loadGLBData(filePath: string) {
        // Download file
        var opts = {
            method: 'GET',
            headers: {}
        };
        var res = await fetch(filePath, opts)
        var data = await res.arrayBuffer();

        // Parse header
        var headerView = new DataView(data, 0, this.BINARY_EXTENSION_HEADER_LENGTH)
        var header = {
            type: new TextDecoder("utf-8").decode(new Uint8Array(data.slice(0, 4))),
            version: headerView.getUint32(4, true),
            length: headerView.getUint32(8, true)
        };
        if (header.type != this.BINARY_EXTENSION_HEADER_MAGIC || header.version != 2) {
            throw "invalid glb (gltf 2 file)"
        }

        // Parse json/body
        var content = "";
        var body = new ArrayBuffer(0);
        var chunkView = new DataView(data, this.BINARY_EXTENSION_HEADER_LENGTH);
        var chunkIndex = 0;

        while (chunkIndex < chunkView.byteLength) {

            var chunkLength = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;

            var chunkType = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;

            if (chunkType === this.BINARY_EXTENSION_CHUNK_TYPES.JSON) {

                var contentArray = new Uint8Array(data, this.BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength);
                content = new TextDecoder("utf-8").decode(contentArray);

            } else if (chunkType === this.BINARY_EXTENSION_CHUNK_TYPES.BIN) {

                let byteOffset = this.BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
                body = data.slice(byteOffset, byteOffset + chunkLength);

            }

            // Clients must ignore chunks with unknown types.
            chunkIndex += chunkLength;

        }
        var json = JSON.parse(content);

        return {
            header: header,
            content: json,
            body: body
        }
    }

    /**
     * Loads a glb
     * @param device gpu device
     * @param filePath url of glb
     */
    static async load(device: GPUDevice, filePath: string): Promise<Array<TransformNode>> {
        var glbData = await this.loadGLBData(filePath);

        if (!GLBLoader.defaultTexture) {
            GLBLoader.defaultTexture = Texture.createFromColor(device, new Color(0, 0, 0, 1))
        }

        var loadedScenes = new Array<TransformNode>()
        // console.log(glbData)
        for (var scene of glbData.content.scenes) {
            var loadedScene = new TransformNode()
            loadedScenes.push(loadedScene)

            var loadNode = async (index: number, parent: TransformNode) => {
                let node = glbData.content.nodes[index]
                let loadedNode = new TransformNode()
                parent.addChild(loadedNode)

                if (node.mesh !== undefined) {
                    var mesh = glbData.content.meshes[node.mesh]
                    for (var primitive of mesh.primitives) {
                        if (primitive.mode !== undefined && primitive.mode !== this.WEBGL_CONSTANTS.TRIANGLES) {
                            throw "Not supported primitive mode:" + primitive.mode
                        }
                        var vertAttributes = {
                            a_position: new Array<number>(),
                            a_normal: new Array<number>(),
                            a_color: new Array<number>(),
                            a_texcoord: new Array<number>(),
                            indices: new Array<number>()
                        }
                        if (primitive.indices !== undefined) {
                            // Add indices to attributes as it is loaded the same
                            primitive.attributes["INDICES"] = primitive.indices
                        }
                        for (var attrName in primitive.attributes) {
                            var accessor = glbData.content.accessors[primitive.attributes[attrName]]
                            if (accessor.bufferView === undefined) {
                                throw "Undefined bufferview"
                            }
                            var buffer = glbData.body!
                            var bufferView = glbData.content.bufferViews[accessor.bufferView]

                            var bufferDef = glbData.content.buffers[bufferView.buffer]
                            if (bufferDef.uri !== undefined || bufferView.buffer !== 0) {
                                throw "Non-glb is not supported"
                            }

                            var itemSize = this.WEBGL_TYPE_SIZES[accessor.type];
                            var TypedArray = this.WEBGL_COMPONENT_TYPES[accessor.componentType];
                            var elementBytes = TypedArray.BYTES_PER_ELEMENT;
                            var itemBytes = elementBytes * itemSize;
                            var byteOffset = accessor.byteOffset || 0;
                            var byteStride = accessor.bufferView !== undefined ? bufferView.byteStride : undefined;
                            var normalized = accessor.normalized === true;

                            if (byteStride && byteStride !== itemBytes) {
                                throw "Byte stride not supported"
                            }
                            if (buffer === null) {
                                throw "Not implemented"
                            }

                            // TODO Im not sure what the diff is between bufferView byteOffset and attribute byteOffset
                            var array = new TypedArray(buffer, byteOffset + bufferView.byteOffset, accessor.count * itemSize);

                            if (attrName == "POSITION") {
                                vertAttributes.a_position = array
                            }
                            if (attrName == "TEXCOORD_0") {
                                vertAttributes.a_texcoord = array
                            }
                            if (attrName == "COLOR_0") {
                                vertAttributes.a_color = array
                            }
                            if (attrName == "NORMAL") {
                                vertAttributes.a_normal = array
                            }
                            if (attrName == "INDICES") {
                                vertAttributes.indices = array
                            }

                            //https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/GLTFLoader.js#L2569
                            // TriangleFanDrawMode or strip
                            // indicies not defined https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#indices-and-names
                        }

                        // Load the material for the mesh
                        var loadedProgram: UberProgram | undefined = undefined
                        var loadedMat: UberMaterial | undefined = undefined
                        if (primitive.material !== undefined) {
                            var material = glbData.content.materials[primitive.material]

                            loadedProgram = new UberProgram(device)
                            var defs = { LIGHT_COUNT: 1, ALBEDO_ONLY: 1, COLOR_ATTRIBUTE: vertAttributes.a_color.length > 0 ? 1 : 0 }
                            //var defs = { LIGHT_COUNT: 1, COLOR_ATTRIBUTE: vertAttributes.a_color.length > 0 ? 1 : 0, MULTIVIEW_COUNT: 2 }
                            loadedProgram.updateDefines(defs)
                            loadedProgram.compile()
                            loadedProgram.createUniforms()
                            loadedMat = new UberMaterial(device, loadedProgram)
                            loadedMat.albedoTexture = GLBLoader.defaultTexture;
                            loadedMat.metallicTexture = GLBLoader.defaultTexture;
                            loadedMat.roughnessTexture = GLBLoader.defaultTexture;

                            var baseColorTexture = material.pbrMetallicRoughness.baseColorTexture
                            if (baseColorTexture !== undefined) {
                                var texture = glbData.content.textures[baseColorTexture.index]
                                var src = glbData.content.images[texture.source]

                                var bufferView = glbData.content.bufferViews[src.bufferView]

                                let array = new Uint8Array(glbData.body, bufferView.byteOffset, bufferView.byteLength);
                                var blob = new Blob([array], { type: src.mimeType });
                                var tx = await Texture.createFromeURL(device, URL.createObjectURL(blob))
                                loadedMat.albedoTexture = tx
                            }

                            // TODO use  material.pbrMetallicRoughness.baseColorFactor / other params
                            var baseColor = material.pbrMetallicRoughness.baseColorFactor;
                            if (!baseColorTexture && baseColor) {
                                loadedMat.albedoColor = new Color(baseColor[0], baseColor[1], baseColor[2], baseColor[3])
                            }

                            var metallicRoughnessTexture = material.pbrMetallicRoughness.metallicRoughnessTexture
                            if (metallicRoughnessTexture !== undefined) {
                                var texture = glbData.content.textures[metallicRoughnessTexture.index]
                                var src = glbData.content.images[texture.source]

                                var bufferView = glbData.content.bufferViews[src.bufferView]

                                let array = new Uint8Array(glbData.body, bufferView.byteOffset, bufferView.byteLength);
                                var blob = new Blob([array], { type: src.mimeType });
                                var tx = await Texture.createFromeURL(device, URL.createObjectURL(blob))
                                loadedMat.metallicTexture = tx
                            }
                        }
                        var m = new Mesh(new VertexData(device, vertAttributes), loadedMat)
                        if (loadedMat) {
                            loadedMat.side = UberMaterialSide.DOUBLE_SIDE
                        }
                        loadedNode.addChild(m)
                    }
                }
                if (node.rotation) {
                    loadedNode.rotation.set(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3])
                }
                if (node.translation) {
                    loadedNode.position.set(node.translation[0], node.translation[1], node.translation[2])
                }
                if (node.scale) {
                    loadedNode.scale.set(node.scale[0], node.scale[1], node.scale[2])
                }
                if (node.children) {
                    for (var childIndex of node.children) {
                        loadNode(childIndex, loadedNode)
                    }
                }
            }
            for (var nodeIndex of scene.nodes) {
                loadNode(nodeIndex, loadedScene)
            }
        }
        return loadedScenes
    }
}