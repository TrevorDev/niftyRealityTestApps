export class Button {
    private _value = 0
    private _downThreshold = 0.8
    public justDown = false;
    public justUp = false;
    constructor() {
    }
    get value() {
        return this._value
    }
    get isDown() {
        if (this.value > this._downThreshold) {
            return true
        } else {
            return false
        }
    }
    setValue(val: number) {
        if (val >= this._downThreshold && this._value < this._downThreshold) {
            this._value = val
            this.justDown = true
        } else if (val < this._downThreshold && this._value >= this._downThreshold) {
            this._value = val
            this.justUp = true
        } else {
            this._value = val
        }
    }
    update() {
        this.justDown = false
        this.justUp = false
    }
}