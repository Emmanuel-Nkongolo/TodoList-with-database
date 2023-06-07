//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose"); 
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//putting mongoose to be the data type
//here is the normal port
//mongoose.connect("mongodb://127.0.0.1:27017/todolistDB")

mongoose.connect("mongodb+srv://<yourName-and password here>@cluster0.emvm6in.mongodb.net/todolistDB");
//The creation of the schema or structure of our items
const itemsSchema = {
  name : String
};
//Crafting up our mongoose model to apply our item db
const Item = mongoose.model("Item",itemsSchema);

//creating our 3 new items 
const eat = new Item({
  name: "Eat"
});
const rest = new Item({
  name: "Rest"
});
const study = new Item({
  name : "Study" 
});
// creating the array of item to save in our collection database
const defaultItems = [eat, rest, study];

//creating our new schema
const listSchema= {
  name : String,
  items : [itemsSchema]
};
//creating our mongoose model
const List = mongoose.model("List", listSchema);



// the root route or the home route
app.get("/", function(req, res) {

  //using the find method to check our array of data we put on earlier 

  Item.find()
  .then(function(items){
    //The check up for our itemlist || condition for inserting Defaultitems in our collection
    if (items.length === 0){
      //inserting our items in the todolistDB collection

      Item.insertMany(defaultItems)
      .then(function(result){
        console.log("It was a success");
      }) 
      .catch(function(error){
        console.log(error);
      });
      // redirecting for completion so it can display the defaultitems of our array
      res.redirect("/");
    } else {
      //rendering the todolist in our home page
      res.render("list", {listTitle: "Today", newListItems: items});
    }
    })
  .catch(function(error){
    console.log(error);
  })

  

});

app.post("/", function(req, res){
//taking the input from the ejs list 
  const itemName = req.body.newItem;

  //taking the button respond from our ejs list
  const listName = req.body.list
  
  // creating our newitem document || linking our ejs form with our mongoose database
 const item = new Item({
  name : itemName
});
// creating a if to check where to add our new item 
if(listName === "Today"){
// using the mongoose shortcut to save our item into the list 

item.save();
//redirect as a refresh to show the action
  res.redirect("/");
} else {
  // using another findOne to add the new item from the custom page created 
  List.findOne({name : listName})
  .then(function(foundList){
    //using foundList to get into the items and push the new item
    foundList.items.push(item);
  // saving the foundList so it get added to the list the user is currently typing from
    foundList.save();
    //redirecting the user to the page to save up the advancement
    res.redirect("/"+ listName);
  })//handling the error incase i get any and giving the user a message as well
  .catch(function(err){
    console.log(err);
    res.status(500).send("Error occurred while retrieving items")
  })
}
});

// creating a new route for the checked items 

app.post("/delete",function(req, res){
 
  // saving the checkedbox result in a variable
  const checkedItemId = req.body.checkbox;
  
  //getting a hold of our hidden input response
  const listName = req.body.listName;
   
  //putting a condition to to delete items and where
  if(listName === "Today"){
      Item.findByIdAndRemove(checkedItemId)
      .then(function(){
        console.log("successfully deleted");
      })
      .catch(function(error){
        console.log(error);
      }); res.redirect("/");
    
    
  } else {//using the findOneAndUpdate method by passing our listname and our checkeditemid 
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}})
    //alternative to our callback to get it to work 
    .then(function(foundList){
      //redirecting our user to the list with the update
      res.redirect("/" + listName);
    })//handling the error on both the user and the internal dev
    .catch(function(err){
      console.log(err);
      res.status(500).send("Error occurred while retrieving items")
    });
  }
 
  //Deleting the item from our item collection in mongoose in the home list
  // Item.deleteOne({_id: checkedItemId})
 
 
})

app.get("/:customListName", function(req, res){
  //putting lodash to use so we can have only the first letter in uppercase
  const customListName = _.capitalize(req.params.customListName);
//Use of findOne method to move freely inside our Database(loop)
  List.findOne({ name: customListName })
  .then(function(foundList) {
    if (!foundList) {
      // creating our new list based off our list model
  const list = new List({
    name: customListName,
    items: defaultItems
  });
  //saving the list using the mongoose way
  list.save();
  //now creating a route to our new list
  res.redirect("/" + customListName );
    } else {
      //show and existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
    }
  })
  .catch(function(err){
    console.log(err);
  });
})

  //Heroku deplying hosting route  
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
//hosting the app.js in our localhost
app.listen(port, function() {
  console.log("Server started successfully.");
});
