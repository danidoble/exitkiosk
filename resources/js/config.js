import Alpine from 'alpinejs'

window.Alpine = Alpine
Alpine.start()
import {es_lang} from "./lang/es.js";
import {ja_lang} from "./lang/ja.js";
import {ko_lang} from "./lang/ko.js";
import {zh_cn_lang} from "./lang/zh_CN.js";
import {fr_lang} from "./lang/fr.js";

const container_status = document.getElementById('container_status');
const btn_status = document.getElementById('btn_save');
const txt_status = document.getElementById('txt_status');
const img_status_success = document.getElementById('img_success');
const img_status_error = document.getElementById('img_error');
const alert_type = document.getElementById('alert-type');
const img_status = document.querySelectorAll('.img-status');
const donate = document.getElementById('donate');
const donate_link = document.getElementById('donate-link');
const add_keyword = document.getElementById('add_keyword');
let timeout = 0;
let lang = 'en';

async function addInput(value = '') {
    const template_input = document.getElementById('template_keywords');
    const container_keywords = document.getElementById('container_keywords');
    const fragment = template_input.content.cloneNode(true);
    const input = fragment.querySelector('input');
    input.id = `keyword_${container_keywords.children.length}`;
    input.value = value;
    container_keywords.appendChild(input);
}

async function removeInputsKeywords() {
    const container_keywords = document.getElementById('container_keywords');
    while (container_keywords.firstChild) {
        container_keywords.removeChild(container_keywords.firstChild);
    }
}

async function renderInputsKeywords(keywords = []) {
    if (keywords.length === 0) { // to prevent empty array
        keywords.push('exitkiosk');
    }
    // duplicate input from template to match to configuration.keywords length
    for (let i = 0; i < keywords.length; i++) {
        await addInput(keywords[i]);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const configuration = await chrome.storage.sync.get({keywords: ['exitkiosk'], lang_app: 'en'});
    setLanguage(configuration.lang_app);

    await renderInputsKeywords(configuration.keywords);
});

function setLanguage(lang_app) {
    document.getElementById('language_app').value = lang_app;
    lang = lang_app;
    applyLang();
}

// add event listener to add keyword button
add_keyword.addEventListener('click', async () => {
    await addInput();
});

btn_status.addEventListener('click', async () => {
    try {
        // language app
        const lang_app = document.getElementById('language_app').value;
        setLanguage(lang_app);

        // get all keywords from inputs
        const keywords = document.querySelectorAll('.keyword-input');
        const keywords_array = [];
        keywords.forEach(keyword => {
            if (keyword.value.trim() !== '') {
                keywords_array.push(keyword.value);
            }
        });
        // make unique keywords, removing duplicates
        const uniqueKeywords = [...new Set(keywords_array)];
        await chrome.storage.sync.set({keywords: uniqueKeywords, lang_app});

        await removeInputsKeywords();
        await renderInputsKeywords(uniqueKeywords);

        hideImg();
        alert_type.classList.add('bg-teal-700', 'border-teal-400', 'text-teal-100');
        alert_type.classList.remove('bg-rose-700', 'border-rose-400', 'text-rose-100');
        container_status.classList.remove('hidden');
        container_status.classList.add('flex');
        txt_status.textContent = __("Configuration saved.");
        img_status_success.classList.remove('hidden');
        restore();
    } catch (e) {
        console.log(e)
        hideImg();
        alert_type.classList.remove('bg-teal-700', 'border-teal-400', 'text-teal-100');
        alert_type.classList.add('bg-rose-700', 'border-rose-400', 'text-rose-100');
        img_status_error.classList.remove('hidden');
        txt_status.textContent = __("Error saving configuration.");
        container_status.classList.remove('hidden');
        container_status.classList.add('flex');
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
        container_status.classList.remove('flex');
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
        case "zh_CN":
            return (typeof zh_cn_lang === "undefined" || !zh_cn_lang[key]) ? key : zh_cn_lang[key];
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
        word_label[i].textContent = __("Keywords to exit of kiosk mode");
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
    donate.textContent = __("If you feel like supporting this project, you can buy me a coffee or maybe a toast");
    donate_link.textContent = __("Donate");
    add_keyword.textContent = __("Add keyword");
}