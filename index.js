import express from 'express';
import mongodb from 'mongodb';
import expressHandlebars from 'express-handlebars';
import bodyParser from 'body-parser';

const handlebars = expressHandlebars.create({
	defaultLayout: 'main', 
	extname: 'hbs'
});

const app = express();

app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');

app.use(express.static('public'));
app.use(express.json());

app.use(bodyParser.urlencoded({extended: true}));

const url = 'mongodb://localhost:27017/';

const client = new mongodb.MongoClient(url);

(async () => {
	try {
		await client.connect();
		const db = client.db('test');
		app.locals.collection = db.collection('prods');
        app.listen(3000);
	} catch (err) {
        console.log(err);
    } finally {
        await client.close();
    }
})();

app.get('/', (req, res) => {
    res.send('ok');
});

app.get('/prods', async (req, res) => {
    await client.connect();
    const collection = req.app.locals.collection;
    try {
        const prods = await collection.find().toArray();
        res.render('prods', {prods: prods})
    } catch (err) {
        console.log(err)
    }
});

app.get('/prods/show/:name', async (req, res) => {
    await client.connect();
    const collection = req.app.locals.collection;
    const name = req.params.name;
    try {
        const prod = await collection.findOne({name: name});
        if (prod) {
            res.render('prod', {prod: prod})
        } else {
            res.status(404).send('page not found')
        }
    } catch (err) {
        console.log(err);
        res.status(404).send('page not found')
    }
});

app.get('/prods/delete/:name', async (req, res) => {
    await client.connect();
    const collection = req.app.locals.collection;
    const name = req.params.name;
    try {
        const deletedProd = await collection.findOne({name: name});
        const prod = await collection.deleteOne({name: name});
        if (prod) {
            res.redirect(301, '/prods')
        } else {
            res.status(404).send('page not found')
        }
    } catch (err) {
        console.log(err);
    }
});

app.get('/prods/add', (req, res) => {
    res.render('add')
});

app.post('/prods/add', async (req, res) => {
    await client.connect();
    const collection = req.app.locals.collection;
    const prod = req.body;
    try {
        await collection.insertOne(prod);
        res.redirect(301, '/prods')
    } catch (err) {
        res.status(404).send('product not found');
    }
});

app.get('/prods/edit/:name', async (req, res) => {
    await client.connect();
    const name = req.params.name;
    const collection = req.app.locals.collection;
    const prod = await collection.findOne({name: name});
    console.log(prod)
    res.render('edit', {prod: prod});
});

app.post('/prods/edit/:name', async (req, res) => {
    await client.connect();
    const name = req.params.name;
    const collection = req.app.locals.collection;
    const prod = req.body;
    try {
        await collection.updateOne({name: name}, {$set: prod});
        res.redirect(301, '/prods');
    } catch (err) {
        res.status(404).send('product not found');
    }
})

app.use((req, res) => {
    res.status(404).send('page not found')
})
