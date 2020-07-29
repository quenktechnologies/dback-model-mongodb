import * as lib from '../lib';

import { assert } from '@quenk/test/lib/assert';
import {
    attempt,
    toPromise,
    doFuture
} from '@quenk/noni/lib/control/monad/future';
import { Testkit } from '@quenk/backdey-mongodb-testkit/lib';
import { Type } from '@quenk/noni/lib/data/type';

let dbkit = new Testkit({ dropDatabase: true, removeAllCollections: true });

class Instance extends lib.BaseModel<Type> {

    id = 'id';

}

describe('AbstractModel', () => {

    before(() => toPromise(dbkit.setUp()));

    describe('create()', () => {

        it('should create a document', () => toPromise(doFuture(function*() {

            let model = new Instance(dbkit.db, dbkit.db.collection('orders'));

            let id = yield model.create({ id: 1, items: [] });

            let mdoc = yield dbkit.findOne('orders', { id });

            return attempt(() => {

                assert(id).equal(1);
                assert(mdoc.isJust()).true();

            });

        })));

    });

    describe('createAll()', () => {

        it('should create documents', () => toPromise(doFuture(function*() {

            let model = new Instance(dbkit.db, dbkit.db.collection('orders'));

            let orders = [
                { id: 1, items: [] },
                { id: 2, items: [] },
                { id: 3, items: [] }
            ];

            yield model.createAll(orders);

            let docs = yield dbkit.find('orders', {});

            return attempt(() => assert(docs.length).equal(3));

        })));

    });

    describe('search()', () => {

        it('should find documents', () => toPromise(doFuture(function*() {

            let model = new Instance(dbkit.db, dbkit.db.collection('orders'));

            let orders = [
                { id: 1, customer: 'Sally', items: [] },
                { id: 2, customer: 'Yui', items: [] },
                { id: 3, customer: 'Sally', items: [] }
            ];

            yield dbkit.populate('orders', orders);

            let qry = { customer: 'Sally' };
            let opts = { projection: { id: 1 } };
            let docs = yield model.search(qry, opts);

            return attempt(() => {

                assert(docs.length).equal(2);
                assert(docs[0]).equate({ id: 1 });
                assert(docs[1]).equate({ id: 3 });

            });

        })));

        it('should join refs', () => toPromise(doFuture(function*() {

            let model = new Instance(dbkit.db, dbkit.db.collection('orders'));

            let customers: any = [

                { name: 'Sally', location: 'Arima' },
                { name: 'Yui', location: 'Point Fortin' }

            ];

            let orders = [
                { id: 1, customer: 'Sally', items: [] },
                { id: 2, customer: 'Yui', items: [] },
                { id: 3, customer: 'Sally', items: [] }
            ];

            yield dbkit.populate('orders', orders);
            yield dbkit.populate('customers', customers);

            model.refs = <lib.JoinRef[]>[

                <lib.JoinRef>['customers', 'customer', 'name',
                    { name: 1, location: 1, _id: 0 }]
            ];

            let docs = yield model.search({}, undefined);

            delete customers[0]._id;
            delete customers[1]._id;

            return attempt(() => {

                assert(docs.length).equal(3);
                assert(docs[0].customer).equate(customers[0]);
                assert(docs[1].customer).equate(customers[1]);
                assert(docs[2].customer).equate(customers[0]);

            });

        })))

    });

    describe('update()', function() {

        it('should update a document', () => toPromise(doFuture(function*() {

            let model = new Instance(dbkit.db, dbkit.db.collection('orders'));

            let orders = [
                { id: 1, customer: 'Sally', items: [] },
                { id: 2, customer: 'Yui', items: [] },
                { id: 3, customer: 'Sally', items: [] }
            ];

            yield dbkit.populate('orders', orders);

            let yes = yield model.update(2, { customer: 'Sally' });

            let mdoc = yield dbkit.findOne('orders', { id: 2 },
                { projection: { _id: 0 } });

            return attempt(() => {

                assert(yes).true();
                assert(mdoc.get()).equate({
                    id: 2,
                    customer: 'Sally',
                    items: []
                });

            });

        })));

    });

    describe('updateAll()', function() {

        it('should update documents', () => toPromise(doFuture(function*() {

            let model = new Instance(dbkit.db, dbkit.db.collection('orders'));

            let orders = [
                { id: 1, customer: 'Sally', items: [] },
                { id: 2, customer: 'Yui', items: [] },
                { id: 3, customer: 'Sally', items: [] }
            ];

            yield dbkit.populate('orders', orders);

            let n = yield model.updateAll({ customer: 'Sally' },
                { customer: 'Hatty' });

            let docs = yield dbkit.find('orders', { customer: 'Hatty' },
                { projection: { _id: 0 } });

            return attempt(() => {

                assert(n).equal(2);
                assert(docs.length).equal(2);
                assert(docs).equate([{
                    id: 1,
                    customer: 'Hatty',
                    items: []
                },
                {
                    id: 3,
                    customer: 'Hatty',
                    items: []
                }
                ]);

            });

        })));

    })

    describe('get()', () => {

        it('should find a document', () => toPromise(doFuture(function*() {

            let model = new Instance(dbkit.db, dbkit.db.collection('orders'));

            let orders = [
                { id: 1, customer: 'Sally', items: [] },
                { id: 2, customer: 'Yui', items: [] },
                { id: 3, customer: 'Sally', items: [] }
            ];

            yield dbkit.populate('orders', orders);

            let opts = { projection: { id: 1, _id: 0 } };
            let mdoc = yield model.get(1, undefined, opts);

            return attempt(() => {

                assert(mdoc.get()).equate({
                    id: 1
                });

            });

        })));

        it('should join refs', () => toPromise(doFuture(function*() {

            let model = new Instance(dbkit.db, dbkit.db.collection('orders'));

            let customers: any = [

                { name: 'Sally', location: 'Arima' },
                { name: 'Yui', location: 'Point Fortin' }

            ];

            let orders = [
                { id: 1, customer: 'Sally', items: [] },
                { id: 2, customer: 'Yui', items: [] },
                { id: 3, customer: 'Sally', items: [] }
            ];

            yield dbkit.populate('orders', orders);
            yield dbkit.populate('customers', customers);

            model.refs = <lib.JoinRef[]>[

                <lib.JoinRef>['customers', 'customer', 'name',
                    { name: 1, location: 1, _id: 0 }]
            ];

            let mDoc = yield model.get(2);

            delete customers[1]._id;

            return attempt(() => {

                assert(mDoc.get().customer).equate(customers[1]);

            });

        })))

    });

    describe('remove()', function() {

        it('should remove a document', () => toPromise(doFuture(function*() {

            let model = new Instance(dbkit.db, dbkit.db.collection('orders'));

            let orders = [
                { id: 1, customer: 'Sally', items: [] },
                { id: 2, customer: 'Yui', items: [] },
                { id: 3, customer: 'Sally', items: [] }
            ];

            yield dbkit.populate('orders', orders);

            let yes = yield model.remove(2);
            let docs = yield dbkit.find('orders', {});

            return attempt(() => {

                assert(yes).true();
                assert(docs.length).equal(2);

            });

        })));

    });

    describe('removeAll()', function() {

        it('should remove documents', () => toPromise(doFuture(function*() {

            let model = new Instance(dbkit.db, dbkit.db.collection('orders'));

            let orders = [
                { id: 1, customer: 'Sally', items: [] },
                { id: 2, customer: 'Yui', items: [] },
                { id: 3, customer: 'Sally', items: [] }
            ];

            yield dbkit.populate('orders', orders);

            let n = yield model.removeAll({ id: { $in: [3, 1] } });
            let docs = yield dbkit.find('orders', {});

            return attempt(() => {

                assert(n).equal(2);
                assert(docs.length).equal(1);

            });

        })));

    });

    describe('count()', function() {

        it('should count documents', () => toPromise(doFuture(function*() {

            let model = new Instance(dbkit.db, dbkit.db.collection('orders'));

            let orders = [
                { id: 1, customer: 'Sally', items: [] },
                { id: 2, customer: 'Yui', items: [] },
                { id: 3, customer: 'Sally', items: [] }
            ];

            yield dbkit.populate('orders', orders);

            let n = yield model.count({customer:'Sally'});

            return attempt(() => assert(n).equal(2));

        })))
    });

    describe('aggregate()', function() {

        it('should run a pipeline', () => toPromise(doFuture(function*() {

            let model = new Instance(dbkit.db, dbkit.db.collection('orders'));

            let orders = [
                { id: 1, customer: 'Sally', items: [] },
                { id: 2, customer: 'Yui', items: [] },
                { id: 3, customer: 'Sally', items: [] }
            ];

            yield dbkit.populate('orders', orders);

            let docs = yield model.aggregate([{ $match: { customer: 'Yui' } }]);

            delete docs[0]._id;

            return attempt(() => {

                assert(docs.length).equal(1);
                assert(docs).equate([
                    { id: 2, customer: 'Yui', items: [] },
                ]);

            });

        })));

    });

    afterEach(() => toPromise(dbkit.tearDown()));

    after(() => toPromise(dbkit.setDown()));

});
