"use strict";

const win_run = '@npx electron .';
const win_install = '@npm i';
const unix_run = '#!/bin/sh\nnpx electron .';
const unix_install = '#!/bin/sh\nnpm i';

module.exports = {
    windows: {
        run: win_run,
        install: win_install
    },
    unix: {
        run: unix_run,
        install: unix_install
    }
}