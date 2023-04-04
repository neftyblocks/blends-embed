import { useCountDown, useTokenDisplay } from '@nefty/use';

export const priceForInput = (amount: string | number, precision = 8) => {
    return +amount / Math.pow(10, precision);
};

export const formatTokenWithoutSymbol = (selection: string, precision = 8) => {
    const [tokenValue] = selection.split(' ');

    return useTokenDisplay(tokenValue, precision);
};

export const displayTime = (start_time, end_time, now) => {
    const countdownStart = useCountDown(start_time, now);
    const countdownEnd = useCountDown(end_time, now);

    if (start_time !== 0) {
        if (countdownStart === '0') {
            if (+end_time !== 0) {
                if (countdownEnd === '0') return 'ended';
                else return `ending in ${countdownEnd}`;
            } else return 'live';
        } else return `live in ${countdownStart}`;
    }
};

export const displayStatus = (status: string) => {
    return status.split('-').join(' ');
};
