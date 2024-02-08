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

- TODO: document level store, similarity search related functions. 

