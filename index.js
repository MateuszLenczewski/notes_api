// jshint esversion: 6
// jshint strict:implied

const express = require('express');
const Joi = require('joi');
const config = require('./config.json');

const notes = [
    {id: 0, title: "Note 0", message: "Message 0"},
    {id: 1, title: "Note 1", message: "Message 1"},
    {id: 2, title: "Note 2", message: "Message 2"},
    {id: 3, title: "Note 3", message: "Message 3"}
];

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    if (!req.query.callback) {
        req.query.callback = 'callback';
    }
    next();
});

function validateNoteRequestAllRequired(note) {
    const schema = {
        title: Joi.string().required(),
        message: Joi.string().required()
    };
    return Joi.validate(note, schema);
}

function validateNoteRequestAllOptional(note) {
    const schema = {
        title: Joi.string(),
        message: Joi.string()
    };
    return Joi.validate(note, schema);
}

function generateResponse(format) {
    if (format === 'json' || format === undefined) {
        return function(res, data) {
            res.json(data);
        };
    } else if (format === 'jsonp') {
        return function(res, data) {
            res.jsonp(data);
        };
    } else {
        return function(res) {
            res.status(400).json({
                code: 400,
                message: "Unsupported format"
            });
        };
    }
}

function findNoteById(req, res) {
    const note = notes.find(c => c.id === parseInt(req.params.id));
    if (!note) {
        const responseFunction = generateResponse(req.query.format);
        responseFunction(res, {
            code: 404,
            message: 'Element does not exist'
        });
        return res.status(404);
    }
    return note;
}

// POST
app.post('/v1/notes', (req, res) => {
    const {error} = validateNoteRequestAllRequired(req.body);
    if (error) return res.status(400).json({
        code: 400,
        message: error.details[0].message
    });
    const note = {
        id: notes.length > 0 ? notes[notes.length - 1].id + 1 : 0,
        title: req.body.title,
        message: req.body.message
    };
    notes.push(note);
    const responseFunction = generateResponse(req.query.format);
    responseFunction(res, note);
    return res.status(201);
});

// GET
app.get('/v1/ping', (req, res) => {
    const responseFunction = generateResponse(req.query.format);
    responseFunction(res, {pong: true});
    return res.status(200);
});

app.get('/v1/notes/:id', (req, res) => {
    const note = findNoteById(req, res);

    const responseFunction = generateResponse(req.query.format);
    responseFunction(res, note);
    return res.status(200);
});

app.get('/v1/notes', (req, res) => {
    const responseFunction = generateResponse(req.query.format);
    responseFunction(res, {
        count: notes.length,
        results: notes
    });
    return res.status(200);
});

// PUT
app.put('/v1/notes/:id', (req, res) => {
    const note = findNoteById(req, res);

    const {error} = validateNoteRequestAllOptional(req.body);
    if (error) return res.status(400).json({
        code: 400,
        message: error.details[0].message
    });

    if (req.body.title) note.title = req.body.title;
    if (req.body.message) note.message = req.body.message;

    const responseFunction = generateResponse(req.query.format);
    responseFunction(res, note);
    return res.status(200);
});

// DELETE
app.delete('/v1/notes/:id', (req, res) => {
    const note = findNoteById(req, res);

    const index = notes.indexOf(note);
    notes.splice(index, 1);

    const responseFunction = generateResponse(req.query.format);
    responseFunction(res, {success: true});
    return res.status(200);
});

const port = config.port;
app.listen(port, () => console.log(`Server running on port ${port}`));