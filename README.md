# Langchain Typescript Plugin of SAP HANA Vector

## Quick install

After you clone the repo, follow these instructions:

1. Install packages
   `npm install`

2. Add OpenAI key, database related parameters as environment variables

- create a `.env` file in the root of the folder
- copy the environmental variables from `.env.example` into `.env` and replace with the keys.
  - [openAI](https://platform.openai.com/account/api-keys).
  - HOST (cloud instance address)
  - PORT
  - UID (user name)
  - PWD (user password)

## Usage

To run a test script in the repo:

`npm run start ./test/hanavector.ts`

## Functions implemented so far
- Initializations (sanity checks, table existence check)
```typescript
const hanaDb = new HanaDB(new OpenAIEmbeddings(), args);
await hanaDb.initialize();
```

- Delete previous contents in the table.
```typescript
var filter = { }; //empty filter means delete all.
await hanaDb.delete({filter : filter});
```

- Add simple texts and their embeddings into table.
```typescript
const vectorStore = await HanaDB.fromTexts(
    ["foo", "bar", "baz"],
    [{ page: 1 }, { page: 2 }, { page: 3 }],
    new OpenAIEmbeddings(),
    args
    );
    
```
This will create a table (specified in the args) and store (texts, metadatas, embeddings) into this table.

- Chunk documents and store
```typescript
var filter = { }; //delete previous contents if exist.
await hanaDb.delete({filter : filter});
// Load documents from file
const loader = new TextLoader("./state_of_the_union.txt");
const rawDocuments = await loader.load();
const splitter = new CharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 0
});
const documents = await splitter.splitDocuments(rawDocuments);
hanaDb.addDocuments(documents)
```
This will store the chunked documents and their embeddings into specified table name.

- Similiarity search using default consine, user specified arg and MRR search.
```typescript
//similiarity search using default cosine distance method
var query = "What did the president say about Ketanji Brown Jackson"
var docs = await hanaDb.similaritySearch(query, 2)
docs.forEach(doc => {
    console.log("-".repeat(80)); 
    console.log(doc.pageContent); 
});

```
The output is 

One of the most serious constitutional responsibilities a President has is nominating someone to serve on the United States Supreme Court.

And I did that 4 days ago, when I nominated Circuit Court of Appeals Judge Ketanji Brown Jackson. One of our nation’s top legal minds, who will continue Justice Breyer’s legacy of excellence.

As I said last year, especially to our younger transgender Americans, I will always have your back as your President, so you can be yourself and reach your God-given potential.

While it often appears that we never agree, that isn’t true. I signed 80 bipartisan bills into law last year. From preventing government shutdowns to protecting Asian-Americans from still-too-common hate crimes to reforming military justice. 

```typescript
//similiarity search using euclidean distance method
var args: HanaDBArgs = {
    connection: client,
    tableName: 'test',
    distanceStrategy: DistanceStrategy.EUCLIDEAN_DISTANCE
    };
var hanaDb = new HanaDB(new OpenAIEmbeddings(), args);
var query = "What did the president say about Ketanji Brown Jackson"
var docs = await hanaDb.similaritySearch(query, 2)
docs.forEach(doc => {
    console.log("-".repeat(80)); 
    console.log(doc.pageContent); 
});
```
```typescript
//MMR search
var docs = await hanaDb.maxMarginalRelevanceSearch(query, {k:2, fetchK: 20})
console.log("MRR search")
docs.forEach(doc => {
    console.log("-".repeat(80)); 
    console.log(doc.pageContent); 
});
```

- Using a VectorStore as a retriever in chains for retrieval augmented generation (RAG)
```typescript
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
```
