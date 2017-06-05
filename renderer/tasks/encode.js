'use strict';
const hbjs      = require('handbrake-js');
const path      = require('path');
const fs        = require('fs-extra');

const RESULTS_DIR = process.env.RESULTS_DIR || 'results';

/**
 * actions is a backward compability term
 * currently only means a synomym for 
 * "moving files from temp dir to results dir"
 */
module.exports = function(project) {
    return new Promise((resolve, reject) => {
        
        console.info(`[${project.uid}] converting project...`);

        // let src = path.join( project.workpath, project.resultname );
        let src = path.join( RESULTS_DIR, project.uid + '_' + project.resultname );

        var dest = src.replace('mov', 'mp4');

        hbjs.spawn({ input: src, output: dest })
        .on('error', function(err){
            return reject(new Error('Error converting to mp4, did project rendered properly?'));
        })
        .on('progress', function(progress){
            console.info(
            'Percent complete: %s, ETA: %s',
            progress.percentComplete,
            progress.eta
            );
        }).on('complete', function(){

            fs.unlink(src, (err) => {
                console.info(`[${project.uid}] deleting old file...`);
                return (err) ? reject(err) : resolve(project);
            });

        })
    });
};
