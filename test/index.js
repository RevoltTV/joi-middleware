import chai, { expect } from 'chai';
import Joi              from 'joi';
import sinon            from 'sinon';
import sinonChai        from 'sinon-chai';

import * as Errors from '@revolttv/errors';

import joi from '../src';

chai.use(sinonChai);

describe('middleware/joi', () => {
    let spy;

    beforeEach(() => {
        spy = sinon.spy(Joi, 'validate');
    });

    afterEach(() => {
        spy.restore();
    });

    it('should allow not specifying a schema', () => {
        let req = { query: { num: 10 }, body: { str: 'hello' } };
        let next = sinon.spy();
        let middleware = joi();

        return Promise.resolve(
            middleware(req, {}, next)
        )
        .then(() => {
            expect(spy).to.not.have.been.called;
            expect(next).to.have.been.calledOnce.and.calledWith();
        });
    });

    describe('query', () => {
        it('should allow valid query parameters', () => {
            let req = { query: { num: 10, str: 'hello', email: 'test@test.com' } };
            let next = sinon.spy();
            let middleware = joi({ query: { num: Joi.number().required(), str: Joi.string(), email: Joi.string().email() } });

            return Promise.resolve(
                middleware(req, {}, next)
            )
            .then(() => {
                expect(spy).to.have.been.calledOnce;
                expect(spy.firstCall.args[0]).to.deep.equal(req.query);
                expect(next).to.have.been.calledOnce;
                expect(next).to.have.been.calledWith();
            });
        });

        it('should call next() with BadRequestError on invalid query parameters', () => {
            let next = sinon.spy();

            let middleware = joi({ query: { num: Joi.number().required() } });
            return Promise.resolve(
                middleware({ query: { num: 'hello' } }, {}, next)
            )
            .then(() => {
                expect(next).to.have.been.called;
                expect(next.firstCall.args[0]).to.be.an.instanceof(Errors.BadRequestError);
                expect(next.firstCall.args[0].fields).to.contain('num');
            });
        });

        it('should not include token from query string parameter in schema validation', () => {
            let next = sinon.spy();

            let middleware = joi({
                query: { num: Joi.number().required() }
            });

            return Promise.resolve(
                middleware({ query: { num: 5, token: 'authentication_token' } }, {}, next)
            ).then(() => {
                expect(next).to.have.been.calledOnce;
                expect(next).to.have.been.calledWithExactly();
                expect(spy).to.have.been.calledOnce;
                expect(spy).to.have.been.calledWith({ num: 5 });
            });
        });
    });

    describe('path', () => {
        it('should allow valid path parameters', () => {
            let req = { params: { num: 10, str: 'hello', email: 'test@test.com' } };
            let next = sinon.spy();
            let middleware = joi({ params: { num: Joi.number().required(), str: Joi.string(), email: Joi.string().email() } });

            return Promise.resolve(
                middleware(req, {}, next)
            )
            .then(() => {
                expect(spy).to.have.been.calledOnce;
                expect(next).to.have.been.calledOnce;
                expect(next).to.have.been.calledWithExactly();
            });
        });

        it('should call next() with BadRequestError on invalid path parameters', () => {
            let next = sinon.spy();

            let middleware = joi({ params: { num: Joi.number().required() } });
            return Promise.resolve(
                middleware({ params: { num: 'hello' } }, {}, next)
            )
            .then(() => {
                expect(next).to.have.been.called;
                expect(next.firstCall.args[0]).to.be.an.instanceof(Errors.BadRequestError);
                expect(next.firstCall.args[0].fields).to.contain('num');
            });
        });
    });

    describe('body', () => {
        it('should allow valid body parameters', () => {
            let req = { body: { num: 10, str: 'hello', email: 'test@test.com' } };
            let next = sinon.spy();
            let middleware = joi({ body: { num: Joi.number().required(), str: Joi.string(), email: Joi.string().email() } });

            return Promise.resolve(
                middleware(req, {}, next)
            )
            .then(() => {
                expect(spy).to.have.been.calledOnce;
                expect(next).to.have.been.calledOnce;
                expect(next).to.have.been.calledWithExactly();
            });
        });

        it('should call next() with BadRequestError on invalid body parameters', () => {
            let next = sinon.spy();

            let middleware = joi({ body: { num: Joi.number().required() } });
            return Promise.resolve(
                middleware({ body: { num: 'hello' } }, {}, next)
            )
            .then(() => {
                expect(next).to.have.been.called;
                expect(next.firstCall.args[0]).to.be.an.instanceof(Errors.BadRequestError);
                expect(next.firstCall.args[0].fields).to.contain('num');
            });
        });
    });

    it('should pass to next handler if Joi errors', () => {
        let err = new Error('test error');
        let res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub().returnsThis()
        };
        spy.restore();
        spy = sinon.stub(Joi, 'validate').callsArg(3, err);
        let middleware = joi({ query: { test: Joi.number() } });
        let next = sinon.spy();

        return Promise.resolve(
            middleware({}, res, next)
        )
        .then(() => {
            expect(res.status).to.not.have.been.called;
            expect(res.json).to.not.have.been.called;
            expect(next).to.have.been.calledOnce;
            expect(next).to.have.been.calledWith(err);
        });
    });
});
