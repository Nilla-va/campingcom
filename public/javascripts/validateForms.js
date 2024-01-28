
// 비어있는 인풋이 있을 경우 폼제출을 막는 JS코드(부트스트랩 제공)

(() => {

    'use strict'
  
    const forms = document.querySelectorAll('.needs-validation')

    Array.from(forms).forEach(form => {

        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }
            form.classList.add('was-validated')
        }, false)
    })

})()


