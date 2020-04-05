const { GraphQLServer, PubSub } = require("graphql-yoga");
const typeDefs = require("./typedefs.gql");
const morgan = require("morgan");

const tweets = [];
const animals = require("./lists/animals");
const adjectives = require("./lists/adjectives");

const TWEET_CHANGED_TOPIC = "TWEET";

const resolvers = {
  Query: {
    hello: () => `Hello`,
    tweets: () => tweets,
    username: () => {
      const animal = animals[Math.floor(Math.random() * animals.length)];
      const adjective1 =
        adjectives[Math.floor(Math.random() * adjectives.length)];
      const adjective2 =
        adjectives[Math.floor(Math.random() * adjectives.length)];
      return `${adjective1}-${adjective2}-${animal}`;
    },
  },
  Counter: {
    countStr: (counter) => `Current count: ${counter.count}`,
  },
  Subscription: {
    counter: {
      subscribe: (parent, args, { pubsub }) => {
        const channel = Math.random().toString(36).substring(2, 15); // random channel name
        let count = 0;
        setInterval(
          () => pubsub.publish(channel, { counter: { count: count++ } }),
          2000
        );
        return pubsub.asyncIterator(channel);
      },
    },
    tweet: {
      subscribe(root, args, { pubsub }) {
        return pubsub.asyncIterator(TWEET_CHANGED_TOPIC);
      },
    },
  },
  Mutation: {
    sendTweet(root, { from, message }, { pubsub }) {
      const tweet = { id: tweets.length + 1, from, message, time: new Date() };
      tweets.push(tweet);
      pubsub.publish(TWEET_CHANGED_TOPIC, { tweet: tweet });
      return tweet;
    },
  },
};

const pubsub = new PubSub();
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } });

const options = {
  port: 4000,
  endpoint: "/graphql",
  subscriptions: "/subscriptions",
  playground: "/",
};

server.express.use(morgan("dev"));

server.start(({ port }) =>
  console.log(`Server is running on localhost:${port}`)
);
