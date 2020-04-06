<template>
  <div id="app">
    <h1>Twotter</h1>
    <h3>A bad twitter clone</h3>
    <div v-if="$apollo.loading">Loading....</div>
    <div v-else>
      <div class="input container">
        <!-- <input type="text" placeholder="from" v-model="from" /> -->
        <span>
          anon username: {{ from }}
          <span
            class="reroll"
            v-on:click.prevent="rerollUsername"
          >Change Username 🎲</span>
        </span>

        <textarea placeholder="message" v-model="message" id cols="30" rows="3"></textarea>
        <div class="button-area" v-if="loadingSubmit">Submitting message, please wait...</div>
        <div class="button-area" v-else>
          <span style="margin-right: 20px;">{{ message.length }}/140</span>
          <button class="button-input" v-on:click.prevent="submit">Send</button>
        </div>
      </div>

      <div v-for="tweet in tweetsSorted" :key="tweet.id">
        <div class="card">
          <div class="avatar" v-bind:style="{ 'background-color': avatarColor(tweet.from) }"></div>
          <div class="text">
            <span class="from">{{ tweet.from }}</span>
            <span class="message">{{ tweet.message }}</span>
            <span class="time">{{ formatDate(tweet.time) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import gql from "graphql-tag";
import ColorHash from "color-hash";

export default {
  name: "App",
  data() {
    return {
      // Initialize your apollo data
      tweets: [],
      message: "",
      from: "",
      username: "",
      loadingSubmit: false
    };
  },
  computed: {
    tweetsSorted() {
      const copyArr = this.tweets;
      return copyArr.sort((a, b) => b.id - a.id);
    }
  },
  watch: {
    username: function(val, oldVal) {
      if (oldVal === "" && localStorage.getItem("from") === "") {
        console.log("oldVal", oldVal);
        localStorage.setItem("from", val);
        this.from = val;
      }
    }
  },
  created() {
    this.colorHash = new ColorHash();
  },
  async mounted() {
    if (localStorage.getItem("from")) {
      this.from = localStorage.getItem("from");
    } else {
      if (this.username === "") {
        this.$apollo.queries.username.refetch();
      }
      await this.$nextTick();
      localStorage.setItem("from", this.username);
      this.from = this.username;
    }
  },
  methods: {
    async rerollUsername() {
      this.$apollo.queries.username.refetch();
      await this.$nextTick();
      localStorage.setItem("from", this.username);
      this.from = this.username;
    },
    formatDate(date) {
      return new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true
      }).format(new Date(parseInt(date)));
    },
    avatarColor(text) {
      return this.colorHash.hex(text);
    },
    async submit() {
      try {
        this.loadingSubmit = true;
        const from = this.from;
        const message = this.message;
        if (this.message.length > 140) {
          alert("Message too long");
          this.loadingSubmit = false;
          return;
        }
        if (this.from === "" || this.message === "") {
          alert("Please fill in all input");
          this.loadingSubmit = false;
          return;
        }
        const data = await this.$apollo.mutate({
          // Query
          mutation: gql`
            mutation sentTweet($from: String!, $message: String!) {
              sendTweet(from: $from, message: $message) {
                from
                message
              }
            }
          `,
          // Parameters
          variables: {
            from: from,
            message: message
          }
        });
        console.log(data);
        this.message = "";
        this.loadingSubmit = false;
        // this.tweets.push(data.tweet);
      } catch (error) {
        console.log(error);
      }
    }
  },
  apollo: {
    // Simple query that will update the 'tweets' vue property
    tweets: gql`
      query {
        tweets {
          from
          message
          id
          time
        }
      }
    `,
    username: gql`
      query {
        username
      }
    `,
    $subscribe: {
      tags: {
        query: gql`
          subscription {
            tweet {
              from
              message
              id
              time
            }
          }
        `,
        result({ data }) {
          this.tweets.push(data.tweet);
        }
      }
    }
  }
};
</script>

<style>
#app {
  font-family: Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}

.input.container {
  display: flex;
  flex-direction: column;
}

.input input,
.input textarea {
  background-color: #e6e6e6;
  color: rgb(0, 0, 0);
  font-size: 18px;
  padding: 15px;
  margin: 10px 0;
  opacity: 1;
  border: 2px solid rgb(109, 120, 118);
  border-radius: 20px;
}

.button-area {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  min-height: 30px;
}

.button-input {
  background-color: #add8e6;
  color: rgb(0, 0, 0);
  font-size: 18px;
  padding: 15px;
  margin: 10px 0;
  opacity: 1;
  border: 2px solid rgb(109, 120, 118);
  border-radius: 20px;
  cursor: pointer;
  display: flex;
}

.button-input:hover {
  background-color: #80cee7;
}
.button-input:active {
  background-color: #00b7ff;
  box-shadow: 0 5px gray;
  transform: translateY(2px);
}

.card {
  color: rgb(0, 0, 0);
  font-size: 38px;
  padding: 20px 15px 20px 15px;
  border-bottom: 1px solid rgb(216, 215, 215);
  opacity: 1;
  display: flex;
  align-items: flex-start;
  flex-direction: row;
}

.text {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.avatar {
  /* display: block; */
  width: 30px;
  height: 30px;
  margin: 0 20px 0 0;
  border-radius: 999px;
}
.card .from {
  padding: 8px 0;
  font-weight: bolder;
  font-size: 15px;
}

.card .time {
  font-size: 15px;
  margin-top: 10px;
  color: rgb(158, 158, 158);
}

.card .message {
  /* padding: 8px 0; */
  font-size: 18px;
}

.reroll {
  float: right;
  cursor: pointer;
}

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) {
  body {
    padding: 0 100px;
  }
}

/* Medium devices (tablets, 768px and up) The navbar toggle appears at this breakpoint */
@media (min-width: 768px) {
  body {
    padding: 0 150px;
  }
}

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) {
  body {
    padding: 0 250px;
  }
}

/* Extra large devices (large desktops, 1200px and up) */
@media (min-width: 1200px) {
  body {
    padding: 0 400px;
  }
}
</style>
