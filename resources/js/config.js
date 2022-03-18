const container_status = document.getElementById('container_status');
const btn_status = document.getElementById('btn_save');
const txt_status = document.getElementById('txt_status');
const img_status_success = document.getElementById('img_success');
const img_status_error = document.getElementById('img_error');
const img_status = document.querySelectorAll('.img-status');
let timeout = 0;
let lang = 'en';

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get({keyword_to_exit: 'exitkiosk', lang_app: 'en'}, (result) => {
        document.getElementById('keyword_to_exit').value = result.keyword_to_exit;
        document.getElementById('language_app').value = result.lang_app;
        lang = result.lang_app;
        applyLang();
    });
});

btn_status.addEventListener('click', () => {
    try {
        const keyword = document.getElementById('keyword_to_exit').value;
        const lang_app = document.getElementById('language_app').value;
        lang = lang_app;
        applyLang();
        chrome.storage.sync.set({keyword_to_exit: keyword, 'lang_app': lang_app}, () => {
            hideImg();
            container_status.classList.remove('hidden');
            txt_status.textContent = __("Configuration saved.");
            img_status_success.classList.remove('hidden');
            restore();
        });
    } catch (e) {
        hideImg();
        img_status_error.classList.remove('hidden');
        txt_status.textContent = __("Error saving configuration.");
        container_status.classList.remove('hidden');
    }
});

function hideImg() {
    for (let i = 0; i < img_status.length; i++) {
        img_status[i].classList.add('hidden');
    }
}

function restore() {
    if (timeout !== 0) {
        clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
        container_status.classList.add('hidden');
        hideImg();
        img_status_success.classList.remove('hidden');
        txt_status.textContent = '';
    }, 5e3);
}

/**
 * This function translate the content put inside of key
 * ``` javascript
 * __("translate this")
 * ```
 * @author danidoble <Daniel Sandoval>
 * @function
 * @param {string} key string in some language to translate to other language
 * @return {string|*}
 */
function __(key = "") {
    switch (lang) {
        case "es":
            return (typeof es_lang === "undefined" || !es_lang[key]) ? key : es_lang[key];
        case "ja":
            return (typeof ja_lang === "undefined" || !ja_lang[key]) ? key : ja_lang[key];
        case "ko":
            return (typeof ko_lang === "undefined" || !ko_lang[key]) ? key : ko_lang[key];
        case "zh":
            return (typeof zh_lang === "undefined" || !zh_lang[key]) ? key : zh_lang[key];
        case "fr":
            return (typeof fr_lang === "undefined" || !fr_lang[key]) ? key : fr_lang[key];
        default:
            return key;
    }
}

function applyLang() {
    let title = document.querySelectorAll('.lang_title');
    let word_label = document.querySelectorAll('.lang_word_label');
    let word_p = document.querySelectorAll('.lang_word_p');
    let txt_save = document.querySelectorAll('.lang_save');
    let credits = document.querySelectorAll('.lang_credits');
    let version = document.querySelectorAll('.lang_version');
    let lang_t = document.querySelectorAll('.lang_lang');
    for (let i = 0; i < title.length; i++) {
        title[i].textContent = __("Exit Kiosk");
    }
    for (let i = 0; i < word_label.length; i++) {
        word_label[i].textContent = __("Keyword to exit of kiosk mode");
    }
    for (let i = 0; i < word_p.length; i++) {
        word_p[i].textContent = __("Type the word you want to use to exit kiosk mode.");
    }
    for (let i = 0; i < txt_save.length; i++) {
        txt_save[i].textContent = __("Save");
    }
    for (let i = 0; i < credits.length; i++) {
        credits[i].textContent = __("Created by danidoble.");
    }
    for (let i = 0; i < version.length; i++) {
        version[i].textContent = __("Version");
    }
    for (let i = 0; i < lang_t.length; i++) {
        lang_t[i].textContent = __("Language");
    }
}