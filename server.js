var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

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
    res.json(todos);
});

// GET /todos/:id
app.get('/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id, 10);
    var todo = _.findWhere(todos, {id: todoId});

    if (todo) {
        res.json(todo);
    } else {
        res.status(404).send('Cannot find ToDo with requested Id');
    }
});

// POST /todos
app.post('/todos', function(req, res) {
    var body = _.pick(req.body, 'description', 'completed');

    if (!_.isBoolean(body.completed) || !_.isString(body.description) || !body.description.trim()) {
        return res.status(400).send();
    }

    body.description = body.description.trim();
    body.id = todoNextId++;
    todos[todos.length] = body;
    res.json(body);
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

app.listen(PORT, function() {
    console.log('Express Listening on PORT: ' + PORT);
});