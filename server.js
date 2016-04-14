var express = require('express');
var app = express();
var todos = [
    {
        description: 'Test Description 1',
        completed: false,
        id: 1
    }, {
        id: 2,
        description: 'Go To Market',
        completed: false
    }, {
        id: 3,
        description: 'Make todo API',
        completed: true
    }
];

var PORT = process.env.PORT || 3000;

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

app.listen(PORT, function() {
    console.log('Express Listening on PORT: ' + PORT);
});