const container_status = document.getElementById('container_status');
const btn_status = document.getElementById('btn_save');
const txt_status = document.getElementById('txt_status');
const img_status_success = document.getElementById('img_success');
const img_status_error = document.getElementById('img_error');
const img_status = document.querySelectorAll('.img-status');
let timeout = 0;

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get({keyword_to_exit: 'exitkiosk'}, (result) => {
        document.getElementById('keyword_to_exit').value = result.keyword_to_exit;
    });
});

btn_status.addEventListener('click', () => {
    try {
        const keyword = document.getElementById('keyword_to_exit').value;
        chrome.storage.sync.set({keyword_to_exit: keyword}, () => {
            hideImg();
            container_status.classList.remove('hidden');
            txt_status.textContent = 'Configuracion guardada.';
            img_status_success.classList.remove('hidden');
            restore();
        });
    } catch (e) {
        hideImg();
        img_status_error.classList.remove('hidden');
        txt_status.textContent = 'Error al guardar la configuracion.';
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