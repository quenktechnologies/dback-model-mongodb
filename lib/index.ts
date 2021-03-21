/**
 * This module provides an interface an abstract class for implementing a basic
 * model in application built with tendril and mongodb.
 */
import * as mongo from 'mongodb';
import * as noniMongo from '@quenk/noni-mongodb/lib/database/collection';

import {
    Future,
    pure,
    raise,
    doFuture
} from '@quenk/noni/lib/control/monad/future';
import { Maybe } from '@quenk/noni/lib/data/maybe';
import { Object } from '@quenk/noni/lib/data/jsonx';
import { empty, mapTo, rmerge } from '@quenk/noni/lib/data/record';

/**
 * Id of a document.
 *
 * Can be a string or a number, depends on the needs of the application.
 */
export type Id = string | number;

/**
 * IdMode indicates how the id for a document is generated.
 */
export type IdMode = string;

/**
 * CollectionName is the name of a collection.
 */
export type CollectionName = string;

/**
 * JoinRef specifies information for a manual join that can be used with
 * searches.
 *
 * Use sparingly.
 */
export type JoinRef = [
    CollectionName,
    noniMongo.LocalKey,
    noniMongo.ForeignKey,
    object
];

/**
 * Model provides an API for common CRUD operations on documents in a
 * specific collection.
 *
 * The design here is basic for writing single documents and reading them back
 * from the database. For more advanced tasks, additional methods should be
 * created on implementers.
 */
export interface Model<T extends Object> {

    /**
     * id is the name of the property that is used as the id key for each
     * document in the collection.
     */
    id: Id

  /**
   * idMode can be used in some apps to determine how to generate an an id
   * for a new document instance in the target collection.
   */
    idMode: IdMode

    /**
     * database connection.
     */
    database: mongo.Db

    /**
     * refs is a list of join references to be honored when retrieving documents
     * for the model.
     */
    refs: JoinRef[]

    /**
     * collection provides the driver handle for the actual
     * collection.
     */
    collection: mongo.Collection

    /**
     * create a new document.
     */
    create(data: T): Future<Id>

    /**
     * create all the documents specified (not atomic).
     */
    createAll(data: T[]): Future<Id[]>

    /**
     * search this model's collection using the criteria specified.
     */
    search(filter: object, opts?: object): Future<T[]>

    /**
     * update a single document in the collection.
     *
     * This uses the $set operation.
     */
    update(id: Id, changes?: object, qry?: object,
        opts?: object): Future<boolean>

    /**
     * updateAll documents in the collection.
     *
     * This uses the $set operation.
     */
    updateAll(qry: object, changes: object, opts?: object): Future<number>

    /**
     * unsafeUpdate allows for an update command to be executed using a 
     * custom query and update operator(s).
     *
     * Care should be taken when using this method as one can easily accidentally
     * overwrite data!
     */
    unsafeUpdate(qry: object, spec: object, opts?: object): Future<number>

    /**
     * get a single record, usually by its id.
     */
    get(id: Id, qry?: object, opts?: object): Future<Maybe<T>>

    /**
     * remove a single document by id.
     */
    remove(id: Id, qry?: object, opts?: object): Future<boolean>

    /**
     * removeAll documents in the collection that match the query.
     */
    removeAll(qry: object, opts?: object): Future<number>

    /**
     * count the number of documents that match the query.
     */
    count(qry: object): Future<number>

    /**
     * aggregate runs a pipeline against documents in the collection.
     */
    aggregate(pipeline: object[], opts: object): Future<Object[]>

}

/**
 * BaseModel provides a base implementation for making Model classes from
 * this library.
 */
export abstract class BaseModel<T extends Object> implements Model<T> {

    constructor(
        public database: mongo.Db,
        public collection: mongo.Collection<any>) { }

    id = 'id';

  idMode = '';

    refs: JoinRef[] = [];

    create(data: T): Future<Id> {

        return create<T>(this, data);
    }

    createAll(data: T[]): Future<Id[]> {

        return createAll(this, data);

    }

    search(filter: object, opts?: object): Future<T[]> {

        return search(this, filter, opts, this.refs);

    }

    update(id: Id, changes: object, qry?: object,
        opts?: object): Future<boolean> {

        return update(this, id, changes, qry, opts);

    }

    updateAll(qry: object, changes: object, opts?: object): Future<number> {

        return updateAll(this, qry, changes, opts);

    }

    unsafeUpdate(qry: object, spec: object, opts?: object): Future<number> {

        return unsafeUpdate(this, qry, spec, opts);

    }

    get(id: Id, qry?: object, opts?: object): Future<Maybe<T>> {

        return get(this, id, qry, opts, this.refs);

    }

    remove(id: Id, qry?: object, opts?: object): Future<boolean> {

        return remove(this, id, qry, opts);

    }

    removeAll(qry: object, opts?: object): Future<number> {

        return removeAll(this, qry, opts);

    }

    count(qry: object): Future<number> {

        return count(this, qry);

    }

    aggregate(pipeline: object[], opts?: object): Future<Object[]> {

        return aggregate(this, pipeline, opts);

    }

}

const getIdQry =
    <T extends Object>(model: Model<T>, id: Id, qry: object): object => {

        let idQry = {

            $or: [

                { [model.id]: id },

                { [model.id]: Number(id) }

            ]

        };

        return empty(qry) ? idQry : { $and: [idQry, qry] };

    }

/**
 * create a new document using a Model.
 */
export const create =
    <T extends Object>(model: Model<T>, data: T): Future<Id> =>
        doFuture<Id>(function*() {

            let result = yield noniMongo.insertOne(model.collection, data);

            let qry = { _id: result.insertedId };

            let mDoc = yield noniMongo.findOne(model.collection, qry);

            return mDoc.isJust() ?
                pure(<Id>mDoc.get()[model.id]) :
                raise<Id>(new Error('create(): Could not retrieve ' +
                    'target document!'));

        });

/**
 * createAll creates more than one document.
 *
 * Note: this is not an atomic operation.
 */
export const createAll =
    <T extends Object>(model: Model<T>, data: T[]): Future<Id[]> =>
        doFuture<Id[]>(function*() {

            let result = yield noniMongo.insertMany(model.collection, data);

            let qry = { _id: { $in: mapTo(result.insertedIds, id => id) } };

            let opts = { projection: { [model.id]: 1 } };

            let results = yield noniMongo.find(model.collection, qry, opts);

            if (results.length !== data.length)
                return raise<Id[]>(new Error('createBulk(): ' +
                    'Some documents were not created!'));

            return pure(results.map((r: Object) => <Id>r[model.id]));

        });

/**
 * search the Model's collection for documents matching the query.
 */
export const search = <T extends Object>(
    model: Model<T>,
    qry: object,
    opts: object = {},
    refs: JoinRef[] = []): Future<T[]> =>
    doFuture(function*() {

        let actualOpts = rmerge({ projection: { _id: false } }, <Object>opts);

        let results = yield noniMongo.find(model.collection, qry, actualOpts);

        for (let i = 0; i < refs.length; i++) {

            let [colname, lkey, fkey, fields] = refs[i];
            let col = model.database.collection(colname);

            results = yield noniMongo.populateN(col, [lkey, fkey],
                results, fields);

        }

        return pure(results);

    });

/**
 * update a single document in the Model's collection given its id.
 *
 * The operation takes place using the $set operator. Additional query 
 * parameters can be supplied to affect the query via the qry parameter.
 *
 * @returns - true if any single document matched the query.
 */
export const update = <T extends Object>(
    model: Model<T>,
    id: Id,
    changes: object,
    qry: object = {},
    opts: object = {}): Future<boolean> => {

    let spec = { $set: changes };

    let actualQry = getIdQry(model, id, qry);

    return noniMongo.updateOne(model.collection, actualQry, spec, opts)
        .map(r => r.matchedCount > 0);

}

/**
 * updateAll documents in the Model's collection that match the query.
 *
 * Uses $set just like update()
 * @returns - The number of documents that matched the query.
 */
export const updateAll = <T extends Object>(
    model: Model<T>,
    qry: object = {},
    changes: object,
    opts: object = {}): Future<number> => {

    let spec = { $set: changes };

    return noniMongo.updateMany(model.collection, qry, spec, opts)
        .map(r => r.matchedCount);

}

/**
 * unsafeUpdate allows a raw update operation to be performed.
 *
 * @returns - The number of documents that matched the query.
 */
export const unsafeUpdate = <T extends Object>(
    model: Model<T>,
    qry: object = {},
    spec: object,
    opts: object = {}): Future<number> => {

    return noniMongo.updateMany(model.collection, qry, spec, opts)
        .map(r => r.matchedCount);

}

/**
 * get a single document from a Model's collection.
 *
 * If refs is specified, each one will be merged into the document.
 * Use sparingly.
 */
export const get = <T extends Object>(
    model: Model<T>,
    id: Id,
    qry: object = {},
    opts: object = {},
    refs: JoinRef[] = []): Future<Maybe<T>> =>
    doFuture(function*() {

        let actualQry = getIdQry(model, id, qry);

        let mHit = yield noniMongo.findOne(model.collection, actualQry, opts);

        if (mHit.isNothing()) return pure(mHit);

        for (let i = 0; i < refs.length; i++) {

            let [colname, lkey, fkey, fields] = refs[i];
            let col = model.database.collection(colname);

            mHit = yield noniMongo.populate(col, [lkey, fkey],
                mHit, fields);

        }

        return pure(mHit);

    });

/**
 * remove a single document by id from a Model's collection.
 */
export const remove = <T extends Object>(
    model: Model<T>,
    id: Id,
    qry: object = {},
    opts: object = {},): Future<boolean> => {

    let actualQry = getIdQry(model, id, qry);

    return noniMongo.deleteOne(model.collection, actualQry, opts)
        .map(r => (<number>r.deletedCount) > 0);

}

/**
 * removeAll documents from a Model's collection that match the specified
 * query.
 */
export const removeAll = <T extends Object>(
    model: Model<T>,
    qry: object = {},
    opts: object = {},): Future<number> =>
    noniMongo.deleteMany(model.collection, qry, opts)
        .map(r => <number>r.deletedCount);

/**
 * count the documents in a Model's collection that match the specified query.
 */
export const count = <T extends Object>(
    model: Model<T>,
    qry: object,
    opts: object = {}): Future<number> =>
    noniMongo.count(model.collection, qry, opts)

/**
 * aggregate runs an aggregation pipeline on a Model's collection.
 */
export const aggregate = <T extends Object>(
    model: Model<T>,
    pipeline: object[],
    opts: object = {}): Future<Object[]> =>
    noniMongo.aggregate<Object>(model.collection, pipeline, opts);
