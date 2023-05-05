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
                else return `ending ${countdownEnd}`;
            } else return 'live';
        } else return `${countdownStart}`;
    }
};

export const displayStatus = (status: string) => {
    return status.split('-').join(' ');
};


//  seconds to days, hours, minutes, seconds
export const secondsToDhms = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);

    const dDisplay = d > 0 ? d + 'D' : '';
    const hDisplay = h > 0 ? h + 'H' : '';
    const mDisplay = m > 0 ? m + 'M' : '';
    const sDisplay = s > 0 ? s + 'S' : '';
    return dDisplay + hDisplay + mDisplay + sDisplay;
}