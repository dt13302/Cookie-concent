(function () {
  /**
   * @param {HTMLElement} [root]
   * @returns {Object}
   */
  var CookieConsent = function (root) {
    var _cookieconsent = {};
    var _userSettings;
    var consent_popup_exists = false;
    var invalid_consent = false;
    var all_blocks;
    var saved_cookie_content = {};
    var all_categories = [];
    var consent_uuid;
    var _config = {
      current_lang: "en",
      cookie_name: "cookie_accept",
      cookie_expiration: 180,
      cookie_path: "/",
      cookie_domain: window.location.hostname,
      autoclear_cookies: true,
    };
    var /** @type {HTMLElement} */ cc_container,
      /** @type {HTMLElement} */ cc_popup,
      /** @type {HTMLElement} */ cc_popup_title,
      /** @type {HTMLElement} */ cc_popup_description,
      /** @type {HTMLElement} */ cc_primary_btn,
      /** @type {HTMLElement} */ cc_secondary_btn,
      /** @type {HTMLElement} */ cc_btn;

    var _setUserSetting = function (userSettings) {
      _userSettings = userSettings;
    };

    var _createNode = function (type) {
      var element = document.createElement(type);
      if (type === "button") {
        element.setAttribute("type", type);
      }
      return element;
    };

    var _addClass = function (element, classname) {
      element.classList.add(classname);
    };

    var _removeClass = function (element, classname) {
      element.classList.remove(classname);
    };

    var _addEvent = function (element, event, fn) {
      element.addEventListener(event, fn);
    };

    var _createCookieContainer = function () {
      cc_container = _createNode("div");
      _addClass(cc_container, "cc-container");
      if (consent_popup_exists) {
        _createCookiePopup(_config.current_lang);
      }
      _createSettingsModal(_config.current_lang);
      (root || document.body).appendChild(cc_container);
    };

    var _createCookiePopup = function (lang) {
      if (!cc_popup) {
        cc_popup = _createNode("div");
        cc_popup.id = "cookiePopup";
        _addClass(cc_popup, "hide-cookieconsent");

        var cc_popup_title_value =
          _userSettings.languages[lang]["consent_modal"]["title"];
        if (cc_popup_title_value) {
          if (!cc_popup_title) {
            cc_popup_title = _createNode("div");
            _addClass(cc_popup_title, "cc-title");
            cc_popup.appendChild(cc_popup_title);
          }
          cc_popup_title.innerHTML = cc_popup_title_value;
        }

        var cc_popup_description_value =
          _userSettings.languages[lang]["consent_modal"]["description"];
        if (cc_popup_description_value) {
          if (!cc_popup_description) {
            cc_popup_description = _createNode("div");
            _addClass(cc_popup_description, "cc-text");
            cc_popup.appendChild(cc_popup_description);
          }
          cc_popup_description.innerHTML = cc_popup_description_value;
        }

        var cc_primary_btn_value =
          _userSettings.languages[lang]["consent_modal"]["primary_btn"];
        if (cc_primary_btn_value) {
          if (!cc_primary_btn) {
            cc_primary_btn = _createNode("button");
            _addClass(cc_primary_btn, "c-btn");
            _addClass(cc_primary_btn, "cc-p-btn");
            var acceptType;
            if (cc_primary_btn_value["role"] === "accept_all") {
              acceptType = "all";
            }
            _addEvent(cc_primary_btn, "click", function () {
              _cookieconsent.hide();
              log("CookieConsent [ACCEPT]: cookie_consent was accepted!");
              _cookieconsent.accept(acceptType);
            });
          }
          cc_primary_btn.innerHTML = cc_primary_btn_value["text"];
        }

        var cc_secondary_btn_value =
          _userSettings.languages[lang]["consent_modal"]["secondary_btn"];
        if (cc_secondary_btn_value) {
          if (!cc_secondary_btn) {
            cc_secondary_btn = _createNode("button");
            _addClass(cc_secondary_btn, "c-btn");
            _addClass(cc_secondary_btn, "cc-s-btn");
            if (cc_secondary_btn_value["role"] === "accept_necessary") {
              _addEvent(cc_secondary_btn, "click", function () {
                log(
                  "CookieConsent [ACCEPT NECESSARY]: cookie_consent was accepted!"
                );
              });
            } else {
              _addEvent(cc_secondary_btn, "click", function () {
                log("CookieConsent [Setting]: Show setting");
              });
            }
          }
          cc_secondary_btn.innerHTML = cc_secondary_btn_value["text"];
        }

        if (!cc_btn) {
          cc_btn = _createNode("div");
          _addClass(cc_btn, "cc-btn");
          cc_primary_btn_value && cc_btn.appendChild(cc_primary_btn);
          cc_secondary_btn_value && cc_btn.appendChild(cc_secondary_btn);
          (cc_primary_btn_value || cc_secondary_btn_value) &&
            cc_popup.appendChild(cc_btn);
        }
      }
      cc_container.appendChild(cc_popup);
    };

    var _createSettingsModal = function (lang) {
      all_blocks = _userSettings.languages[lang]["settings_modal"]["blocks"];
      for (var i = 0; i < all_blocks.length; i++) {
        var title_data = all_blocks[i]["title"],
          description_data = all_blocks[i]["description"],
          toggle_data = all_blocks[i]["toggle"],
          cookie_table_data = all_blocks[i]["cookie_table"];

        if (typeof toggle_data !== "undefined") {
          var cookie_category = toggle_data.value;
          all_categories.push(cookie_category);
        }
      }
    };

    var _getCookie = function (name, fillter, getvalue) {
      var cookie;
      if (fillter === "one") {
        cookie = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
        cookie = cookie ? (getvalue ? cookie.pop() : name) : " ";
        if (cookie && name === _config.cookie_name) {
          try {
            cookie = JSON.parse(cookie);
          } catch (e) {
            try {
              cookie = JSON.parse(decodeURIComponent(cookie));
            } catch (e) {
              cookie = {};
            }
          }
          cookie = JSON.stringify(cookie);
        }
      }
      return cookie;
    };

    var _saveCookieSetting = function (categories_accept) {
      if (!consent_uuid) consent_uuid = _uuidv4();
      saved_cookie_content = {
        categories: categories_accept,
        consent_uuid: consent_uuid,
      };
      if (invalid_consent) {
        _setCookie(_config.cookie_name, JSON.stringify(saved_cookie_content));
      }
    };

    var _setCookie = function (name, value) {
      var cookie_expiration = _config.cookie_expiration;
      var date = new Date();
      date.setTime(date.getTime() + 1000 * (cookie_expiration * 24 * 60 * 60));
      var expires = "; expires=" + date.toUTCString();
      var cookieStr =
        name +
        "=" +
        (value || "") +
        expires +
        "; Path=" +
        _config.cookie_path +
        ";";
      if (window.location.hostname.indexOf(".") > -1) {
        cookieStr += " Domain=" + _config.cookie_domain + ";";
      }
      document.cookie = cookieStr;
    };

    var _uuidv4 = function () {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(
        /[018]/g,
        function (c) {
          return (
            c ^
            ((window.crypto || window.msCrypto).getRandomValues(
              new Uint8Array(1)
            )[0] &
              (15 >> (c / 4)))
          ).toString(16);
        }
      );
    };

    _cookieconsent.run = function (userSettings) {
      log("Cookie Consent Run!!");
      _setUserSetting(userSettings);
      saved_cookie_content = JSON.parse(
        _getCookie(_config.cookie_name, "one", true) || {}
      );
      consent_uuid = saved_cookie_content["consent_uuid"];
      var cookie_consent_accepted = consent_uuid !== undefined;
      consent_popup_exists = invalid_consent = !cookie_consent_accepted;
      _createCookieContainer();
      if (consent_popup_exists) {
        _cookieconsent.show();
      }
    };

    _cookieconsent.show = function () {
      if (consent_popup_exists) {
        setTimeout(function () {
          _removeClass(cc_popup, "hide-cookieconsent");
          _addClass(cc_popup, "show-cookieconsent");
          log("CookieConsent [MODAL]: show consent_modal");
        }, 1000);
      }
    };

    _cookieconsent.hide = function () {
      if (consent_popup_exists) {
        _removeClass(cc_popup, "show-cookieconsent");
        _addClass(cc_popup, "hide-cookieconsent");
        log("CookieConsent [MODAL]: hide consent_modal");
      }
    };

    _cookieconsent.accept = function (categories) {
      var _categories = categories || "undefined";
      var to_accept = [];
      if (!categories) {
        to_accept = null;
      } else {
        if (typeof categories === "string") {
          if (categories === "all") {
            to_accept = all_categories.slice();
          }
        }
      }

      _saveCookieSetting(to_accept);
    };

    var log = function (msg) {
      console.log(msg);
    };

    return _cookieconsent;
  };

  var init = "cookieConsentInit";
  if (typeof window[init] !== "function") {
    window[init] = CookieConsent;
  }
})();
