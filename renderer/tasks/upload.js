'use strict';
const s3        = require('s3');
const path      = require('path');
const fs        = require('fs-extra');
const key       = 'AKIAILSDJGVYT72EUVWQ';
const secret    = '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';

const RESULTS_DIR = process.env.RESULTS_DIR || 'results';

/**
 * actions is a backward compability term
 * currently only means a synomym for 
 * "moving files from temp dir to results dir"
 */
module.exports = function(project) {
    return new Promise((resolve, reject) => {
        
        console.info(`[${project.uid}] uploading project...`);

        // let src = path.join( project.workpath, project.resultname );
        let src = path.join( RESULTS_DIR, project.uid + '_' + project.resultname ).replace('mov', 'mp4');
        var dest = project.uid + '_' + project.resultname.replace('mov', 'mp4');

        var client = s3.createClient({
            maxAsyncS3: 20,     // this is the default 
            s3RetryCount: 3,    // this is the default 
            s3RetryDelay: 1000, // this is the default 
            multipartUploadThreshold: 262144000, // this is the default (20 MB) (updated 250MB) 
            multipartUploadSize: 15728640, // this is the default (15 MB) 
            s3Options: {
                accessKeyId: key,
                secretAccessKey: secret,
                // any other options are passed to new AWS.S3() 
                // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property 
            },
        });

        var params = {
            localFile: src,
            
            s3Params: {
                Bucket: "around-videos",
                Key: dest,
                ACL: 'public-read',
                StorageClass: 'REDUCED_REDUNDANCY'
                // other options supported by putObject, except Body and ContentLength. 
                // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property 
            },
        };

        var uploader = client.uploadFile(params);
            uploader.on('error', function(err) {
            console.info("unable to upload:", err.stack);
            return reject(new Error('Unable to upload to s3'));
        });

        uploader.on('progress', function() {
            console.info("progress", uploader.progressMd5Amount,uploader.progressAmount, uploader.progressTotal);
        });

        uploader.on('end', function(err) {
            console.info(`[${project.uid}] upload to s3 complete ...`);
            project.uploadUrl = 'https://s3.amazonaws.com/around-videos/'+src;
                fs.unlink(src, (err) => {
                    console.info(`[${project.uid}] deleting old file...`);
                    return (err) ? reject(err) : resolve(project);
            });
        });
    });
};

