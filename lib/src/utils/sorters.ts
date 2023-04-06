export const sortedRequirements = (requirements: any): any[] => {
    const list = Object.values(requirements);

    list.sort((a, b) => {
        if (a.matcher_type === 'balance') return -1;
        if (b.matcher_type === 'balance') return 1;

        if (a.matcher_type === 'attributes') return -1;
        if (b.matcher_type === 'attributes') return 1;

        if (a.matcher_type === 'template') return -1;
        if (b.matcher_type === 'template') return 1;

        if (a.matcher_type === 'schema') return -1;
        if (b.matcher_type === 'schema') return 1;

        if (a.matcher_type === 'collection') return -1;
        if (b.matcher_type === 'collection') return 1;

        if (a.matcher_type === 'token') return -1;
        if (b.matcher_type === 'token') return 1;

        return 0;
    });

    return list;
};

export const sortBlends = (blends: any[]): any[] => {
    return blends.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;

        if (a.contract === 'blenderizerx') return 1;
        if (b.contract === 'blenderizerx') return -1;

        return 0;
    });
};
