class Config {
    constructor(cfg: ConfigObj) {
        this.nick = cfg.nick ?? "anonymous";
        this.color = cfg.color ?? "white";
        this.blocks = cfg.blocks ?? [];
        this.embedImages = cfg.embedImages ?? false;
        this.embedYoutube = cfg.embedYoutube ?? false;
        this.font = cfg.font ?? "Comic Mono";
        this.debug = cfg.debug ?? false;
        this.server = cfg.server ?? 'ws://www.windows93.net:8081'
        this.extraData = cfg.extraData ? {
            bio: cfg.extraData.bio ?? ''
        } : { bio: '' }
    };
    nick: string;
    color: string;
    blocks: Array<Block>;
    embedImages: boolean;
    embedYoutube: boolean;
    font: string;
    debug: boolean;
    server: string;
    extraData: {
        bio: string;
    }   
};

class Block {
    constructor(home: string, comment: string) {
        this.home = home;
        this.comment = comment;
    };
    home: string;
    comment: string;
};

export { Config, Block };