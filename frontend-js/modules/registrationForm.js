import axios from "axios";

export default class RegistrationForm {
  constructor() {
    this._csrf = document.querySelector('[name="_csrf"]').value;
    this.form = document.querySelector("#registration-form");
    this.allFields = document.querySelectorAll(
      "#registration-form .formControl",
    );
    this.insertValidationElements();
    this.username = document.querySelector("#username-register");
    this.username.previusValue = "";
    this.username.isUnique = false;
    this.email = document.querySelector("#email-register");
    this.email.previusValue = "";
    this.email.isUnique = false;
    this.password = document.querySelector("#password-register");
    this.password.previusValue = "";
    this.events();
  }

  /* EVENTS */
  events() {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.formSubmitHandler();
    });
    this.username.addEventListener("keyup", () => {
      this.isDifferent(this.username, this.usernameHandler);
    });
    this.email.addEventListener("keyup", () => {
      this.isDifferent(this.email, this.emailHandler);
    });
    this.password.addEventListener("keyup", () => {
      this.isDifferent(this.password, this.passwordHandler);
    });
    this.username.addEventListener("blur", () => {
      this.isDifferent(this.username, this.usernameHandler);
    });
    this.email.addEventListener("blur", () => {
      this.isDifferent(this.email, this.emailHandler);
    });
    this.password.addEventListener("blur", () => {
      this.isDifferent(this.password, this.passwordHandler);
    });
  }

  /* METHODS */

  formSubmitHandler() {
    this.usernameImmediately();
    this.usernameAfterDelay();
    this.emailAfterDelay();
    this.passwordImmediately();
    this.passwordAfterDelay();

    if (
      this.username.isUnique &&
      !this.username.errors &&
      this.email.isUnique &&
      !this.email.errors &&
      !this.email.password
    ) {
      this.form.submit();
    }
  }

  isDifferent(element, handler) {
    if (element.previusValue !== element.value) {
      handler.call(this);
    }
    element.previusValue = element.value;
  }

  usernameHandler() {
    this.username.errors = false;
    this.usernameImmediately();
    clearTimeout(this.username.timer);
    this.username.timer = setTimeout(() => {
      this.usernameAfterDelay();
    }, 800);
  }

  emailHandler() {
    this.email.errors = false;
    clearTimeout(this.email.timer);
    this.email.timer = setTimeout(() => {
      this.emailAfterDelay();
    }, 800);
  }

  passwordHandler() {
    this.password.errors = false;
    this.passwordImmediately();
    clearTimeout(this.password.timer);
    this.password.timer = setTimeout(() => {
      this.passwordAfterDelay();
    }, 800);
  }

  usernameImmediately() {
    if (
      this.username.value !== "" &&
      !/^([a-zA-Z0-9]+)$/.test(this.username.value)
    ) {
      this.showValidationError(
        this.username,
        "Username can only contain letters and numbers!",
      );
    }

    if (this.username.value.length > 15) {
      this.showValidationError(
        this.username,
        "Username cannot exceed 15 characters",
      );
    }

    if (!this.username.errors) {
      this.hideValidationError(this.username);
    }
  }

 usernameAfterDelay() {
    if (this.username.value.length < 3) {
      this.showValidationError(
        this.username,
        "Username must be at least 3 characters",
      );
    }

    if (!this.username.errors) {
      axios
        .post("/doesUsernameExist", {
          _csrf: this._csrf,
          username: this.username.value,
        })
        .then((response) => {
          if (response.data) {
            this.showValidationError(this.username, "Username already exists dooowwn");
            this.username.isUnique = false;
          } else {
            this.username.isUnique = true;
          }
        })
        .catch(() => {
          console.log("Please try again later.");
        });
    }
  }

  emailAfterDelay() {
    if (!/^\S+@\S+$/.test(this.email.value)) {
      this.showValidationError(
        this.email,
        "You must provide a valid email address",
      );
    }
    if (!this.email.errors) {
      axios
        .post("/doesEmailExist", {
          email: this.email.value,
        })
        .then((response) => {
          if (response.data) {
            this.showValidationError(this.email, "Email already exists");
            this.email.isUnique = false;
            this.hideValidationError(this.email);
          } else {
            this.email.isUnique = true;
            this.hideValidationError(this.email);
          }
        })
        .catch(() => {
          console.log("Please try again later");
        });
    }
  }

  passwordImmediately() {
    if (this.password.value.length > 25) {
      this.showValidationError(
        this.password,
        "Password cannot exceed 25 characters",
      );
    }
    if (!this.password.errors) {
      this.hideValidationError(this.password);
    }
  }

  passwordAfterDelay() {
    if (this.password.value.length < 8) {
      this.showValidationError(
        this.password,
        "Password must be at least 8 characters or more",
      );
    }
  }

  showValidationError(element, message) {
    element.nextSibling.innerHTML = message;
    element.nextSibling.classList.add("liveValidateMessage__visible");
    element.errors = true;
  }

  hideValidationError(element) {
    element.nextSibling.classList.remove("liveValidateMessage__visible");
  }

  insertValidationElements() {
    this.allFields.forEach((item) => {
      item.insertAdjacentHTML(
        "afterend",
        "<div class='alert alert__danger alert__small liveValidateMessage'></div>",
      );
    });
  }
}
