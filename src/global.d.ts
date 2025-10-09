declare global {
    interface Window {
        electronAPI: {
            socketReceive<T>(callback: (value: T) => void): void;
            recieveConfig: (callback: Function) => void;
            socketRecieve_callback: ((callback: Function) => void) | undefined;
            recieveConfig_callback: ((callback: Function) => void) | undefined;
            writeConfig: (config: Config) => void;
            copy: (text: string) => void;
            socketEmit: (event: string, ...data: any) => void;
            getConfig: () => void;
        };
    }
}

export {};