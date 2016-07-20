import _         from 'lodash';
import Joi       from 'joi';
import logger    from 'winston';
import promisify from 'es6-promisify';

import {
    BadRequestError
} from '@revolttv/errors';

export default (schema = {}) => {
    function joi(req, res, next) {
        const validate = promisify(Joi.validate);
        let validations = [];

        let defaultOptions = {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true
        };

        if (schema.query) {
            let options = _.extend({}, defaultOptions, _.get(schema, 'options.query'));
            validations.push(
                validate(_.omit(req.query, 'token'), schema.query, options)
                .then((result) => { req.query = result; return req.query; })
            );
        }

        if (schema.params) {
            let options = _.extend({}, defaultOptions, _.get(schema, 'options.params'));
            validations.push(
                validate(req.params, schema.params, options)
                .then((result) => { req.params = result; return req.params; })
            );
        }

        if (schema.body) {
            let options = _.extend({}, defaultOptions, _.get(schema, 'options.body'));
            validations.push(
                validate(req.body, schema.body, options)
                .then((result) => { req.body = result; return req.body; })
            );
        }

        return Promise.all(validations)
        .then(() => {
            return next();
        })
        .catch((err) => {
            logger.debug(err);
            if (err.name === 'ValidationError') {
                let message = _.map(err.details, 'message').join('. ');
                let fields = _.map(err.details, 'path');
                return next(new BadRequestError(message, fields));
            } else {
                return next(err);
            }
        });
    }

    joi.schema = schema;

    return joi;
};
