import axios from "axios";
import DOMPurify from "dompurify";

export default class Search {
  constructor() {
    this.injectHTML();
    this.headerSearchIcon = document.querySelector(".header-search-icon");
    this.headerCloseOverlayIcon = document.querySelector(
      ".searchOverlay__top--close",
    );
    this.overlay = document.querySelector(".searchOverlay");
    this.searchInput = document.querySelector("#live-search-field");
    this.resultsArea = document.querySelector(".liveSearchResults");
    this.loaderIcon = document.querySelector(".circleLoader");
    this.events();
    this.typingWaitTimer;
    this.previousValue = "";
  }

  events() {
    this.searchInput.addEventListener("keyup", () => {
      this.keyPressHandler();
    });
    this.headerSearchIcon.addEventListener("click", (event) => {
      event.preventDefault();
      this.openSesami();
    });
    this.headerCloseOverlayIcon.addEventListener("click", () => {
      this.closeSesami();
    });
  }

  // 3. Methods
  keyPressHandler() {
    let value = this.searchInput.value;
    if (value === "") {
      clearTimeout(this.typingWaitTimer);
      this.hideLoaderIcon();
      this.hideResultsArea();
    }
    if (value !== "" && value !== this.previousValue) {
      clearTimeout(this.typingWaitTimer);
      this.showLoaderIcon();
      this.hideResultsArea();
      this.typingWaitTimer = setTimeout(() => {
        this.sendRequest();
      }, 750);
    }

    this.previousValue = value;
  }

  sendRequest() {
    axios
      .post("/search", {
        searchTerm: this.searchInput.value,
      })
      .then((response) => {
        console.log(response.data);
        this.renderResultsHTML(response.data);
      })
      .catch(() => {
        alert("request failed");
      });
  }

  renderResultsHTML(posts) {
    if (posts.length) {
      this.resultsArea.innerHTML = DOMPurify.sanitize(`
        <div class="liveSearchResults__list">
          <div class="liveSearchResults__list--title">
            <strong> Search Results </strong>&nbsp;(${
              posts.length > 1
                ? `${[posts.length]} items found`
                : "1 item found"
            })
          </div>
            <ul class="liveSearchResults__list--items">
            ${posts
              .map((post) => {
                let postDate = new Date(post.createdDate);
                return `<li>
                <a href="/post/${post.id}"
                  ><img
                    src="${post.avatar}"
                    class="avatar-tiny"
                  /><strong>${post.title}</strong
                  ><span>
                    by ${post.username} on ${
                  postDate.getMonth() + 1
                }/${postDate.getDate()}/${postDate.getFullYear()}</span
                ></span
                  ></a
                >
              </li>`;
              })
              .join("")}
          </ul>
        </div>`);
    } else {
      this.resultsArea.innerHTML = `
        <h2>No results found, please try another search</h2>
      `;
    }
    console.log(posts);
    this.hideLoaderIcon();
    this.showResultsArea();
  }

  showLoaderIcon() {
    this.loaderIcon.classList.add("circleLoader__visible");
  }

  hideLoaderIcon() {
    this.loaderIcon.classList.remove("circleLoader__visible");
  }

  showResultsArea() {
    this.resultsArea.classList.add("liveSearchResults__visible");
  }

  hideResultsArea() {
    this.resultsArea.classList.remove("liveSearchResults__visible");
  }

  openSesami() {
    this.overlay.classList.add("searchOverlay__visible");
    setTimeout(() => {
      this.searchInput.focus();
    }, 50);
  }

  closeSesami() {
    this.overlay.classList.remove("searchOverlay__visible");
  }

  injectHTML() {
    const overlayHTML = `
      <div class="searchOverlay">
        <div class="searchOverlay__top">
          <div class="mainContainer mainContainer__narrow">
            <label
              for="live-search-field"
              class="searchOverlay__top--icon"
              ><i class="fas fa-search"></i
            ></label>
            <input
              type="text"
              id="live-search-field"
              class="searchOverlay__top--input"
              placeholder="What are you interested in?"
            />
            <span class="searchOverlay__top--close"
              ><i class="fas fa-times-circle"></i
            ></span>
          </div>
        </div>
        <div class="searchOverlay__bottom">
          <div class="mainContainer mainContainer__narrow">
            <div
              class="circleLoader"
            ></div>
            <div class="liveSearchResults"></div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", overlayHTML);
  }
}
