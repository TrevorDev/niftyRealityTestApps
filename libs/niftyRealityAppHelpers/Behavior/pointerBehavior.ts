export class PointerBehavior {
    private isHovered = false;

    /**
     * Triggers onclick event
     */
    click() {
        this.onClick()
    }
    /**
     * Triggers onHoverChanged only if value is different than the current value
     */
    setHovered(value: boolean) {
        if (this.isHovered != value) {
            this.isHovered = value
            this.onHoverChanged(value)
        }
    }

    onClick = () => { }
    onHoverChanged = (value: boolean) => { }
}