import { OimoPhysicsWorld } from "./oimoPhysicsWorld";
// @ts-ignore
import * as OIMO from "oimo"
import { TransformNode } from "../../sceneGraph/transformNode";

export class OimoRigidBody {
    body: OIMO.body

    constructor(public object: TransformNode, world: OimoPhysicsWorld, options: OIMO.IBodyOptions) {
        this.body = world.world.add(options);
        world.addComponent(this)
    }

    onObjectSet() {
        this.updateFromObject()
    }

    updateFromObject() {
        //console.log(this.body)
        this.body.position.x = this.object.position.x
        this.body.position.y = this.object.position.y
        this.body.position.z = this.object.position.z

        this.body.orientation.x = this.object.rotation.x
        this.body.orientation.y = this.object.rotation.y
        this.body.orientation.z = this.object.rotation.z
        this.body.orientation.w = this.object.rotation.w
        this.body.syncShapes();
    }

    updateToObject() {
        this.object.position.x = this.body.position.x
        this.object.position.y = this.body.position.y
        this.object.position.z = this.body.position.z

        this.object.rotation.x = this.body.orientation.x
        this.object.rotation.y = this.body.orientation.y
        this.object.rotation.z = this.body.orientation.z
        this.object.rotation.w = this.body.orientation.w
    }
}