import { AppSpec } from "./appSpec";
//import { NiftyOS } from "../niftyOS/niftyOS";

export class NiftyReality {
    private static getOS() {
        var global = window as any;
        return global._niftyOS as any;
        //return NiftyOS.GetOS()
    }
    static registerApp(options: AppSpec) {
        this.getOS().registerApp(options)
    }
}