import * as hanaClient from '@sap/hana-client';
import { HanaDB, HanaDBArgs, DistanceStrategy } from 'lib/hanavector';
import { Document } from "@langchain/core/documents";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
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

var args: HanaDBArgs = {
    connection: client,
    tableName: 'test',
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

var hanaDb = new HanaDB(new OpenAIEmbeddings(), args);
const docs: Document[] = [
    {
        pageContent: "foo",
        metadata: { start: 100, end: 150, docName: "foo.txt", quality: "bad" },
    },
    {
        pageContent: "bar",
        metadata: { start: 200, end: 250, docName: "bar.txt", quality: "good" },
    },
];
// var filter = { };
// await hanaDb.delete({filter : filter})
// hanaDb.addDocuments(docs)

// var query = "foobar"
// var results = await hanaDb.similaritySearch(query, 2, {"quality": "bad"})
// results.forEach(results => {
//     console.log("-".repeat(80)); 
//     console.log(results.pageContent);
//     console.log(results.metadata);  
// });

// var filter = {"quality": "bad"};
// await hanaDb.delete({filter : filter})
// await hanaDb.initialize();
// var filter = { };
// await hanaDb.delete({filter : filter})
// hanaDb.addTexts(["foo", "bar", "baz"],
//     [{ page: 1 }, { page: 2 }, { page: 3 }])

// const vectorStore = await HanaDB.fromTexts(
//     ["foo", "bar", "baz"],
//     [{ page: 1 }, { page: 2 }, { page: 3 }],
//     new OpenAIEmbeddings(),
//     args
//     );

    // hanaDb.tableExists('EMBEDDINGS').then(exists => {
    //     console.log('Table exists:', exists);
    // }).catch(error => {
    //     console.error('Error in tableExists:', error);
    // });

    // hanaDb.createTableIfNotExists()

// Load documents from file
// const loader = new TextLoader("./state_of_the_union.txt");
// const rawDocuments = await loader.load();
// const splitter = new CharacterTextSplitter({
//   chunkSize: 500,
//   chunkOverlap: 0
// });
// const documents = await splitter.splitDocuments(rawDocuments);
// console.log(documents)
// hanaDb.addDocuments(documents)

//similiarity search using default cosine distance method
// var query = "What did the president say about Ketanji Brown Jackson"
// var docs = await hanaDb.similaritySearch(query, 2)
// docs.forEach(doc => {
//     console.log("-".repeat(80)); 
//     console.log(doc.pageContent); 
// });

// //similiarity search using euclidean distance method
// var args: HanaDBArgs = {
//     connection: client,
//     tableName: 'test',
//     distanceStrategy: DistanceStrategy.EUCLIDEAN_DISTANCE
//     };
// var hanaDb = new HanaDB(new OpenAIEmbeddings(), args);
// var query = "What did the president say about Ketanji Brown Jackson"
// var docs = await hanaDb.similaritySearch(query, 2)
// docs.forEach(doc => {
//     console.log("-".repeat(80)); 
//     console.log(doc.pageContent); 
// });

// //MMR search
// var docs = await hanaDb.maxMarginalRelevanceSearch(query, {k:2, fetchK: 20})
// console.log("MRR search")
// docs.forEach(doc => {
//     console.log("-".repeat(80)); 
//     console.log(doc.pageContent); 
// });

// Use the store as part of a chain
const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo-1106" });
const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "Answer the user's questions based on the below context:\n\n{context}",
  ],
  ["human", "{input}"],
]);

const combineDocsChain = await createStuffDocumentsChain({
  llm: model,
  prompt: questionAnsweringPrompt,
});

const chain = await createRetrievalChain({
  retriever: hanaDb.asRetriever(),
  combineDocsChain,
});

const response = await chain.invoke({
  input: "What about Mexico and Guatemala? ",
});

console.log("Chain response:");
console.log(`Number of used source document chunks: ${response.context.length}`);

} catch (error) {
    console.error('Error:', error);
} finally {
    // Disconnect from the database
    // client.disconnect();
}
}