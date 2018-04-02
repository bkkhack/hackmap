<template>
  <div class="header-bar">
    <h1>{{mainThread.title}}</h1>
    <div class="header-bar-links">
      <a class="help-icon">Help<div class="help-text" v-html="mainThread.helpHtml"></div></a>
      <a class="account-status" v-if="user.username" @click="logout" v-cloak>{{user.username}} (Log out)</a>
      <a class="account-status" v-else title="Log in with GitHub" @click="login" v-cloak>Log in</a>
    </div>
  </div>
</template>
<script>
export default {
  name: 'header-bar',
  props: ['mainThread', 'user'],
  methods: {
    login () {
      this.$emit('login')
    },
    logout () {
      this.$emit('logout')
    }
  }
}
</script>

<style>
h1 {
  display:block;
  font-weight:normal;
  font-size:24pt;
  margin: 0 auto;
  user-select: none;
  text-align:center;
  flex:1;
}
.header-bar {
  position:relative;
  background-color:#fff;
  color:#2B5285;
  display:flex;
  align-items: center;
}
.header-bar-links {
  position:absolute;
  right:0;
}
.header-bar-links > a {
  /* cover the h1 if we've ran out of room */
  background-color:#fff;
  color:#2B5285;
}
.account-status {
  background-repeat:no-repeat;
  background-size:20px;
  background-image:url("https://assets-cdn.github.com/favicon.ico");
  background-position:left;
  padding:5px 15px 5px 25px;
}
.help-icon {
  padding:20px;
}
.help-icon .help-text {
  position:absolute;
  right:15px;
  background-color: rgba(34, 34, 34, 0.9);
  box-shadow:0 0 4px #444;
  color:#fff;
  width:300px;
  font-weight:normal;
  z-index:2;
  padding:10px;
  transform: translate(-0%, -50%) scale(0);
  will-change:transform;
  transition: transform 150ms ease-in-out;
  transition-delay: 500ms;
}
.help-icon:hover .help-text {
  transform: translate(0, 0) scale(1);
}
</style>
