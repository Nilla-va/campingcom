
const form = document.getElementById('userForm')
const username = document.getElementById('username')
const email = document.getElementById('email')
const password = document.getElementById('password')

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


username.addEventListener('input', function () {

    form.classList.remove('was-validated')

    if (username.value.length < 2) {
        username.classList.add('is-invalid')
        username.classList.remove('is-valid')
    } else if (username.value.length < 16) {
        username.classList.add('is-valid')
        username.classList.remove('is-invalid')
    } else {
        username.classList.add('is-invalid')
        username.classList.remove('is-valid')
    }
})

email.addEventListener('input', function () {

    form.classList.remove('was-validated')

    if (emailRegex.test(email.value)) {
        email.classList.add('is-valid')
        email.classList.remove('is-invalid')
    } else {
        email.classList.add('is-invalid')
        email.classList.remove('is-valid')
    }

})

password.addEventListener('input', function () {

    form.classList.remove('was-validated')

    if (password.value.length < 8) {
        password.classList.add('is-invalid')
        password.classList.remove('is-valid')
    } else if (password.value.length < 31) {
        password.classList.add('is-valid')
        password.classList.remove('is-invalid')
    } else {
        password.classList.add('is-invalid')
        password.classList.remove('is-valid')
    }
})

form.addEventListener('submit', function (event) {

    let allValid = true;

    form.querySelectorAll('input').forEach(input => {
        if (!(input.classList.contains('is-valid'))) allValid = false;
    })
    
    if (!allValid) {
        event.preventDefault()
        event.stopPropagation()
    } 
    
    form.classList.add('was-validated')
})