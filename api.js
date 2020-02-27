var express = require('express');
var module = require('./test');
 
var hostname = 'localhost'; 
var port = 3000; 
 
var app = express(); 

var myRouter = express.Router();

myRouter.route('/search')
.get(function(req,res){

    var escale_array = (req.query.escale).split(",");
    var date_depart_array = (req.query.date_depart).split(",");
    var date_retour_array = (req.query.date_retour).split(",");

    /*res.json({message : "Réponse à la recherche", 
    depart: req.query.depart, 
    arrivee: req.query.arrivee,
    escale: escale_array,
    date_depart: date_depart_array,
    date_retour: date_retour_array,
    method : req.method});*/
    const json = module(req.query.depart,req.query.arrivee,escale_array,date_depart_array,date_retour_array);
    res.json(json);
});

app.use(myRouter);

app.listen(port, hostname, function(){
	console.log("Mon serveur fonctionne sur http://"+ hostname +":"+port+"\n"); 
});