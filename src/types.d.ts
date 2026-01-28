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
        extraData?: ExtraData;
    } 
    
    interface ExtraData {
        bio?: string;
        client?: string; /* expected values: bot, ruxvania, trollbox */
    }
}


export {};