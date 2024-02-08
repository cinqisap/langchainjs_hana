import * as hanaClient from '@sap/hana-client';
import { HanaDB, HanaDBArgs } from 'lib/hanavector';
import { OpenAIEmbeddings } from "@langchain/openai";

export const run = async () => {
// Connection parameters
const connectionParams = {
  host : process.env.HOST,   
  port : process.env.PORT,   
  uid  : process.env.UID,        
  pwd  : process.env.PWD
};

// Create a new client instance
const client = hanaClient.createConnection();

try {
    // Connect to the database
    await new Promise((resolve, reject) => {
        client.connect(connectionParams, (err) => {
            if (err) {
                console.error('Connection error', err);
                reject(err);
            } else {
                console.log('Connected to SAP HANA successfully.');
                resolve(null);
            }
        });
    });
    

const tableExistsSQL = `SELECT COUNT(*) AS COUNT FROM SYS.TABLES WHERE SCHEMA_NAME = CURRENT_SCHEMA AND TABLE_NAME = 'test'`;
const columnExistsSQL = `SELECT DATA_TYPE_NAME, LENGTH 
FROM SYS.TABLE_COLUMNS 
WHERE SCHEMA_NAME = CURRENT_SCHEMA AND 
TABLE_NAME = 'EMBEDDINGS'  
AND COLUMN_NAME = 'VEC_TEXT'`;

const args: HanaDBArgs = {
    connection: client,
    tableName: 'test2'
    };
      
    // let stm = client.prepare(columnExistsSQL);
    // let resultSet = stm.execQuery();
    // console.log(resultSet.getRowCount())
    // // Execute the query
    // var numcolumns = resultSet.getColumnCount();
    // while(resultSet.next()) {
    //     for(var i = 0; i < numcolumns; i++) {
    //         console.log("column %d: ", i+1, resultSet.getValue(i));
    //     }
    // }
    // const results = await client.execute(columnExistsSQL);
    // console.log(results);

// const hanaDb = new HanaDB(new OpenAIEmbeddings(), args);
// await hanaDb.initialize();
// var filter = { };
// await hanaDb.delete({filter : filter})

const vectorStore = await HanaDB.fromTexts(
    ["foo", "bar", "baz"],
    [{ page: 1 }, { page: 2 }, { page: 3 }],
    new OpenAIEmbeddings(),
    args
    );
    // hanaDb.tableExists('EMBEDDINGS').then(exists => {
    //     console.log('Table exists:', exists);
    // }).catch(error => {
    //     console.error('Error in tableExists:', error);
    // });

    // hanaDb.createTableIfNotExists()
} catch (error) {
    console.error('Error:', error);
} finally {
    // Disconnect from the database
    // client.disconnect();
}
}