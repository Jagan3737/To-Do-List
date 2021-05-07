const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const ejsLint = require("ejs-lint");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.use(express.static("public"));

app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb+srv://admin-jagan:" + process.env.MONGOPASSWORD + "@cluster0.gskc5.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const itemSchema = new mongoose.Schema({
  name: String
});

const Task = mongoose.model("Task", itemSchema);

const cooking = new Task({
  name: "Welcome!"
});

const studying = new Task({
  name: "Hit + to add new task"
});

const playing = new Task({
  name: "← Hit this to delete"
});

const defaultTasks = [cooking, studying, playing];


const listSchema = new mongoose.Schema({
  name: String,
  list: [itemSchema]
});

const List = mongoose.model("List", listSchema);

app.set('view engine', 'ejs');

app.get("/", function(req, res) {
  Task.find({}, function(err, tasks) {
    if (tasks.length === 0) {
      Task.insertMany(defaultTasks, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully inserted");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        title: "Today",
        tasks: tasks
      });
    }
  });
});

app.post("/", function(req, res) {
  const newTask = req.body.task;
  const listName = req.body.list;

  const addTask = new Task({
    name: newTask
  });

  if (listName === "Today") {
    addTask.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.list.push(addTask);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Task.deleteOne({
      _id: checkedItemId
    }, function(err) {
      if (err) {
        console.log(err);
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        list: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});


app.get("/:name", function(req, res) {
  const listName = _.capitalize(req.params.name);

  List.findOne({
    name: listName
  }, function(err, foundList) {
    if (err) {
      console.log(err);
    } else {
      if (!foundList) {
        const list = new List({
          name: listName,
          list: defaultTasks
        });
        list.save(function() {
          res.redirect("/" + listName);
        });
      } else {
        res.render("list", {
          title: foundList.name,
          tasks: foundList.list
        });
      }
    }
  })
});

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server running successfully");
});
