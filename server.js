var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');
var middleware = require('./middleware.js')(db);

var app = express();
var todos = [];
var todoNextId = 1;

var PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', function(req, res) {
    res.send('Todo API root');
});

// GET /todos
app.get('/todos', middleware.requireAuthentication, function(req, res) {
    var query = req.query;
    var where = {};

    if (query.hasOwnProperty('completed')) {
        where.completed = query.completed === "true";
    }

    if (query.hasOwnProperty('q') && _.isString(query.q) && query.q.trim()) {
        where.description = {
            $like: '%' + query.q + '%'
        }
    }

    db.todo.findAll({
        where: where
    }).then(function(data) {
        res.json(data);
    }, function(err) {
        res.status(500).send();
    });
});

// GET /todos/:id
app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {
    var todoId = parseInt(req.params.id, 10);

    db.todo.findById(todoId).then(function(data) {
        if (data) {
            res.json(data);
        } else {
            res.status(404).send("No such ToDo exists!");
        }
    }, function(err) {
        res.status(500).json(err);
    });
});

// POST /todos
app.post('/todos', middleware.requireAuthentication, function(req, res) {
    var body = _.pick(req.body, 'description', 'completed');

    db.todo.create(body).then(function(data) {
        res.json(data);
    }).catch(function(err) {
        res.status(400).json(err);
    });
});

// POST /users
app.post('/users', function (req, res) {
    var body = _.pick(req.body, 'email', 'password');

    db.user.create(body).then(function(data) {
        res.json(data.toPublicJSON());
    }, function(err) {
        res.status(400).json(err);
    });
});

// POST /users/login
app.post('/users/login', function(req, res) {
    var body = _.pick(req.body, 'email', 'password');

    db.user.authenticate(body).then(function(data) {
        var token = data.generateToken('authentication');
        if (token) {
            res.header('Auth', token).json(data.toPublicJSON());
        } else {
            res.status(401).send();
        }
    }, function(err) {
        res.status(401).send(err);
    });
});

// DELETE /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {
    var todoId = parseInt(req.params.id, 10);
    db.todo.destroy({
        where: {
            id: todoId
        }
    }).then(function(data) {
        if (data) {
            res.status(204).send();
        } else {
            res.status(404).json({error: 'Cannot delete ToDo with requested Id. No Todo found!'});
        }
    }, function(err) {
        res.status(500).send(err);
    });
});

// PUT /todos/:id
app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
    var body = _.pick(req.body, 'description', 'completed');
    var todoId = parseInt(req.params.id, 10);
    var attributes = {};

    if (body.hasOwnProperty('completed')) {
        attributes.completed = body.completed;
    }

    if (body.hasOwnProperty('description')) {
        attributes.description = body.description;
    }

    db.todo.findById(todoId).then(function(data) {
        if (data) {
            data.update(attributes).then(function(data) {
                res.json(data.toJSON());
            }, function(err) {
                res.status(400).send(err);
            });
        } else {
            res.status(404).send();
        }
    }, function(err) {
        res.status(500).send();
    });
});

db.sequelize.sync({force: true}).then(function() {
    app.listen(PORT, function() {
        console.log('Express Listening on PORT: ' + PORT);
    });
});