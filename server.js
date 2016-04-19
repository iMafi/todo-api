var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var app = express();
var todos = [];
var todoNextId = 1;

var PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', function(req, res) {
    res.send('Todo API root');
});

// GET /todos
app.get('/todos', function(req, res) {
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
app.get('/todos/:id', function(req, res) {
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
app.post('/todos', function(req, res) {
    var body = _.pick(req.body, 'description', 'completed');

    db.todo.create(body).then(function(data) {
        res.json(data);
    }).catch(function(err) {
        res.status(400).json(err);
    });
});

// DELETE /todos/:id
app.delete('/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id, 10);
    var todo = _.findWhere(todos, {id: todoId});

    if (todo) {
        todos = _.without(todos, todo);
        res.json(todo);
    } else {
        res.status(404).json({error: 'Cannot delete ToDo with requested Id. No Todo found!'});
    }
});

// PUT /todos/:id
app.put('/todos/:id', function(req, res) {
    var body = _.pick(req.body, 'description', 'completed');
    var validAttributes = {};
    var todoId = parseInt(req.params.id, 10);
    var todo = _.findWhere(todos, {id: todoId});

    if (!todo) {
        return res.status(404).send();
    }

    if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
        validAttributes.completed = body.completed;
    } else {
        return res.status(400).send();
    }

    if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim()) {
        validAttributes.description = body.description;
    } else {
        return res.status(400).send();
    }

    _.extend(todo, validAttributes);
    res.json(todo);

});

db.sequelize.sync().then(function() {
    app.listen(PORT, function() {
        console.log('Express Listening on PORT: ' + PORT);
    });
});