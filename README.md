# joi-middleware

Validates an incoming request to ensure the parameters are correctly
defined

## Usage

```
import validate from '@revolttv/joi-middleware';

let app = new express();

app.get('/route/:id', validate({
    query: {
        limit: Joi.number().min(1).max(100),
        name: Joi.string()
    },
    params: {
        id: Joi.string().guid().required()
    },
    options: {
        query: {
            allowUnknown: false
        }
    }
}));

app.post('/route', validate({
    body: {
        name: Joi.string().required(),
        count: Joi.number().required()
    }
}));
```

## Configuration

Each parameter key can define its own Joi validation options. All groups use

```
{
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
}
```

by default. These can be overridden by passing in the options group.

EX:

```
{
    options: {
        body: {},
        params: {},
        query: {}
    }
}
```
