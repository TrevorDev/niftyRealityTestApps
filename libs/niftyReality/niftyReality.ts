import { AppSpec } from "./appSpec";
//import { NiftyOS } from "../niftyOS";

export class NiftyReality {
    private static getOS() {
        var global = window as any;
        return global._niftyOS as any;
        //return NiftyOS.GetOS()
    }
    static registerApp(options: AppSpec) {
        this.getOS().registerApp(options)
    }
    static getWebGLContext() {
        return this.getOS().device.gl;
    }
    static getInput() {
        return this.getOS().inputManager.input
    }
}