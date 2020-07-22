"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregate = exports.count = exports.removeAll = exports.remove = exports.get = exports.updateAll = exports.update = exports.search = exports.createAll = exports.create = exports.AbstractModel = void 0;
var noniMongo = require("@quenk/noni-mongodb/lib/database/collection");
var future_1 = require("@quenk/noni/lib/control/monad/future");
var record_1 = require("@quenk/noni/lib/data/record");
/**
 * AbstractModel provides a base implementation for making Model classes from
 * this library.
 */
var AbstractModel = /** @class */ (function () {
    function AbstractModel(id, database, collection) {
        this.id = id;
        this.database = database;
        this.collection = collection;
    }
    AbstractModel.prototype.create = function (data) {
        return exports.create(this, data);
    };
    AbstractModel.prototype.createAll = function (data) {
        return exports.createAll(this, data);
    };
    AbstractModel.prototype.search = function (filter, opts) {
        return exports.search(this, filter, opts);
    };
    AbstractModel.prototype.get = function (id, qry, opts) {
        return exports.get(this, id, qry, opts);
    };
    AbstractModel.prototype.update = function (id, updateSpec, qry, opts) {
        return exports.update(this, id, updateSpec, qry, opts);
    };
    AbstractModel.prototype.updateAll = function (qry, updateSpec, opts) {
        return exports.updateAll(this, updateSpec, qry, opts);
    };
    AbstractModel.prototype.remove = function (id, qry, opts) {
        return exports.remove(this, id, qry, opts);
    };
    AbstractModel.prototype.removeAll = function (qry, opts) {
        return exports.removeAll(this, qry, opts);
    };
    AbstractModel.prototype.count = function (qry) {
        return exports.count(this, qry);
    };
    AbstractModel.prototype.aggregate = function (pipeline, opts) {
        return exports.aggregate(this, pipeline, opts);
    };
    return AbstractModel;
}());
exports.AbstractModel = AbstractModel;
/**
 * create a new document using a Model.
 */
exports.create = function (model, data) {
    return future_1.doFuture(function () {
        var result, qry, mDoc;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, noniMongo.insertOne(model.collection, data)];
                case 1:
                    result = _a.sent();
                    qry = { _id: result.insertedId };
                    return [4 /*yield*/, noniMongo.findOne(model.collection, qry)];
                case 2:
                    mDoc = _a.sent();
                    return [2 /*return*/, mDoc.isJust() ?
                            future_1.pure(mDoc.get()[model.id]) :
                            future_1.raise(new Error('create(): Could not retrieve target document!'))];
            }
        });
    });
};
/**
 * createAll creates more than one document.
 *
 * Note: this is not an atomic operation.
 */
exports.createAll = function (model, data) {
    return future_1.doFuture(function () {
        var result, qry, opts, results;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, noniMongo.insertMany(model.collection, data)];
                case 1:
                    result = _b.sent();
                    qry = { _id: result.insertedIds };
                    opts = { projection: (_a = {}, _a[model.id] = 1, _a) };
                    return [4 /*yield*/, noniMongo.find(model.collection, qry, opts)];
                case 2:
                    results = _b.sent();
                    if (results.length !== data.length)
                        return [2 /*return*/, future_1.raise(new Error('createBulk(): ' +
                                'Some documents were not created!'))];
                    return [2 /*return*/, future_1.pure(results.map(function (r) { return r[model.id]; }))];
            }
        });
    });
};
/**
 * search the Model's collection for documents matching the query.
 */
exports.search = function (model, qry, opts, refs) {
    if (opts === void 0) { opts = {}; }
    if (refs === void 0) { refs = []; }
    return future_1.doFuture(function () {
        var results, i, _a, colname, lkey, fkey, fields, col;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, noniMongo.find(model.collection, qry, opts)];
                case 1:
                    results = _b.sent();
                    i = 0;
                    _b.label = 2;
                case 2:
                    if (!(i < refs.length)) return [3 /*break*/, 5];
                    _a = refs[i], colname = _a[0], lkey = _a[1], fkey = _a[2], fields = _a[3];
                    col = model.database.collection(colname);
                    return [4 /*yield*/, noniMongo.populateN(col, [lkey, fkey], results, fields)];
                case 3:
                    results = _b.sent();
                    _b.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, future_1.pure(results)];
            }
        });
    });
};
/**
 * update a single document in the Model's collection given its id.
 *
 * Additional query parameters can also be supplied.
 *
 * @returns - True if any documents were affected, false otherwise.
 */
exports.update = function (model, id, updateSpec, qry, opts) {
    var _a, _b;
    if (qry === void 0) { qry = {}; }
    if (opts === void 0) { opts = {}; }
    var query = record_1.merge(qry, {
        $or: [
            (_a = {}, _a[model.id] = id, _a),
            (_b = {}, _b[model.id] = Number(id), _b)
        ]
    });
    return noniMongo.updateOne(model.collection, query, updateSpec, opts)
        .map(function (r) { return r.modifiedCount > 0; });
};
/**
 * updateAll documents in the Model's collection that match the query.
 *
 * @returns - The number of documents affected.
 */
exports.updateAll = function (model, qry, updateSpec, opts) {
    if (qry === void 0) { qry = {}; }
    if (opts === void 0) { opts = {}; }
    return noniMongo.updateMany(model.collection, qry, updateSpec, opts)
        .map(function (r) { return r.modifiedCount; });
};
/**
 * get a single document from a Model's collection.
 *
 * If refs is specified, each one will be merged into the document.
 * Use sparingly.
 */
exports.get = function (model, id, qry, opts, refs) {
    if (qry === void 0) { qry = {}; }
    if (opts === void 0) { opts = {}; }
    if (refs === void 0) { refs = []; }
    return future_1.doFuture(function () {
        var q, mHit, hit, i, _a, colname, lkey, fkey, fields, col;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    q = record_1.merge(qry, {
                        $or: [
                            (_b = {}, _b[model.id] = id, _b),
                            (_c = {}, _c[model.id] = Number(id), _c)
                        ]
                    });
                    return [4 /*yield*/, noniMongo.findOne(model.collection, q, opts)];
                case 1:
                    mHit = _d.sent();
                    if (mHit.isNothing())
                        return [2 /*return*/, future_1.pure(mHit)];
                    hit = mHit.get();
                    i = 0;
                    _d.label = 2;
                case 2:
                    if (!(i < refs.length)) return [3 /*break*/, 5];
                    _a = refs[i], colname = _a[0], lkey = _a[1], fkey = _a[2], fields = _a[3];
                    col = model.database.collection(colname);
                    return [4 /*yield*/, noniMongo.populate(col, [lkey, fkey], hit, fields)];
                case 3:
                    hit = _d.sent();
                    _d.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, future_1.pure(hit)];
            }
        });
    });
};
/**
 * remove a single document by id from a Model's collection.
 */
exports.remove = function (model, id, qry, opts) {
    var _a, _b;
    if (qry === void 0) { qry = {}; }
    if (opts === void 0) { opts = {}; }
    var q = record_1.merge(qry, {
        $or: [
            (_a = {}, _a[model.id] = id, _a),
            (_b = {}, _b[model.id] = Number(id), _b)
        ]
    });
    return noniMongo.deleteOne(model.collection, q, opts)
        .map(function (r) { return r.deletedCount > 0; });
};
/**
 * removeAll documents from a Model's collection that match the specified
 * query.
 */
exports.removeAll = function (model, qry, opts) {
    if (qry === void 0) { qry = {}; }
    if (opts === void 0) { opts = {}; }
    return noniMongo.deleteMany(model.collection, qry, opts)
        .map(function (r) { return r.deletedCount; });
};
/**
 * count the documents in a Model's collection that match the specified query.
 */
exports.count = function (model, qry, opts) {
    if (opts === void 0) { opts = {}; }
    return noniMongo.count(model.collection, qry, opts);
};
/**
 * aggregate runs an aggregation pipeline on a Model's collection.
 */
exports.aggregate = function (model, pipeline, opts) {
    if (opts === void 0) { opts = {}; }
    return noniMongo.aggregate(model.collection, pipeline, opts);
};
//# sourceMappingURL=index.js.map