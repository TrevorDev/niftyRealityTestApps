export class Loop {
    private running = true
    private stopResolve: Function
    constructor(repeater: Function, fn: Function) {
        // Params are for time and xrFrame (required to be passed from xr)
        // TODO maybes use arguments keyword to pass all args if there are more
        var loop = (a: any, b: any) => {
            if (this.running) {
                repeater(loop)
            } else {
                this.stopResolve()
            }
            fn(a, b)
        }
        repeater(loop)
    }
    stop() {
        return new Promise((res) => {
            this.stopResolve = res
            this.running = false;
        })
    }
}