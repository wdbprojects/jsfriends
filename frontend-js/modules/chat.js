import DOMPurify from "dompurify";

export default class Chat {
  constructor() {
    this.openedYet = false;
    this.chatWrapper = document.querySelector("#chatWrapper");
    this.injectHTML();
    this.chatBody = document.querySelector("#chatBody");
    this.chatField = document.querySelector("#chatField");
    this.chatForm = document.querySelector("#chatForm");
    this.headerChatIcon = document.querySelector(".header-chat-icon");
    this.chatIconClose = document.querySelector(".chat__header--closeIcon");
    this.events();
  }

  events() {
    this.chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this.sendMessageToServer();
    });

    this.headerChatIcon.addEventListener("click", () => {
      if (!this.openedYet) {
        this.openConnection();
      }
      this.openedYet = true;
      this.showChat();
    });
    this.chatIconClose.addEventListener("click", () => {
      this.closeChat();
    });
  }

  sendMessageToServer() {
    this.socket.emit("chatMessageFromBrowser", {
      message: this.chatField.value,
    });
    this.chatField.focus();
    const chatBodyHTML = DOMPurify.sanitize(`
      <div class="chat__body--self">
        <div class="chat__body--self-message">
          <div class="chat__body--self-message-inner">
            <span>${this.chatField.value}</span>
          </div>
        </div>
        <img
          class="chat__body--self-avatar avatar-tiny"
          src="${this.avatar}"
        />
      </div>
    `);
    this.chatBody.insertAdjacentHTML("beforeend", chatBodyHTML);
    this.chatBody.scrollTop = this.chatBody.scrollHeight;
    this.chatField.value = "";
    this.chatField.focus();
  }

  showChat() {
    this.chatWrapper.classList.toggle("chat__visible");
    this.chatField.focus();
  }
  closeChat() {
    this.chatWrapper.classList.toggle("chat__visible");
  }

  openConnection() {
    this.socket = io();
    this.socket.on("welcome", (data) => {
      (this.username = data.username), (this.avatar = data.avatar);
    });
    this.socket.on("chatMessageFromServer", (data) => {
      this.displayMessageFromServer(data);
    });
  }

  displayMessageFromServer(data) {
    const chatBodyHTML = `
      <div class="chat__body--other">
        <a href="/profile/${data.username}"
          ><img
            class="chat__body--other-avatar avatar-tiny"
            src="${data.avatar}"
        /></a>
        <div class="chat__body--other-message">
          <div class="chat__body--other-message-inner">
            <a href="/profile/${data.username}"><strong>${data.username}:</strong>&nbsp;</a>
            <span>${data.message}</span>
          </div>
        </div>
      </div>
    `;

    this.chatBody.insertAdjacentHTML("beforeend", chatBodyHTML);
    this.chatBody.scrollTop = this.chatBody.scrollHeight;
  }

  injectHTML() {
    const chatFeature = `
      <div class="chat__header">
        <h3 class="chat__header--title">Chat</h3>
        <span class="chat__header--closeIcon"
          ><i class="fas fa-times-circle"></i
        ></span>
      </div>

      <div id="chatBody" class="chat__body"></div>

      <form id="chatForm" class="chatForm">
        <input
          type="text"
          class="chatForm__field"
          id="chatField"
          autocomplete="off"
          placeholder="Type a message..."
        />
      </form>
    `;
    this.chatWrapper.insertAdjacentHTML("afterbegin", chatFeature);
  }
}
