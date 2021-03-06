'use strict';

const assert    = require('assert');

// enable overriding
let router    = require('./routers/project');
let Project   = require('./models/project');

let DEFAULT_API_HOST = 'localhost';
let DEFAULT_API_PORT = 3000;

let wrapper = {
    registered: false,

    /**
     * Configuration for api connections
     * @param  {Object} opts
     */
    config: (opts) => {
        var opts = opts || {};

        let host = opts.host || DEFAULT_API_HOST;
        let port = opts.port || DEFAULT_API_PORT;

        wrapper.registered = router.bind(host, port);
    },

    /**
     * Creates new Project object, saves to server's database
     * @param  {Object} data  Plain object for project
     * @return {Promise} 
     */
    create: (data) => {

        // return promise
        return new Promise((resolve, reject) => {
            if (!wrapper.registered) return reject(new Error('[error] call config method first'));

            // setup default params
            data = data || {};

            // check for emptiness plain values
            try {
                assert( data.template );
                assert( data.composition );
            } catch (err) {
                return reject(new Error('[error] provide project properties'));
            } 

            // and arrays
            data.assets      = data.assets      || [];
            data.settings    = data.settings    || {};
            data.actions     = data.actions     || [];

            // request creation
            router.create(data, (err, res, data) => {

                // parse json
                if (typeof data === 'string') data = JSON.parse(data);
                
                // verify
                if (!err && data && data.template && res.statusCode === 200) {
                    return resolve( new Project(data, wrapper) );
                }

                // notify about error
                reject( err || res.statusMessage );
            });
        });
    },

    /**
     * Get single or multiple entities of Project
     * @optional @param {Number} id 
     * @return {Promise}
     */
    get: (id) => {
        // return promise
        return new Promise((resolve, reject) => {
            if (!wrapper.registered) return reject(new Error('[error] call config method first'));

            // if id provided
            if (id) {
                // return single
                router.get(id, (err, res, data) => {
                    // parse json
                    if (typeof data === 'string') data = JSON.parse(data);

                    // verify || notify about error
                    return (err || res.statusCode !== 200) ? reject(err || res.statusMessage) : resolve( new Project(data, wrapper) );
                });
            } else {

                // return multiple
                router.getAll((err, res, data) => {
                    if (!res || res.statusCode !== 200) return reject( new Error('Error occured during getting list of projects') );

                    // read json
                    let results = []; if (typeof data === 'string') data = JSON.parse(data);

                    // iterate and create objects
                    for (let obj of data) {
                        results.push( new Project( obj, wrapper ) );
                    } 

                    resolve(results);
                });
            }
        });
    },

    /**
     * Update object on server
     * @param  {Object || Project} object
     * @return {Promise}
     */
    update: (object) => {
        let uobj = object;

        if (object instanceof Project) {
            uobj = object.serialize();
        }

        return new Promise((resolve, reject) => {
            if (!wrapper.registered) return reject(new Error('[error] call config method first'));

            router.update(object.uid, uobj, (err, res, data) => {

                // parse json
                if (typeof data === 'string') data = JSON.parse(data);

                // verify
                if (!err && data && data.template && res.statusCode === 200) {
                    if (object instanceof Project) {
                        return resolve( object.deserialize(data) );
                    } else {
                        return resolve( new Project(data, wrapper) );
                    }
                }

                // notify about error
                reject( err || res.statusMessage );
            });
        });
    },

    /**
     * Remove object from server
     * @param  {Number} id project uid
     * @return {Promise}
     */
    remove: (id) => {
        return new Promise((resolve, reject) => {
            if (!wrapper.registered) return reject(new Error('[error] call config method first'));

            router.remove(id, (err, res, data) => {

                // parse json
                if (typeof data === 'string') data = JSON.parse(data);

                // verify || notify about error
                return (err || res.statusCode !== 200) ? reject(err || res.statusMessage) : resolve(data);
            });;
        });
    }
};

module.exports = wrapper;
