import { App } from "./libs/niftyReality/app"
import { Mesh } from "./libs/niftyEngine/sceneGraph/mesh";
import { Vector3 } from "./libs/niftyEngine/math/vector3";
import { NiftyReality } from "./libs/niftyReality/niftyReality";
import { GPUDevice } from "./libs/niftyEngine/gfx/gpuDevice";
import { SimpleAssetPack } from "./libs/niftyEngine/prototype/simpleAssetPack";
import { Stage } from "./libs/niftyRealityAppHelpers/stage";
import { Ray } from "./libs/niftyEngine/math/ray";
import { Hit, HitResult } from "./libs/niftyEngine/prototype/hit";
import { InstancedRenderer } from "./libs/niftyEngine/prototype/instancedRenderer";


NiftyReality.registerApp({
    appName: "Hello World",
    iconImage: "/public/img/demoBlocks.png",
    create: async (app: App) => {
        var tmpVector = new Vector3()

        // Create rendering stage
        var stage = new Stage(new GPUDevice(app.getCurrentFrame().glContext))
        stage.lights[0].rotation.fromDirection(-1, -1, -1)

        // Load assets
        var assets = new SimpleAssetPack()
        await assets.load(stage.device)

        // Create mesh
        var mesh = new Mesh(assets.vertexAttributes.cube, assets.materials.blue);
        mesh.scale.scaleInPlace(0.3)
        mesh.position.set(0, mesh.scale.y, 0)
        stage.nodes.push(mesh)

        // Create bullets
        var maxBullets = 5
        var instancedRenderer = new InstancedRenderer(stage.device, maxBullets)
        var bullets = new Array<{ mesh?: Mesh<any>, dir: Vector3 }>()
        for (var i = 0; i < maxBullets; i++) {
            bullets.push({ mesh: undefined, dir: new Vector3() })
        }
        var nextBulletIndex = 0;

        // Render loop
        app.update = (curtime, delta) => {
            // Update stage
            stage.updateFromFrame(app.getCurrentFrame())

            // Update and render regular mesh
            mesh.rotation.fromEuler(curtime / 500, curtime / 1000, 0)
            stage.render()

            if (!stage.currentFrame.appFocused) {
                return
            }

            // Spawn bullet when trigger is pressed
            for (var c of stage.controllers) {
                if (c.primaryButton.justDown) {
                    var bullet = bullets[nextBulletIndex++ % maxBullets]
                    if (!bullet.mesh) {
                        bullet.mesh = instancedRenderer.createInstance()!
                        bullet.mesh.material.color.set(0.8, 0.2, 0.2)
                        bullet.mesh.scale.scaleInPlace(0.1)
                    }
                    var ray = c.getRay()
                    bullet.dir.copyFrom(ray.direction)
                    bullet.mesh.position.copyFrom(ray.origin)
                    bullet.mesh.computeWorldMatrix()
                }
            }

            // Move bullets
            for (var bullet of bullets) {
                tmpVector.copyFrom(bullet.dir)
                tmpVector.scaleInPlace(delta / 50)
                if (bullet.mesh) {
                    bullet.mesh.position.addToRef(tmpVector, bullet.mesh.position)
                    bullet.mesh.computeWorldMatrix()
                }
            }

            instancedRenderer.render(stage.camera, stage.lights)
        }

        // Tell niftyreality if this app has been hit by a ray
        var ray = new Ray()
        var result = new HitResult()
        app.castRay = (world) => {
            stage.rayInAppSpaceFromWorldRayMatrixToRef(world, ray)
            result.reset()
            var minDist = Infinity
            for (var node of stage.nodes) {
                Hit.rayIntersectsMesh(ray, node, result)
                if (result.hitDistance && result.hitDistance < minDist) {
                    minDist = result.hitDistance
                }
            }

            return minDist
        }

        app.dispose = () => {
            assets.dispose()
        }
    }
})
