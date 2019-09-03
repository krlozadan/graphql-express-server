import "dotenv/config";
import cors from 'cors';
import express from 'express';
import uuidv4 from 'uuid/v4';
import { ApolloServer, gql } from 'apollo-server-express';

const app = express();
app.use(cors());

const users = {
    1: {
        id: '1',
        username: 'Bravo',
        first_name: "Carlos",
        last_name: "Cortes",
        messages: []
    },
    2: {
        id: '2',
        username: 'Delta',
        first_name: "Dominic",
        last_name: "Derulo",
        messages: []
    },
};

const messages = {};

const schema = gql(`
    type Query {
        me: User
        user(id: ID!): User
        users: [User!]
        messages: [Message!]!
        message(id: ID!): Message!
    }
    type User {
        id: ID!
        username: String!
        first_name: String
        last_name: String
        full_name: String
        messages: [Message]
    }
    type Message {
        id: ID!
        text: String!
        user: User!
    }
    type Mutation {
        createMessage(text:String!):Message!
        deleteMessage(id: ID!):Boolean
    }
`);

/**
 * The parameters in the resolvers are:
 * parent: could have the current object, for instance in a type resolver
 * args: arguments passed by schema
 * context: data shared across the request serie
 * info: information about the graphql request
 */
const resolvers = {
    Query: {
        me: (parent, args, { me }) => me,
        user: (parent, { id }) => users[id], 
        users: () => Object.values(users),
        messages: () => Object.values(messages),
        message: (parent, { id }) => messages[id]
    },
    User: {
        full_name: user => `${user.first_name} ${user.last_name}`,
        messages: user => user.messages.map(mId => messages[mId])
    },
    Message: {
        user: msg => users[msg.userId]
    },
    Mutation: {
        createMessage: (parent, { text }, { me }) => {
            const id = uuidv4();
            messages[id] = {
                id: id,
                text,
                userId: me.id
            };
            users[me.id].messages.push(id);
            return messages[id];
        },
        deleteMessage: (parent, { id }, { me }) => {
            const { [id]: message, ...otherMessages } = messages;
            if (!message) return false;
            messages = otherMessages;
            return true;
        }
    }
}

const server = new ApolloServer({
    typeDefs: schema,
    resolvers,
    // Pass the context that will be shared across all queries or mutations for the current series
    context: {
        me: users[1]
    }
});

server.applyMiddleware({ app, path: '/graphql' });

app.listen({ port: process.env.PORT }, () => {
    console.log(`Apollo Server on http://localhost:${process.env.PORT}/graphql`);
});