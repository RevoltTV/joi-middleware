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

        if (schema.query) {
            validations.push(validate(_.omit(req.query, 'token'), schema.query));
        }

        if (schema.params) {
            validations.push(validate(req.params, schema.params));
        }

        if (schema.body) {
            validations.push(validate(req.body, schema.body));
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
