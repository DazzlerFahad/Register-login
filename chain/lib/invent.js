'use strict';

const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');


class InventoryContract extends Contract {

     // registration
     async registerUser(ctx, empid, firstName, middleName, lastName, email,mobile, password) {

        const userDetails = {
           empid,
           firstName,
           middleName,
           lastName,
           mobile,
           email,
           password
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(empid, Buffer.from(stringify(sortKeysRecursive(userDetails))));
        return JSON.stringify({status:"SUCCESS"});
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async loginUser(ctx, empid) {
        const userDetailJSON = await ctx.stub.getState(empid); // get the asset from chaincode state
        if (!userDetailJSON || userDetailJSON.length === 0) {
            throw new Error(`The user with id : ${empid} does not exist`);
        }
        // return JSON.stringify(userDetailJSON);
        return userDetailJSON.toString();
    }

    async GetAll(ctx){
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange("","");
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
   
}

module.exports = InventoryContract;