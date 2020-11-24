"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregate = exports.count = exports.removeAll = exports.remove = exports.get = exports.updateAll = exports.update = exports.search = exports.createAll = exports.create = exports.BaseModel = void 0;
const noniMongo = require("@quenk/noni-mongodb/lib/database/collection");
const future_1 = require("@quenk/noni/lib/control/monad/future");
const record_1 = require("@quenk/noni/lib/data/record");
/**
 * BaseModel provides a base implementation for making Model classes from
 * this library.
 */
class BaseModel {
    constructor(database, collection) {
        this.database = database;
        this.collection = collection;
        this.refs = [];
    }
    create(data) {
        return exports.create(this, data);
    }
    createAll(data) {
        return exports.createAll(this, data);
    }
    search(filter, opts) {
        return exports.search(this, filter, opts, this.refs);
    }
    update(id, changes, qry, opts) {
        return exports.update(this, id, changes, qry, opts);
    }
    updateAll(qry, changes, opts) {
        return exports.updateAll(this, qry, changes, opts);
    }
    get(id, qry, opts) {
        return exports.get(this, id, qry, opts, this.refs);
    }
    remove(id, qry, opts) {
        return exports.remove(this, id, qry, opts);
    }
    removeAll(qry, opts) {
        return exports.removeAll(this, qry, opts);
    }
    count(qry) {
        return exports.count(this, qry);
    }
    aggregate(pipeline, opts) {
        return exports.aggregate(this, pipeline, opts);
    }
}
exports.BaseModel = BaseModel;
const getIdQry = (model, id, qry) => {
    let idQry = {
        $or: [
            { [model.id]: id },
            { [model.id]: Number(id) }
        ]
    };
    return record_1.empty(qry) ? idQry : { $and: [idQry, qry] };
};
/**
 * create a new document using a Model.
 */
const create = (model, data) => future_1.doFuture(function* () {
    let result = yield noniMongo.insertOne(model.collection, data);
    let qry = { _id: result.insertedId };
    let mDoc = yield noniMongo.findOne(model.collection, qry);
    return mDoc.isJust() ?
        future_1.pure(mDoc.get()[model.id]) :
        future_1.raise(new Error('create(): Could not retrieve ' +
            'target document!'));
});
exports.create = create;
/**
 * createAll creates more than one document.
 *
 * Note: this is not an atomic operation.
 */
const createAll = (model, data) => future_1.doFuture(function* () {
    let result = yield noniMongo.insertMany(model.collection, data);
    let qry = { _id: { $in: record_1.mapTo(result.insertedIds, id => id) } };
    let opts = { projection: { [model.id]: 1 } };
    let results = yield noniMongo.find(model.collection, qry, opts);
    if (results.length !== data.length)
        return future_1.raise(new Error('createBulk(): ' +
            'Some documents were not created!'));
    return future_1.pure(results.map((r) => r[model.id]));
});
exports.createAll = createAll;
/**
 * search the Model's collection for documents matching the query.
 */
const search = (model, qry, opts = {}, refs = []) => future_1.doFuture(function* () {
    let actualOpts = record_1.rmerge({ projection: { _id: false } }, opts);
    let results = yield noniMongo.find(model.collection, qry, actualOpts);
    for (let i = 0; i < refs.length; i++) {
        let [colname, lkey, fkey, fields] = refs[i];
        let col = model.database.collection(colname);
        results = yield noniMongo.populateN(col, [lkey, fkey], results, fields);
    }
    return future_1.pure(results);
});
exports.search = search;
/**
 * update a single document in the Model's collection given its id.
 *
 * The operation takes place using the $set operator. Additional query
 * parameters can be supplied to affect the query via the qry parameter.
 *
 * @returns - true if any single document matched the query.
 */
const update = (model, id, changes, qry = {}, opts = {}) => {
    let spec = { $set: changes };
    let actualQry = getIdQry(model, id, qry);
    return noniMongo.updateOne(model.collection, actualQry, spec, opts)
        .map(r => r.matchedCount > 0);
};
exports.update = update;
/**
 * updateAll documents in the Model's collection that match the query.
 *
 * Uses $set just like update()
 * @returns - The number of documents that matched the query.
 */
const updateAll = (model, qry = {}, changes, opts = {}) => {
    let spec = { $set: changes };
    return noniMongo.updateMany(model.collection, qry, spec, opts)
        .map(r => r.matchedCount);
};
exports.updateAll = updateAll;
/**
 * get a single document from a Model's collection.
 *
 * If refs is specified, each one will be merged into the document.
 * Use sparingly.
 */
const get = (model, id, qry = {}, opts = {}, refs = []) => future_1.doFuture(function* () {
    let actualQry = getIdQry(model, id, qry);
    let mHit = yield noniMongo.findOne(model.collection, actualQry, opts);
    if (mHit.isNothing())
        return future_1.pure(mHit);
    for (let i = 0; i < refs.length; i++) {
        let [colname, lkey, fkey, fields] = refs[i];
        let col = model.database.collection(colname);
        mHit = yield noniMongo.populate(col, [lkey, fkey], mHit, fields);
    }
    return future_1.pure(mHit);
});
exports.get = get;
/**
 * remove a single document by id from a Model's collection.
 */
const remove = (model, id, qry = {}, opts = {}) => {
    let actualQry = getIdQry(model, id, qry);
    return noniMongo.deleteOne(model.collection, actualQry, opts)
        .map(r => r.deletedCount > 0);
};
exports.remove = remove;
/**
 * removeAll documents from a Model's collection that match the specified
 * query.
 */
const removeAll = (model, qry = {}, opts = {}) => noniMongo.deleteMany(model.collection, qry, opts)
    .map(r => r.deletedCount);
exports.removeAll = removeAll;
/**
 * count the documents in a Model's collection that match the specified query.
 */
const count = (model, qry, opts = {}) => noniMongo.count(model.collection, qry, opts);
exports.count = count;
/**
 * aggregate runs an aggregation pipeline on a Model's collection.
 */
const aggregate = (model, pipeline, opts = {}) => noniMongo.aggregate(model.collection, pipeline, opts);
exports.aggregate = aggregate;
//# sourceMappingURL=index.js.map