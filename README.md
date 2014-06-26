# Anagram Bot

*A twitter bot that generates anagrams and waits for people to solve them*

This bot gets a random word from Wordnik, makes an anagram out of it, tweets it and waits for someone to solve it (or
times out) and tweets a new one. It will reply to and favorite the winning tweet (if any).

**Dependencies**
 * The anagram.py script was taken (and slightly modified) from [here](http://stackoverflow.com/questions/55210/algorithm-to-generate-anagrams)
 * Uses a [Scrabble dictionary](http://www.isc.ro/lists/twl06.zip) for words
 * [Twitter](https://dev.twitter.com/) consumer keys and access tokens
 * [Wordnik](http://developer.wordnik.com/) key for pulling random words
 * [twit](https://www.npmjs.org/package/twit) Node twitter client
 * [node-rest-client](https://www.npmjs.org/package/node-rest-client) to make REST API calls
