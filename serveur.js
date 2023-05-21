const app = require('express')();
const { readFileSync, appendFileSync, writeFileSync} = require('fs');
var serve_static = require('serve-static');
var serveur = require('http').Server(app);
app.use(serve_static(__dirname + "/public"));
console.log(__dirname + "/public");
serveur.listen(8080, function () {
    console.log('écoute sur le port 8080')
});

var io = require('socket.io')(serveur);

var listRegister = JSON.parse(readFileSync('register.json', 'utf8'));
var listLoggedIn = []
var message = JSON.parse(readFileSync('mainpage.json', 'utf8'));

io.on('connect', function (socket) {
    
    socket.on('register', function (user) {
        console.log(user.pseudo + " à essayé de ce register");
        var res = false;
        if (listRegister.length == 0) {
            socket.emit('alert', "Vous êtes bien enregistré " + user.pseudo + " !");
            listRegister.push(user);
            const listToJSON = JSON.stringify(listRegister);
            writeFileSync('register.json', listToJSON, 'utf8');
        }
        else {
            for (n of listRegister) {
                if (n.pseudo == user.pseudo) {
                    socket.emit('alert', "le nom d'utilisateur " + user.pseudo + " existe déjà.");
                    res = true;
                    break;
                }
            }
            if (res == false) {
                socket.emit('alert', "Vous êtes bien enregistré " + user.pseudo + " !");
                listRegister.push(user);
                const listToJSON = JSON.stringify(listRegister);
                writeFileSync('register.json', listToJSON, 'utf8');
            }
        }
    })

    socket.on('login', function (user) {
        console.log(user.pseudo + " a essayé de ce login");
        var res = false;

        if (listRegister.length == 0) socket.emit('alert', "Desolé mais on ne vous connait pas.")
        else {
            for (n of listRegister) {
                if (n.pseudo == user.pseudo && n.mdp == user.mdp) {
                    socket.emit('alert-log-good', user, "Bienvenue " + user.pseudo + " !");
                    listLoggedIn.push(user);
                    for (u in listLoggedIn)
                    {
                        io.emit('newuser', u);
                    }
                    console.log(listLoggedIn);
                    res = true;
                    break;
                }
                else if (n.pseudo == user.pseudo && n.mdp != user.mdp) {
                    socket.emit('alert', "Votre mot de passe est incorrect " + user.pseudo);
                    res = true;
                    break;
                }
            }
            if (res == false) {
                socket.emit('alert', "Desolé mais on ne vous connait pas");
            }
        }
    })

    socket.on('chat-msg', function (user, msg) {
        io.emit('chat-msg', user, msg);
        var now = new Date();
        var tmp = {"user": user, "msg":msg, "time": now.getDate()};
        message.push(tmp);
        const listToJSON = JSON.stringify(message);
        writeFileSync('mainpage.json', listToJSON, 'utf8');
    });
    
    /*socket.on('charge-page', function(){
        for (m of message)
        {
            io.emit('chat-msg', m["user"], m["msg"]);
        }
    });*/
});

io.on('disconnect', function (socket){
    console.log("quelqu'un vient de ce déco");
});