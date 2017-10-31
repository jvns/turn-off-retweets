  var app4;
  var deleteme;
  var tl;
  Vue.config.delimiters = ['${', '}']

  function makeSet(ids) {
    var set = {};
    for (var i = 0; i < ids.length; i++) {
      set[ids[i]] = 1;
    }
    return set;
  }

  function clearCache() {
    localStorage.removeItem("no_retweets");
    localStorage.removeItem("friends");
    window.location.reload(false);
  }

  function sortByFunction(list, f) {
    list.sort(function(a, b) {
      f(a) - f(b)
    })
  }

  function displayFriends(friends, no_retweets, app4) {
    var no_retweets = makeSet(no_retweets);
    friends = friends.sort(function(a, b) {
      var c1 = a.statuses_count;
      var c2 = b.statuses_count;
      if (c1 == null) {
        return 1
      } else if (c2 == null) {
        return -1
      } else if (c1 > c2) {
        return -1;
      } else if (c1 < c2) {
        return 1;
      } else {
        return 0;
      }
    });
    app4.friends = friends;
    app4.no_retweets = no_retweets;
    return app4;

  }

  function deserialize(data) {
    data = JSON.parse(data);
    if (data && data['updated'] >= (+new Date()) - 15 * 60 * 1000) {
      return data['data'];
    }
  }

  function serialize(data) {
    return JSON.stringify({
      updated: (+new Date()),
      data: data
    })
  }

  function getOrCache(cacheId, url, callback, transform) {
    var stored = deserialize(localStorage.getItem(cacheId));
    if (stored) {
      callback(stored);
    } else {
      $.get(url, function(resp) {
        friends = JSON.parse(resp);
        if (transform) {
          friends = transform(friends);
        }
        localStorage.setItem(cacheId, serialize(friends));
        callback(friends);
      })
    }
  }

  function toggleRetweets(target) {
    var i;
    for (i = 0; i < app4.friends.length; i++) {
      app4.updateRetweets(target, app4.friends[i].screen_name);
    }
  }

  function filterTimeline(timeline) {
    var tweets_24h = 0
    var tweets_week = 0;
    for (var i = 0; i < timeline.length; i++) {
      created = Date.parse(timeline[i].created_at)
      if (created > (+new Date()) - 24 * 60 * 60 * 1000) {
        tweets_24h += 1;
      }
      if (created > (+new Date()) - 7 * 24 * 60 * 60 * 1000) {
        tweets_week += 1;
      }
    }
    return {
      count_24h: tweets_24h,
      count_week: tweets_week
    }
  }

  function getTimelines(app4, friends) {
    for (var i = 0; i < friends.length; i++) {
      var friend = friends[i];
      getOrCache("timeline_" + friend.screen_name, "/user_timeline.json?screen_name=" + friend.screen_name, function(data) {
        Vue.set(app4.tweet_info, friend.screen_name, data);
        sortByFunction(app4.friends, function(x) {
          return 0;
        })
      }, filterTimeline);
    }
  }

  function main() {
    app4 = new Vue({
      el: '#app-4',
      delimiters: ['${', '}'],
      data: {
        friends: null,
        message: 5,
        no_retweets: null,
        retweets_change: {}
      },
      methods: {
        updateRetweets: function(status, screen_name) {
          var self = this;
          $.get('/update_friendship?retweets=' + status + '&screen_name=' + screen_name, function() {
            Vue.set(self.retweets_change, screen_name, true)
            console.log(self.retweets_change);
          })

        }
      }
    });

    getOrCache("friends", "/users.json", function(friends) {
      getOrCache("no_retweets", "/no_retweets.json", function(no_retweets) {

        displayFriends(friends, no_retweets, app4);
      })
    })
  }
  $(document).ready(main)
