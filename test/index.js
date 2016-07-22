import { expect } from 'chai';

import * as joi from '../src';

describe('middleware/joi', () => {
    it('should exist and export request and response middlewares', () => {
        expect(joi.request).to.exist.and.be.a('function');
        expect(joi.response).to.exist.and.be.a('function');
    });
});
