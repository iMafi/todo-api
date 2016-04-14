var express = require('express');
var app = express();
var bodyParser = require('body-parser');

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
    var todo = todos.filter(function(item) {
        return item.id === todoId;
    })[0];

    if (todo) {
        res.json(todo);
    } else {
        res.status(404).send('Cannot find ToDo with requested Id');
    }
});

// POST /todos
app.post('/todos', function(req, res) {
    var body = req.body;
    body.id = todoNextId++;
    todos[todos.length] = body;
    res.json(body);
});

app.listen(PORT, function() {
    console.log('Express Listening on PORT: ' + PORT);
});