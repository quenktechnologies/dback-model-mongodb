import * as noniMongo from '@quenk/noni-mongodb/lib/database/collection';
import * as mongo from 'mongodb';
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
     * get a single record, usually by its id.
     */
    get(id: Id, qry?: object, opts?: object): Future<Maybe<T>>;
    /**
     * update a single document in the collection.
     */
    update(id: Id, updateSpec?: object, qry?: object, opts?: object): Future<boolean>;
    /**
     * updateAll documents in the collection.
     */
    updateAll(qry: object, updateSpec: object, opts: object): Future<number>;
    /**
     * remove a single document by id.
     */
    remove(id: Id, qry?: object, opts?: object): Future<boolean>;
    /**
     * removeAll documents in the collection that match the query.
     */
    removeAll(qry: object, opts: object): Future<number>;
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
 * AbstractModel provides a base implementation for making Model classes from
 * this library.
 */
export declare abstract class AbstractModel<T extends Object> implements Model<T> {
    database: mongo.Db;
    collection: mongo.Collection<any>;
    constructor(database: mongo.Db, collection: mongo.Collection<any>);
    abstract id: Id;
    create(data: T): Future<Id>;
    createAll(data: T[]): Future<Id[]>;
    search(filter: object, opts?: object): Future<T[]>;
    get(id: Id, qry?: object, opts?: object): Future<Maybe<T>>;
    update(id: Id, updateSpec: object, qry?: object, opts?: object): Future<boolean>;
    updateAll(qry: object, updateSpec: object, opts: object): Future<number>;
    remove(id: Id, qry?: object, opts?: object): Future<boolean>;
    removeAll(qry: object, opts: object): Future<number>;
    count(qry: object): Future<number>;
    aggregate(pipeline: object[], opts: object): Future<Object[]>;
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
 * Additional query parameters can also be supplied.
 *
 * @returns - True if any documents were affected, false otherwise.
 */
export declare const update: <T extends Object>(model: Model<T>, id: Id, updateSpec: object, qry?: object, opts?: object) => Future<boolean>;
/**
 * updateAll documents in the Model's collection that match the query.
 *
 * @returns - The number of documents affected.
 */
export declare const updateAll: <T extends Object>(model: Model<T>, qry: object | undefined, updateSpec: object, opts?: object) => Future<number>;
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
