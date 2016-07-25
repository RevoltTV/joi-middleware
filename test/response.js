import chai, { expect } from 'chai';
import Joi              from 'joi';
import logger           from 'winston';
import Sequelize        from 'sequelize';
import sinon            from 'sinon';
import sinonChai        from 'sinon-chai';

import joi from '../src/response';

chai.use(sinonChai);

describe('middleware/joi/response', () => {
    let sequelize;
    let spy;
    let warn;

    beforeEach(() => {
        sequelize = new Sequelize('test', 'test', null, { dialect: 'sqlite' });
        spy = sinon.spy(Joi, 'validate');
        warn = sinon.stub(logger, 'warn');
    });

    afterEach(() => {
        spy.restore();
        warn.restore();
    });

    it('should expose function name and schema on middleware', () => {
        let schema = { body: { name: Joi.string() } };
        let middleware = joi(schema);

        expect(middleware.name).to.equal('joiResponse');
        expect(middleware.schema).to.deep.equal(schema.body);
    });

    it('should allow not specifying a schema', () => {
        let res = { locals: { body: 'test' }, json: sinon.spy() };

        let middleware = joi();

        return Promise.resolve(
            middleware({}, res)
        )
        .then(() => {
            expect(spy).to.not.have.been.called;
            expect(res.json).to.have.been.calledWith(res.locals);
        });
    });

    it('should log a warning if response data is incorrect', () => {
        let res = {
            locals: { id: 'test' },
            json: sinon.spy()
        };

        let middleware = joi({
            body: { id: Joi.number() }
        });

        return Promise.resolve(
            middleware({}, res)
        )
        .then(() => {
            expect(spy).to.have.been.calledOnce;
            expect(warn).to.have.been.calledOnce;
            expect(res.json).to.have.been.calledWith(res.locals);
        });
    });

    it('should strip unknown properties from response object', () => {
        let res = {
            locals: { id: 1, name: 'test', secret: 'oh no' },
            json: sinon.spy()
        };

        let middleware = joi({
            body: { id: Joi.number(), name: Joi.string() }
        });

        return Promise.resolve(
            middleware({}, res)
        )
        .then(() => {
            expect(spy).to.have.been.calledOnce;
            let json = res.json.firstCall.args[0];
            expect(json.secret).to.not.exist;
            expect(json).to.deep.equal({ id: 1, name: 'test' });
        });
    });

    it('should accept a sequelize model as a response object', () => {
        let model = sequelize.define('test', {
            name: {
                type: Sequelize.STRING(123)
            }
        });

        let res = {
            locals: { id: 1, name: 'hello' },
            json: sinon.spy()
        };

        let middleware = joi({
            body: model
        });

        return Promise.resolve(
            middleware({}, res)
        )
        .then(() => {
            expect(spy).to.have.been.calledOnce;
            expect(res.json).to.have.been.calledWith({ id: 1, name: 'hello' });
        });
    });

    it('should accept an array of sequelize models as a response object', () => {
        let model = sequelize.define('test', {
            name: {
                type: Sequelize.STRING
            }
        });

        let data = [{
            id: 1,
            name: 'test',
            createdAt: (new Date()),
            updatedAt: (new Date())
        }, {
            id: 2,
            name: 'test2',
            createdAt: (new Date()),
            updatedAt: (new Date())
        }];

        let res = {
            locals: data,
            json: sinon.spy()
        };

        let middleware = joi({
            body: [model]
        });

        return Promise.resolve(
            middleware({}, res)
        )
        .then(() => {
            expect(spy).to.have.been.calledOnce;
            expect(res.json).to.have.been.calledOnce;
            let result = res.json.firstCall.args[0];
            expect(result).to.have.length(2);
        });
    });
});
