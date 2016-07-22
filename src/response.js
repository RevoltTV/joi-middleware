import _         from 'lodash';
import Joi       from 'joi';
import logger    from 'winston';
import { Model } from 'sequelize';
import promisify from 'es6-promisify';

import converter from './convert-sequelize';

export default (schema = {}) => {
    let valid = schema.body;

    function joiResponse(req, res, next) {
        const validate = promisify(Joi.validate);

        let defaultOptions = {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true
        };

        if (_.isEmpty(schema)) {
            return res.json(res.locals);
        }

        let options = _.extend({}, defaultOptions, _.get(schema, 'options'));
        return validate(res.locals, valid, options)
        .then((result) => {
            return res.json(result);
        })
        .catch((err) => {
            if (err.name === 'ValidationError') {
                logger.warn('response does not conform to expected schema', err);
                return res.json(res.locals);
            }

            logger.error(err);

            return next(err);
        });
    }

    if (_.isEmpty(valid)) {
        logger.warn('joi response schema must be specified in `body`');
    }

    if (valid instanceof Model) {
        valid = converter(valid);
        joiResponse.model = valid;
    } else if (_.isArray(valid) && _.first(valid) instanceof Model) {
        valid = Joi.array().items(converter(_.first(valid)));
        joiResponse.model = valid;
    }

    joiResponse.schema = valid;

    return joiResponse;
};
