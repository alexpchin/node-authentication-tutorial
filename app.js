// Connect.sid is going to be saved to Cookies in the browser
// s%3Ay_KaPzLyr44Fag5ssXvqQGjNCtGwxo17.mvqJ5cYCzHGh7kLmRMijh8jspXBP3fIlQrpFeYFqKTo localhost / Session 91  ✓     
// s% means digitally signed

// When you make changes to this file, the server will restart
// Which will lose your session on the serverside memory

// Commented out for reference 
// var fs = require('fs');
// var https = require('https');

var express = require("express");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');

var passport = require('passport');
var passportLocal = require('passport-local');
var passportHttp = require('passport-http');

var app = express();

// Commented out for reference
// var server = https.createServer({
//   cert: fs.readFileSync(__dirname + '/my.crt'), // Okay to be synchronous
//   key: fs.readFileSync(__dirname + '/my.key')
// }, app);

app.set("view engine", "ejs");

// Setup so that express can use server-side sessions
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());

// Needs to be the same across servers
app.use(expressSession(
{
  secret: process.env.SESSION_SECRET || "hereisasecret",
  resave: false,
  saveUninitialized: false
}
));

app.use(passport.initialize());
app.use(passport.session());

// Teaching passport how to validate our user credentials
// Using username and password login
passport.use(new passportLocal.Strategy(verifyCredentials));

// Not going to use cookies, instead going to have a header that includes
// Username and password?
passport.use(new passportHttp.BasicStrategy(verifyCredentials));

function verifyCredentials(username, password, done){
  // Pretend this is using a real database
  if (username === password) {
    done(null, { id: username, name: username });
  } else {
    done(null, null);
  }
}

// Passport doesn't want to store the user object into the session state
// This is because you might be storing your sessions on another server
// You really want to just store a "momento"
// Passport invokes this
passport.serializeUser(function(user, done){
  // Give a small portion of the user object to the callback
  done(null, user.id)
});

passport.deserializeUser(function(id, done) {
  // Query database or cache here!
  done(null, { id: id, name: id });
})

// Homemade middleware
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    // In an api we shouldn't res.redirect("/login");
    // So we say forbidden, 403
    res.send(403);
  }
}

app.get("/", function(req, res){
  res.render("index", {
    isAuthenticated: req.isAuthenticated(), // From passport
    user: req.user
  });
});

app.get("/login", function(req,res) {
  res.render("login");
});

// If it succeeds, the passport will save serverside in session
app.post("/login", passport.authenticate('local'), function(req, res) {
  res.redirect("/");
});

app.get("/logout", function(req, res) {
  req.logout(); // Added by passport
  res.redirect("/");
});

// Use http basic authentication, this will generate a pop-up
// /api does not use sessions but instead always passes username/password
// Basic header -> atob("YWxleDphbGV4");
// Not secure unless you are using SSL or TLS
app.use("/api", passport.authenticate('basic', { session: false }));

app.get("/api/data", ensureAuthenticated, function(req, res) {
  res.json([
    {value: 'foo'},
    {value: 'bar'},
    {value: 'baz'}
  ]);
});

var port = process.env.PORT || 1337;

app.listen(port, function(){
  console.log("http://127.0.0.1:" + port + "/");
})

// If you are using https
// server.listen(port, function() {
//   console.log("http://127.0.0.1:" + port + "/");
// })