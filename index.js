require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dns = require('dns');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const shortenedURLSchema = new mongoose.Schema({
  original: String,
  short: Number
});

const ShortenedURL = mongoose.model('shortenedURL', shortenedURLSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/api/shorturl', bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


app.post('/api/shorturl', (req, res) => {
  const desiredURL = req.body.url;

  let urlRegex = /https:\/\/www.|http:\/\/www./g;

  const urlPattern = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
  if(!desiredURL.match(urlPattern)){
    console.log('invalid URL provided')
    res.json({ error: 'invalid url' })
  }
    
  console.log(`${desiredURL} exists`);
  ShortenedURL.findOne({ original: desiredURL }, (err, foundURL) => {
    if (err) {
      console.log(err);
    } else {
      if(foundURL){
        res.json({ 'original_url': foundURL.original, 'short_url': foundURL.short})
      } else{
        ShortenedURL.countDocuments((err, count) => {
          if (err) {
            console.error(err);
          } else {
            console.log(`There are ${count} items in the collection.`);
            const newSmallURL = count + 1
            const newURL = new ShortenedURL({
              original: `${desiredURL}`,
              short: newSmallURL
            })

            newURL.save((err, item) => {
              if (err) {
                console.error(err);
              } else {
                console.log(item);
              }
            });

            res.json({ 'original_url': desiredURL, 'short_url': newSmallURL})
          }
        });
      }
    }
  })
})

app.get('/api/shorturl/:shorturl?', (req, res) => {
  const shortURL = req.params.shorturl;
  ShortenedURL.findOne({ short: shortURL }, (err, foundURL) => {
    if (err){
      console.error(err)
    } else {
      console.log(foundURL.original)
      res.redirect(foundURL.original);
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});