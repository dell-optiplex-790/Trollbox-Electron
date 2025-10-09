declare global {

    interface Block {
        home: string;
        comment: string;
    }
    
    interface Config {
        nick: string;
        color: string;
        blocks: Array<Block>;
        embedImages: Boolean;
        embedYoutube: Boolean;
        font: string | undefined;
        debug: Boolean;
        server: string;
    } 
    
}


export {};