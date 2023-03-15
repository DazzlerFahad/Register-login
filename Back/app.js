//-----------------------------------------------DEFAULT IMPORTS
const http = require('http');
const fs = require('fs');
const path = require('path');
//-----------------------------------------------INSTALLED IMPORTS
const express = require('express'); 
const bodyParser = require('body-parser'); 
const cors = require('cors');
const {Gateway, Wallets} = require('fabric-network');
//-----------------------------------------------RELATIVE IMPO
const walletHelper = require('./lib/wallet');
//-----------------------------------------------CONNECTION PROFILE
const connectionProfilePath = path.join(__dirname,'connection-profiles','connection-org1.json');
const connectionProfileJson = fs.readFileSync(connectionProfilePath);
const connectionProfileObject = JSON.parse(connectionProfileJson);
//-----------------------------------------------DEFINE WALLETPATH,CONTRACTNAME,CHANNELNAME 
const walletPath = path.join(__dirname,'wallet');
const contractName = 'inventman'; //provide contract name here
const channelName = 'mychannel'; //provide channel name here




//-----------------------------------------------EXPRESS INITIALIZE
const app = express();
//-----------------------------------------------JSON PARSER
app.use(bodyParser.json());
//-----------------------------------------------CORS
app.use(cors()); 
//-----------------------------------------------REGISTER INFRASTRUCTURE PROVIDERS
app.post('/register',async (req,res)=>{
    const empid = req.body.empid
    const firstName = req.body.firstname;
    const middleName = req.body.middlename;
    const lastName = req.body.lastname;
    const email = req.body.email;
    const mobile = req.body.mobile;
    const password = req.body.password;
    console.log(empid, firstName, middleName, lastName, email,mobile, password);
    try{
        await walletHelper.registerUser(empid);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        const gateway = new Gateway();
        await gateway.connect(connectionProfileObject,{wallet,identity:empid,discovery:{ enabled:true,asLocalhost:true}});
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(contractName);
        await contract.submitTransaction('registerUser',empid, firstName, middleName, lastName, email,mobile, password);
        res.send({
            status : 'success',
            error: null,
            message: null
        })
    }catch(err){
        res.send({
            status : 'failure',
            error  : err.name,
            message : err.message
        });
    }
})

app.post('/login',async (req,res)=>{
    const empid = req.body.empid
    
    console.log(empid);
    try{
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        const gateway = new Gateway();
        await gateway.connect(connectionProfileObject,{wallet,identity:empid,discovery:{ enabled:true,asLocalhost:true}});
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(contractName);
        let result = await contract.evaluateTransaction('loginUser',empid);
        result = JSON.parse(result.toString());
        res.send(result);
        if(result.password != password){
            res.send({
                status : 'failure',
                error : 'Incorrect password',
                message : 'incorrect password'
            })
        }
        else{
            res.send({
                status : 'success',
                payload : result,
                error : null,
                message : null
            })
        }
    }catch(err){
        res.send({
            status : 'failure',
            error  : err.name,
            message : err.message
        });
    }
})

const server = http.createServer(app);
server.listen(3000);

