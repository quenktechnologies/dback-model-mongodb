/**
 * This module provides an interface an abstract class for implementing a basic
 * model in application built with tendril and mongodb.
 */
import * as mongo from 'mongodb';
import * as noniMongo from '@quenk/noni-mongodb/lib/database/collection';
import { Future } from '@quenk/noni/lib/control/monad/future';
import { Maybe } from '@quenk/noni/lib/data/maybe';
import { Object } from '@quenk/noni/lib/data/jsonx';
/**
 * Id of a document.
 *
 * Can be a string or a number, depends on the needs of the application.
 */
export declare type Id = string | number;
/**
 * CollectionName is the name of a collection.
 */
export declare type CollectionName = string;
/**
 * JoinRef specifies information for a manual join that can be used with
 * searches.
 *
 * Use sparingly.
 */
export declare type JoinRef = [CollectionName, noniMongo.LocalKey, noniMongo.ForeignKey, object];
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
    id: Id;
    /**
     * database connection.
     */
    database: mongo.Db;
    /**
     * refs is a list of join references to be honored when retrieving documents
     * for the model.
     */
    refs: JoinRef[];
    /**
     * collection provides the driver handle for the actual
     * collection.
     */
    collection: mongo.Collection;
    /**
     * create a new document.
     */
    create(data: T): Future<Id>;
    /**
     * create all the documents specified (not atomic).
     */
    createAll(data: T[]): Future<Id[]>;
    /**
     * search this model's collection using the criteria specified.
     */
    search(filter: object, opts?: object): Future<T[]>;
    /**
     * update a single document in the collection.
     *
     * This uses the $set operation.
     */
    update(id: Id, changes?: object, qry?: object, opts?: object): Future<boolean>;
    /**
     * updateAll documents in the collection.
     *
     * This uses the $set operation.
     */
    updateAll(qry: object, changes: object, opts?: object): Future<number>;
    /**
     * get a single record, usually by its id.
     */
    get(id: Id, qry?: object, opts?: object): Future<Maybe<T>>;
    /**
     * remove a single document by id.
     */
    remove(id: Id, qry?: object, opts?: object): Future<boolean>;
    /**
     * removeAll documents in the collection that match the query.
     */
    removeAll(qry: object, opts?: object): Future<number>;
    /**
     * count the number of documents that match the query.
     */
    count(qry: object): Future<number>;
    /**
     * aggregate runs a pipeline against documents in the collection.
     */
    aggregate(pipeline: object[], opts: object): Future<Object[]>;
}
/**
 * BaseModel provides a base implementation for making Model classes from
 * this library.
 */
export declare abstract class BaseModel<T extends Object> implements Model<T> {
    database: mongo.Db;
    collection: mongo.Collection<any>;
    constructor(database: mongo.Db, collection: mongo.Collection<any>);
    abstract id: Id;
    refs: JoinRef[];
    create(data: T): Future<Id>;
    createAll(data: T[]): Future<Id[]>;
    search(filter: object, opts?: object): Future<T[]>;
    update(id: Id, changes: object, qry?: object, opts?: object): Future<boolean>;
    updateAll(qry: object, changes: object, opts?: object): Future<number>;
    get(id: Id, qry?: object, opts?: object): Future<Maybe<T>>;
    remove(id: Id, qry?: object, opts?: object): Future<boolean>;
    removeAll(qry: object, opts?: object): Future<number>;
    count(qry: object): Future<number>;
    aggregate(pipeline: object[], opts?: object): Future<Object[]>;
}
/**
 * create a new document using a Model.
 */
export declare const create: <T extends Object>(model: Model<T>, data: T) => Future<Id>;
/**
 * createAll creates more than one document.
 *
 * Note: this is not an atomic operation.
 */
export declare const createAll: <T extends Object>(model: Model<T>, data: T[]) => Future<Id[]>;
/**
 * search the Model's collection for documents matching the query.
 */
export declare const search: <T extends Object>(model: Model<T>, qry: object, opts?: object, refs?: JoinRef[]) => Future<T[]>;
/**
 * update a single document in the Model's collection given its id.
 *
 * The operation takes place using the $set operator. Additional query
 * parameters can be supplied to affect the query via the qry parameter.
 *
 * @returns - True if any single document was affected, false otherwise.
 */
export declare const update: <T extends Object>(model: Model<T>, id: Id, changes: object, qry?: object, opts?: object) => Future<boolean>;
/**
 * updateAll documents in the Model's collection that match the query.
 *
 * Uses $set just like update()
 * @returns - The number of documents affected.
 */
export declare const updateAll: <T extends Object>(model: Model<T>, qry: object | undefined, changes: object, opts?: object) => Future<number>;
/**
 * get a single document from a Model's collection.
 *
 * If refs is specified, each one will be merged into the document.
 * Use sparingly.
 */
export declare const get: <T extends Object>(model: Model<T>, id: Id, qry?: object, opts?: object, refs?: JoinRef[]) => Future<noniMongo.Maybe<T>>;
/**
 * remove a single document by id from a Model's collection.
 */
export declare const remove: <T extends Object>(model: Model<T>, id: Id, qry?: object, opts?: object) => Future<boolean>;
/**
 * removeAll documents from a Model's collection that match the specified
 * query.
 */
export declare const removeAll: <T extends Object>(model: Model<T>, qry?: object, opts?: object) => Future<number>;
/**
 * count the documents in a Model's collection that match the specified query.
 */
export declare const count: <T extends Object>(model: Model<T>, qry: object, opts?: object) => Future<number>;
/**
 * aggregate runs an aggregation pipeline on a Model's collection.
 */
export declare const aggregate: <T extends Object>(model: Model<T>, pipeline: object[], opts?: object) => Future<Object[]>;
