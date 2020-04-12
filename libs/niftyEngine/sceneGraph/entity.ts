export class Entity {
    components: { [componentName: string]: Array<any> } = {};

    addComponent(component: Function) {
        if (!this.components[component.name]) {
            this.components[component.name] = []
        }
        this.components[component.name].push(component)
    }

    getComponent<T>(component: Function): T | undefined {
        var list = this.getComponents<T>(component);
        return list != undefined ? list[0] : undefined
    }
    getComponents<T>(component: Function): Array<T> | undefined {
        return this.components[component.name] as Array<T>
    }
}