export * from './animations';
export * from './transaction';
export * from './format';
export * from './extractors';
export * from './matchers';
export * from './sorters';

export const dispatch = (name: string, detail: any, component: any, composed = true) => {
    component.dispatchEvent(
        new CustomEvent(name, {
            detail,
            composed, // propagate across the shadow DOM
        }),
    );
};
