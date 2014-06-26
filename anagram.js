var exec = require('child_process').exec;
var fs = require('fs');

// Module to hold keys for APIs
var Keys = require('keys');
var k = new Keys();

// Hold the current anagram and solution
var anagram;
var word;

// Holds the setTimeout interval so we can cancel if later if necessary
var interval;

// Client for accessing RESTful APIs
var RestClient = require('node-rest-client').Client;
var restClient = new RestClient();

// Twitter client
var Twit = require('twit');
var t = new Twit({
   consumer_key       : k.twitterConsumerKey,
   consumer_secret    : k.twitterConsumerSecret,
   access_token       : k.twitterAccessToken,
   access_token_secret: k.twitterAccessTokenSecret
});

// Set up a stream to look at all tweets for @AnagramBot
var stream = t.stream('user');

stream.on('tweet', function(tweet) {
   console.log('------------------------------------------------------------------------------------------------');
   console.log(tweet.user.screen_name + ' :: ' + tweet.id_str + ' :: ' + tweet.text);

   // Ignore tweets by @AnagramBot, but check all others for a correct answer
   if (tweet.user.screen_name.toLowerCase() != 'anagrambot') {

      // If the current word/solution is found in the tweet, the user who replied is the winner
      var re = new RegExp('\\b' + word.toLowerCase() + '\\b');
      if (tweet.text.toLowerCase().match(re))
          tweet_winner(tweet);
   }
});

// URL to get random words from Wordnik
var wordnikUrl = 'http://api.wordnik.com/v4/words.json/randomWords?' + 
                   'hasDictionaryDef=true&'                          + 
                   'minCorpusCount=9&'                               +
                   'minLength=8&'                                    +
                   'maxLength=14&'                                   +
                   'limit=50&'                                       +
                   'api_key=' + k.wordnikApiKey;

// Capitalizes every word in the given string
function capitalize(str) {
   var result = '';

   for (var i = 0; i < str.split(' ').length; i++) {
      if (i > 0)
         result = result + ' ';

      result = result + str.split(' ')[i].charAt(0).toUpperCase() + str.split(' ')[i].slice(1);
   }

   return result;
}

// Function that runs a python script to create an anagram from the letters parameter
function get_anagram(letters) {
   console.log(' - Getting anagram for ' + letters);
   var py = exec('./anagram.py "' + letters + '"', function (error, stdout, stderr) {

      if (error) {
         console.log(' - Error : ' + error);
         console.log(' - STDERR: ' + stderr);
         return;
      }

      anagram = capitalize(stdout);

      // Check to make sure we get a different word as an anagram, if not get a new one
      if (anagram.toLowerCase() == word.toLowerCase()) {
         console.log(' - Anagram and solution are the same!');
         clearInterval(interval);
         interval = setTimeout(function() { get_word() }, 10000);
         return;
      }

      // If no error, tweet the anagram
      tweet(anagram);
   });
}

// Use the Wordnik URL to get random words
function get_word() {
   console.log(' - Getting random words from Wordnik');

   restClient.get(wordnikUrl,
      function(data, response) {
         var json = JSON.parse(data);

         // Pick a random word from the result set until we find one that doesn't contain a dash,
         // or we've exhausted the set
         word = json.splice(Math.floor(Math.random() * json.length),1)[0].word;
         while (word.indexOf('-') >= 0 && json.length >= 0)
            word = json.splice(Math.floor(Math.random() * json.length),1)[0].word;

         // If we have a good word, make an anagram out of it
         if (word.indexOf('-') == -1) {
            console.log(' - Found word: ' + word);
            get_anagram(word);
         }
         // Otherwise wait 10 seconds and try again
         else {
            console.log(' - No valid word found, trying again...');
            clearInterval(interval);
            interval = setTimeout(function() { get_word() }, 10000);
         }
      }
   );
}

// Tweets the anagram parameter
function tweet(anagram) {
   console.log(' - Tweeting anagram ' + anagram + ' for ' + word);

   t.post('statuses/update', { status: anagram + '\n\nReply to solve #Anagram' }, function(err, data, response) {
      if (err)
         console.log(' - ' + err);

      // After tweeting, wait two hours for someone to solve it correctly, after which time start a new anagram
      clearInterval(interval);
      interval = setTimeout(function() { get_word() }, 2 * 60 * 60 * 1000);
   }); 
}

// Posts the last answer because no one solved it, and start a new one
function tweet_new() {
   console.log(' - No one solved the last anagram, creating new');

   t.post('statuses/update', { status: 'The solution to the last anagram (' + anagram + ') was ' + word }, function(err, data, response) {
      if (err)
         console.log(' - ' + err);

      // Tweet a new one in 5 seconds
      clearInterval(interval);
      interval = setTimeout(function() { get_word() }, 5000);
   });
}

// Favorites and replies to the winning tweet
function tweet_winner(tweet) {
   console.log(' - @' + tweet.user.screen_name + ' tweeted the correct answer, replying and favoriting (' + tweet.id_str + ')');

   t.post('favorites/create', { id: tweet.id_str, id_str: tweet.id_str }, function (err, data, response) {
      if (err)
         console.log(' - Favorite error: ' + err);
   });

   t.post('statuses/update', { status: '@' + tweet.user.screen_name + ' got the correct answer (' + capitalize(word) + ')!',
                               in_reply_to_status_id_str: tweet.id_str }, function (err, data, response) {
      if (err)
         console.log(' - Reply error: ' + err);

      // Get a new anagram in 5 seconds
      clearInterval(interval);
      interval = setTimeout(function() { get_word() }, 5000);
   });
}

// Start the first anagram
get_word();
