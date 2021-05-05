require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const {Schema} = mongoose;
const { nanoid } = require('nanoid');
const bodyParser = require('body-parser')
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json())

mongoose.connect(process.env.DB_URI, {useNewUrlParser:true, useUnifiedTopology:true});
const addrSchema = new Schema({
  fullUrl:{type:String, required:true},
  shortUrl:{type:String, required:true}
});
const Addr = mongoose.model("Addr", addrSchema);
  
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post("/api/shorturl/new",async (req, res)=>{
  let inputUrl = req.body['url']
	console.log(inputUrl)
  let urlRegMatch = new RegExp("^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?")
  if (!urlRegMatch.test(inputUrl)){
    res.json({error:"Invalid URL"})
  }else{
	//check if it exists already
	  //if yes use that one else create a new entry
	let item = await Addr.exists({fullUrl: inputUrl}) 
	  if (!item){
			new Addr({fullUrl: inputUrl, shortUrl : nanoid(10)}).save((err, data)=>{
				if(err) console.error(err)
					console.log(data)
				const [{fullUrl, shortUrl}] = data

					res.json({ original_url : fullUrl, short_url : shortUrl })
				console.log(data)
			})
	  }else{
			const items = await Addr.find({fullUrl: inputUrl});
			const [{fullUrl , shortUrl}] = items;

			res.json({original_url: fullUrl, short_url: shortUrl})
	  }
	   }

})

app.get('/api/shorturl/:url', async (req, res)=>{
	//find a short url in the db and rdirect to the full url
	const {url} = req.params
	const items = await Addr.find({shortUrl: url});
	const [{fullUrl}] = items
	console.log(url)
	console.log(fullUrl)
	if(items){
		return res.redirect(fullUrl);
	}else{
		res.json({Error:"unknown url"})
	}

})


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


