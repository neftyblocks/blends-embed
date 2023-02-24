export * from './assets';

export const dispatch = (name: string, detail: any, component: any) => {
    component.dispatchEvent(
        new CustomEvent(name, {
            detail,
            composed: true, // propagate across the shadow DOM
        })
    );
};
