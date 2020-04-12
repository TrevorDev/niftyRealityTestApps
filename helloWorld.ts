

import { NiftyReality } from "./libs/niftyReality/niftyReality";
import { App } from "./libs/niftyReality/app";

import { Light } from "./libs/niftyEngine/sceneGraph/light";
import { Mesh } from "./libs/niftyEngine/sceneGraph/mesh";
import { TransformNode } from "./libs/niftyEngine/sceneGraph/transformNode";
import { UberMaterial } from "./libs/niftyEngine/prototype/uberShader/uberMaterial";
import { Vector3 } from "./libs/niftyEngine/math/vector3";
import { XRHead } from "./libs/niftyEngine/prototype/xr/xrHead";
import { GLBLoader } from "./libs/niftyEngine/fileLoaders/glbLoader";
import { GPUDevice } from "./libs/niftyEngine/gfx/gpuDevice";
import { DefaultVertexData } from "./libs/niftyEngine/prototype/defaultVertexData";
import { UberProgram } from "./libs/niftyEngine/prototype/uberShader/uberProgram";
import { Texture } from "./libs/niftyEngine/gfx/texture";
import { Color } from "./libs/niftyEngine/math/color";
import { Matrix4 } from "./libs/niftyEngine/math/matrix4";

NiftyReality.registerApp({
    appName: "Hello World",
    iconImage: "",
    create: async (app: App) => {
        var assetRoot = "http://localhost:5000"

        // Create gpu device
        var device = new GPUDevice(NiftyReality.getWebGLContext())

        // Load assets
        var cubeGeom = DefaultVertexData.createCubeVertexData(device)
        var shaderProgram = new UberProgram(device)
        shaderProgram.updateDefines({ LIGHT_COUNT: 1, ALBEDO_ONLY: 1, COLOR_ATTRIBUTE: 0, MULTIVIEW_COUNT: 2 })
        shaderProgram.compile()
        shaderProgram.createUniforms()
        var defaultTexture = Texture.createFromeSource(device, [
            0, 0, 0, 255
        ])
        var redMat = new UberMaterial(device, shaderProgram)
        redMat.albedoTexture = defaultTexture
        redMat.metallicTexture = defaultTexture
        redMat.roughnessTexture = defaultTexture
        redMat.albedoColor = new Color(0.1, 0.2, 0.3, 1)

        // Lights, camera, meshes
        var light = new Light();

        var dualEyeCamera = new XRHead()

        var meshRed = new Mesh(cubeGeom, redMat);
        meshRed.scale.scaleInPlace(0.3)
        meshRed.position.set(0, meshRed.scale.y / 2, 0)

        var nodes = [meshRed]
        var lights = [light]

        // Load 3D model
        var loadedObject = (await GLBLoader.load(device, assetRoot + "/public/fox.glb"))[0]
        loadedObject.scale.scaleInPlace(0.01)
        loadedObject.position.y = 0.5
        meshRed.addChild(loadedObject)
        var eulerRotation = new Vector3()

        var anchorMatrix = new Matrix4()
        // Render loop
        app.update = (curtime, delta) => {
            // Rotate the fox
            eulerRotation.y += delta / 1000 * Math.PI
            loadedObject.rotation.fromEuler(eulerRotation)

            // Get all data that is required to render (eye position, controllers, etc)
            var frame = app.getCurrentFrame()

            // Bind to framebuffer and clear (This is the frame that will get merged with all other apps in niftykick's world)
            device.gl.bindFramebuffer(device.gl.DRAW_FRAMEBUFFER, frame.framebuffer)
            device.gl.viewport(0, 0, frame.framebufferWidth, frame.framebufferHeight);
            device.gl.clearColor(0, 0, 0, 0)
            device.gl.clear(device.gl.COLOR_BUFFER_BIT | device.gl.DEPTH_BUFFER_BIT | device.gl.STENCIL_BUFFER_BIT);

            // Set eye in app space before rendering
            anchorMatrix.copyFromArrayBufferView(frame.anchor)

            dualEyeCamera.leftEye.view.copyFromArrayBufferView(NiftyReality.getInput().head.leftEye.view)
            dualEyeCamera.leftEye.projection.copyFromArrayBufferView(NiftyReality.getInput().head.leftEye.projection)
            dualEyeCamera.leftEye.view.inverseToRef(dualEyeCamera.leftEye.worldMatrix)

            dualEyeCamera.rightEye.view.copyFromArrayBufferView(NiftyReality.getInput().head.rightEye.view)
            dualEyeCamera.rightEye.projection.copyFromArrayBufferView(NiftyReality.getInput().head.rightEye.projection)
            dualEyeCamera.rightEye.view.inverseToRef(dualEyeCamera.rightEye.worldMatrix)

            dualEyeCamera.leftEye.view.multiplyToRef(anchorMatrix, dualEyeCamera.leftEye.view)
            dualEyeCamera.rightEye.view.multiplyToRef(anchorMatrix, dualEyeCamera.rightEye.view)

            // Render to framebuffer
            lights.forEach((l) => {
                l.computeWorldMatrix()
            })
            nodes.forEach((m) => {
                // Render each node in the node tree
                TransformNode.depthFirstIterate(m, (node) => {
                    node.computeWorldMatrix(false)

                    var mesh = node as Mesh<UberMaterial>;
                    if (mesh.material && mesh.vertData) {
                        var material = mesh.material

                        // Load material program
                        material.program.load()
                        material.program.updateFromCamera(dualEyeCamera.cameras)
                        material.program.updateForLights(lights)

                        // Load material instance specific data
                        material.updateUniforms()
                        material.program.updateAndDrawForMesh(mesh)
                    }

                })
            })

            app.dispose = () => {
                defaultTexture.dispose()
                cubeGeom.dispose()
                shaderProgram.dispose()
            }
        }
    }
})
