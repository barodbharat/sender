const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const app = express();
const port = process.env.port || 3001;

app.use(express.json({ limit: '50mb' }));

app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const client = new Client({
    puppeteer: {headless:true, 
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
        ]},
    authStrategy: new LocalAuth() //new LocalAuth({ clientId: "YourClientId1" }) //new LocalAuth()
});

var qrstr = '';
var status = '';

// Generate QR code in terminal
client.on('qr', (qr) => {
        qrstr = qr;
        status = '';        
        //console.log('Qr Event Reply WStatus = ' + wstatus + ' QrCode = '+qrstr)
        //res.status(200).send({ qrCode: qr })
    })

client.on('ready', async () => {
    status = 'ready'
    qrstr = '';
    console.log('Ready Event Reply WStatus = ' + status + ' QrCode = '+qrstr)
    //reply='ok'
    //res.status(200).json({ status: 'ok'});
})

client.on('authenticated', () => {
    status = 'authenticated'
    qrstr = '';
    //console.log("Client is authenticated!");
});

client.on('disconnected', () => {
    status = 'disconnected'
    qrstr = '';
    //console.log('Client disconnected:');
      // Handle the disconnection (e.g., reinitialize the client, display a message)
});

// Root check
app.get('/', (req, res) => {
    res.send('WhatsApp Web API is running!');
});

//Start Web.Whatsapp.Com
app.get('/whatsapp', async (req, res) => {
    try {
        client.on('qr', (qr) => {
            qrstr = qr;
            status = ''
            res.status(200).send({ qrCode: qr })
        })
        client.on('ready', async () => {
            status = 'ready'
            qrstr = '';
            res.status(200).json({ status: 'ok'});
        })
        await client.initialize()
        //res.status(200).send.json({message:'Ok'})
        //res.status(404)
    } catch (err) {
        console.log(err);
        res.status(404).send(err)
    }
})

// Send a text message
app.post('/send-message', async (req, res) => {
    client.getState().then((data)=>{
        //console.log(data)
        if (data != 'CONNECTED') {
            return res.json({status: false, message:'Whatsapp not CONNECTED'})
        }
    })

    const q = req.body;
    //const { number, message } = req.body;

    if (!q.number || !q.message) {
        return res.status(400).json({ status: false, message: 'Missing number or message' });
    }

    const chatId = q.number.endsWith('@c.us') ? q.number : `${q.number}@c.us`;

    try {
        await client.sendMessage(chatId, q.message);
        res.json({ status: true, message: 'Message sent!' });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Error sending message', error });
    }
});

// Send a media file (base64 format)
app.post('/send-media', async (req, res) => {
    client.getState().then((data)=>{
        //console.log(data)
        if (data != 'CONNECTED') {
            return res.json({status: false, message:'Whatsapp not CONNECTED'})
        }
    })
    
    const q = req.body;
    if (!q.number || !q.data || !q.filename || !q.mimetype) {
        return res.status(400).json({ status: false, message: 'Missing media parameters' });
    }

    const chatId = q.number.endsWith('@c.us') ? q.number : `${q.number}@c.us`;
    try {
        const media = new MessageMedia(q.mimetype, q.data, q.filename);
        await client.sendMessage(chatId, media);
        res.json({ status: true, message: 'Media sent!' });
    } 
    catch (error) {
        res.status(500).json({ status: false, message: 'Error sending media', error });
        await client.destroy();
    }

});

// Check client status
app.get('/status', (req, res) => {
    //const isReady = client.info ? true : false;
    //res.json({ status: isReady, clientInfo: client.info || null });
    client.getState().then((data)=>{
        //console.log(data)
        res.json({status: data})
    })
});

// Get Qr Code
app.get('/qrcode', (req, res) => {
    //const isReady = client.info ? true : false;
    //client.logout();
    //req.session.destroy()
    //req.session.regenerate();
    //client.LocalAuth({clientId: '10000'});
   
    //client.session = "00001";

    // client.on('qr', (qr) => {
    //     //console.log('QR RECEIVED');
    //     //qrcode.generate(qr, { small: true });
    //     qrcode = qr;
    //     status = '';
    //     res.json({ qrcode : qr});
    // });
    res.json({ status : status, qrcode : qrstr});
});

client.initialize();
// Start web server
app.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
});
