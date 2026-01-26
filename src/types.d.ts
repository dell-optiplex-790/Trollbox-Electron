declare global {

    interface Block {
        home: string;
        comment: string;
    }
    
    interface ConfigObj {
        nick?: string;
        color?: string;
        blocks?: Array<Block>;
        embedImages?: boolean;
        embedYoutube?: boolean;
        font?: string;
        debug?: boolean;
        server?: string;
    } 
    
}


export {};