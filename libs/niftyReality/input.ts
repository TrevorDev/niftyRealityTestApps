export class InputController {
    world = new Float32Array(16)
    triggerButton = { value: 0 }
    aButton = { value: 0 }
    bButton = { value: 0 }
    mainJoystick = { x: 0, y: 0 }
    connected = false
}

export class Input {
    head = {
        world: new Float32Array(16),
        leftEye: {
            view: new Float32Array(16),
            projection: new Float32Array(16)
        },
        rightEye: {
            view: new Float32Array(16),
            projection: new Float32Array(16)
        }
    }

    controllers = {
        left: new InputController(),
        right: new InputController()
    }
}