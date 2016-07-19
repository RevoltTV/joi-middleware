import _         from 'lodash';
import Joi       from 'joi';
import logger    from 'winston';
import promisify from 'es6-promisify';

import {
    BadRequestError
} from '@revolttv/errors';

export default (schema = {}) => {
    return (req, res, next) => {
        const validate = promisify(Joi.validate);
        let validations = [];

        let defaultOptions = {
            abortEarly: false
        };

        if (schema.query) {
            let options = _.extend({}, defaultOptions, _.get(schema, 'options.query'));
            validations.push(validate(_.omit(req.query, 'token'), schema.query, options));
        }

        if (schema.params) {
            let options = _.extend({}, defaultOptions, _.get(schema, 'options.params'));
            validations.push(validate(req.params, schema.params, options));
        }

        if (schema.body) {
            let options = _.extend({}, defaultOptions, _.get(schema, 'options.body'));
            validations.push(validate(req.body, schema.body, options));
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
    };
};
