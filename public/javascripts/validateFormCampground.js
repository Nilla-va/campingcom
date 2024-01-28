
const form = document.getElementById('campForm')
const price = document.getElementById('price')

const submit_btn = document.getElementById('submit')
const uploading = document.getElementById('uploading')

const priceRegex = /^\d+(\.\d{2,2})?$/;     // 자연수 또는 소수두자리 (달러)


form.querySelectorAll('input').forEach(input => {

    if (input.value.length > 0) {input.classList.add('is-valid')}

    input.addEventListener('input', function () {
        form.classList.remove('was-validated')
        if (input.value.length > 0) {
            input.classList.add('is-valid')
            input.classList.remove('is-invalid')
        } else {
            input.classList.add('is-invalid')
            input.classList.remove('is-valid')
        }
    })
})

form.querySelectorAll('textarea').forEach(input => {

    if (input.value.length > 0) {input.classList.add('is-valid')}

    input.addEventListener('input', function () {
        form.classList.remove('was-validated')
        if (input.value.length > 0) {
            input.classList.add('is-valid')
            input.classList.remove('is-invalid')
        } else {
            input.classList.add('is-invalid')
            input.classList.remove('is-valid')
        }
    })
})

price.addEventListener('input', function () {

    form.classList.remove('was-validated')

    if (priceRegex.test(price.value)) {
        price.classList.add('is-valid')
        price.classList.remove('is-invalid')
    } else {
        price.classList.add('is-invalid')
        price.classList.remove('is-valid')
    }
})

form.addEventListener('submit', function (event) {

    let allValid = true;

    form.querySelectorAll('input').forEach(input => {
        if (!(input.classList.contains('is-valid'))) allValid = false;
    })
    form.querySelectorAll('textarea').forEach(input => {
        if (!(input.classList.contains('is-valid'))) allValid = false;
    })

    if (!allValid) {
        event.preventDefault()
        event.stopPropagation()
    } else if (uploading !== null) {
        submit_btn.setAttribute('hidden', true)
        uploading.removeAttribute('hidden')
        console.log('UPLOADING IMAGES...')
    }

    form.classList.add('was-validated')
})

