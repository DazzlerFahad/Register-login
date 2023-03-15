const path = require('path');
const fs = require('fs');

const {Wallets} = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');

const connectionProfilePath = path.join(__dirname,'..','connection-profiles','connection-org1.json');
const connectionProfileJson = fs.readFileSync(connectionProfilePath);
const connectionProfileObject = JSON.parse(connectionProfileJson);

const caInfo = connectionProfileObject.certificateAuthorities['ca.org1.example.com'];
const caTLSCACerts = caInfo.tlsCACerts.pem;
const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

const walletPath = path.join(__dirname,'..','wallet'); //path where all ID are stored

//to enroll a admin
const enrollAdmin = async () => {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const identity = await wallet.get('admin');
    if(identity){ //check if ADMIN already exist
        console.log('ADMIN ID ALREADY EXISTS IN WALLET');
        return;
    }
    //enroll the admin if not exist
    const enrollment = await ca.enroll({enrollmentID: 'admin', enrollmentSecret: 'adminpw'});
    let x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: 'Org1MSP',
        type: 'X.509',
    };
    await wallet.put('admin',x509Identity);
    console.log("ENROLLED ADMIN SUCCESSFULY");
}
//to register a client user
const registerUser = async (username) => {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const identity = await wallet.get(username);
    if(identity){
        console.log(`USER ID: ${username} ALREADY EXISTS IN WALLET`)
        return;
    }
    let adminIdentity = await wallet.get('admin');
    if(!adminIdentity){
        console.log("ADMIN MUST BE ENROLLED BEFORE REGISTERING USER");
        console.log("ENROLLING ADMIN");
        await enrollAdmin();
        adminIdentity = await wallet.get('admin');
    }
    const provider = await wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');
    const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: username, role: 'client'}, adminUser);
    const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret });
    let x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: 'Org1MSP',
        type: 'X.509',
    };
    console.log(x509Identity);
    await wallet.put(username,x509Identity);
    console.log('ENROLLED USER SUCCESSFULY')
}

module.exports = {enrollAdmin,registerUser};