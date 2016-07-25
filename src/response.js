import _         from 'lodash';
import Joi       from 'joi';
import logger    from 'winston';
import { Model } from 'sequelize';
import promisify from 'es6-promisify';

import sequelizeToJoi, { findAndConvertModels } from '@revolttv/sequelize-to-joi';

function cleanSequelize(data) {
    if (_.isArray(data)) {
        return _.map(data, cleanSequelize);
    } else if (_.isObject(data)) {
        if (_.isFunction(data.toJSON)) {
            return data.toJSON();
        }

        _.each(data, (value, key) => {
            data[key] = cleanSequelize(value);
        });
    }

    return data;
}

export default (schema = {}) => {
    let valid = _.clone(schema.body);

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

        let data = cleanSequelize(res.locals);

        let options = _.extend({}, defaultOptions, _.get(schema, 'options'));
        return validate(data, valid, options)
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

    joiResponse.original = schema.body;
    joiResponse.description = schema.description || '';

    if (_.isArray(valid) && _.first(valid) instanceof Model) {
        valid = Joi.array().items(sequelizeToJoi(_.first(valid), { omitAssociations: true }));
    } else if (valid instanceof Model) {
        valid = sequelizeToJoi(valid, { omitAssociations: true });
    } else {
        valid = findAndConvertModels(_.cloneDeep(valid), { omitAssociations: true });
    }

    joiResponse.schema = valid;

    return joiResponse;
};
