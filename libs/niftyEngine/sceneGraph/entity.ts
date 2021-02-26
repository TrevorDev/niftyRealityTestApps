export class Entity {
    private components_: { [componentName: string]: Array<any> } = {};

    addComponent(component: Function) {
        if (!this.components_[component.name]) {
            this.components_[component.name] = []
        }
        this.components_[component.name].push(component)
    }

    getComponent<T>(component: Function): T | undefined {
        var list = this.getComponents<T>(component);
        return list != undefined ? list[0] : undefined
    }
    getComponents<T>(component: Function): Array<T> | undefined {
        return this.components_[component.name] as Array<T>
    }
}